"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { AuthCardFrame } from "./auth-card-frame";
import { AuthInput } from "./auth-input";
import { AuthSubmitButton } from "./auth-submit-button";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 600; // 10 min — matches Clerk's default code lifetime

type Step = "email" | "code" | "password";

/**
 * Three-step password reset using Clerk's resetPasswordEmailCode flow.
 *
 *   step 1 "email"     → signIn.create({ identifier }) +
 *                        signIn.resetPasswordEmailCode.sendCode()
 *   step 2 "code"      → resetPasswordEmailCode.verifyCode({ code })
 *                        (code is single-use; after this call the sign-in
 *                        is in 'needs_new_password' state and verifyCode
 *                        can't be called again)
 *   step 3 "password"  → resetPasswordEmailCode.submitPassword({ password })
 *                        + signIn.finalize()
 *
 * Each step has its own submit handler and its own error state, so a
 * weak-password error in step 3 doesn't make us re-call verifyCode
 * (which would fail because the code is already consumed).
 *
 * Single-page state machine instead of three separate routes — Clerk's
 * signIn lives in client memory, so a hard navigation would lose it.
 */
export function ForgotPasswordCard() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => ""),
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<
    "email" | "password" | "confirm" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const isReady = !!signIn && fetchStatus !== "fetching";

  // Auto-focus the first code box when entering step 2; auto-focus
  // password box when entering step 3.
  useEffect(() => {
    if (step === "code") {
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [step]);

  // Code-lifetime countdown (visible on step 2).
  useEffect(() => {
    if (step !== "code" || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [step, secondsLeft]);

  function clearTransientUI() {
    setError(null);
    setNotice(null);
  }

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 5000);
  }

  // ── Step 1: send the reset code ─────────────────────────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    clearTransientUI();
    setIsLoading(true);

    const { error: createError } = await signIn.create({ identifier: email });
    if (createError) {
      setError(
        createError.longMessage ??
          createError.message ??
          "We couldn't find that email.",
      );
      setIsLoading(false);
      return;
    }

    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setError(
        sendError.longMessage ??
          sendError.message ??
          "Could not send reset code.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setSecondsLeft(RESEND_SECONDS);
    setStep("code");
    showNotice("Code sent. Check your inbox.");
  }

  // ── Step 2a: verify the 6-digit code (one-shot, code is consumed) ─
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Enter all 6 digits.");
      return;
    }

    clearTransientUI();
    setIsLoading(true);

    const { error: verifyError } =
      await signIn.resetPasswordEmailCode.verifyCode({ code });

    if (verifyError) {
      setError(
        verifyError.longMessage ??
          verifyError.message ??
          "Code is invalid or expired.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setStep("password");
  }

  // ── Step 2b: resend code (still in code-entry state) ────────────
  async function handleResendCode() {
    if (!signIn) return;
    clearTransientUI();
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setError(
        sendError.longMessage ??
          sendError.message ??
          "Could not resend code.",
      );
      return;
    }
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
    inputsRef.current[0]?.focus();
    showNotice("New code sent. Check your inbox.");
  }

  // ── Step 3: submit the new password, then sign in ───────────────
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    clearTransientUI();
    setIsLoading(true);

    const { error: submitError } =
      await signIn.resetPasswordEmailCode.submitPassword({ password });

    if (submitError) {
      // Clerk strength rules / pwned-password check / etc. land here.
      // We stay on the password step so the user can pick a stronger one
      // without losing the verified-code state.
      setError(
        submitError.longMessage ??
          submitError.message ??
          "Could not set new password.",
      );
      setIsLoading(false);
      return;
    }

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      setError(finalizeError.message ?? "Could not start session.");
      setIsLoading(false);
      return;
    }

    router.push("/");
  }

  // ── "Start over" — clear all state, drop back to email step ─────
  async function handleStartOver() {
    clearTransientUI();
    setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
    setPassword("");
    setConfirm("");
    setStep("email");
    if (signIn) {
      // Best-effort: clear Clerk's in-progress sign-in. Ignore errors —
      // worst case it's already cleared.
      await signIn.reset();
    }
  }

  // ── Code input helpers ──────────────────────────────────────────
  function setDigitAt(i: number, value: string) {
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 1);
    setDigits((d) => {
      const next = [...d];
      next[i] = cleaned;
      return next;
    });
    if (cleaned && i < CODE_LENGTH - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  }
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? "");
    setDigits(next);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputsRef.current[focusIdx]?.focus();
  }
  function handleCodeKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    i: number,
  ) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < CODE_LENGTH - 1)
      inputsRef.current[i + 1]?.focus();
  }

  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  // ──────────────────────────────────────────────────────────────────
  // STEP 1: EMAIL
  // ──────────────────────────────────────────────────────────────────
  if (step === "email") {
    return (
      <AuthCardFrame
        title="Reset your password"
        subtitle="Enter your email and we'll send you a 6-digit code"
      >
        <form onSubmit={handleSendCode} className="space-y-4">
          <AuthInput
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@goparkwell.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isFocused={focused === "email"}
            onFocusChange={(f) => setFocused(f ? "email" : null)}
            required
          />

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-parkwell-red/30 bg-parkwell-red/10 px-3 py-2 text-xs text-parkwell-red"
              role="alert"
            >
              {error}
            </motion.p>
          ) : null}

          <AuthSubmitButton isLoading={isLoading} disabled={!isReady} className="mt-2">
            Send reset code
          </AuthSubmitButton>

          <p className="pt-2 text-center text-xs text-white/60">
            Remembered it?{" "}
            <Link
              href="/sign-in"
              className="group/link relative font-medium text-white transition-colors duration-300 hover:text-white/70"
            >
              <span className="relative z-10">Back to sign in</span>
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-300 group-hover/link:w-full" />
            </Link>
          </p>
        </form>
      </AuthCardFrame>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // STEP 2: CODE
  // ──────────────────────────────────────────────────────────────────
  if (step === "code") {
    return (
      <AuthCardFrame
        title="Enter your code"
        subtitle={`We sent a 6-digit code to ${email}`}
      >
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={d}
                onChange={(e) => setDigitAt(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(e, i)}
                onPaste={handlePaste}
                className={cn(
                  "h-12 w-10 rounded-lg border border-white/15 bg-white/5 text-center text-lg font-semibold text-white",
                  "outline-none transition-all duration-200",
                  "focus:border-parkwell-blue/60 focus:bg-white/10 focus:ring-2 focus:ring-parkwell-blue/40",
                )}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-parkwell-red/30 bg-parkwell-red/10 px-3 py-2 text-center text-xs text-parkwell-red"
              role="alert"
            >
              {error}
            </motion.p>
          ) : null}

          {notice ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-parkwell-green/30 bg-parkwell-green/10 px-3 py-2 text-center text-xs text-parkwell-green"
              role="status"
            >
              {notice}
            </motion.p>
          ) : null}

          <div className="text-center text-xs text-white/50">
            Code expires in{" "}
            <span className="font-mono text-white/80">
              {mm}:{ss}
            </span>
          </div>

          <AuthSubmitButton isLoading={isLoading} disabled={!isReady}>
            Verify code
          </AuthSubmitButton>

          <div className="flex items-center justify-between pt-1 text-xs text-white/60">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={secondsLeft > RESEND_SECONDS - 30 || !isReady}
              className="font-medium text-white transition-colors hover:text-white/70 disabled:cursor-not-allowed disabled:text-white/30"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={handleStartOver}
              className="font-medium text-white transition-colors hover:text-white/70"
            >
              Use different email
            </button>
          </div>
        </form>
      </AuthCardFrame>
    );
  }

  // ──────────────────────────────────────────────────────────────────
  // STEP 3: NEW PASSWORD
  // ──────────────────────────────────────────────────────────────────
  return (
    <AuthCardFrame
      title="Set a new password"
      subtitle="Pick something strong — 8+ characters"
    >
      <form onSubmit={handleSetPassword} className="space-y-4">
        <AuthInput
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="new-password"
          placeholder="New password"
          icon={<Lock className="h-4 w-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-white/40 transition-colors duration-300 hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          isFocused={focused === "password"}
          onFocusChange={(f) => setFocused(f ? "password" : null)}
          required
          minLength={8}
        />

        <AuthInput
          type={showPassword ? "text" : "password"}
          name="confirm"
          autoComplete="new-password"
          placeholder="Confirm new password"
          icon={<Lock className="h-4 w-4" />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          isFocused={focused === "confirm"}
          onFocusChange={(f) => setFocused(f ? "confirm" : null)}
          required
          minLength={8}
        />

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-parkwell-red/30 bg-parkwell-red/10 px-3 py-2 text-xs text-parkwell-red"
            role="alert"
          >
            {error}
          </motion.p>
        ) : null}

        <AuthSubmitButton isLoading={isLoading} disabled={!isReady} className="mt-2">
          Set password & sign in
        </AuthSubmitButton>

        <div className="pt-2 text-center text-xs text-white/60">
          <button
            type="button"
            onClick={handleStartOver}
            className="font-medium text-white transition-colors hover:text-white/70"
          >
            Start over
          </button>
        </div>
      </form>
    </AuthCardFrame>
  );
}
