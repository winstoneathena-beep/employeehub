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

/**
 * Two-step password reset using Clerk's resetPasswordEmailCode flow.
 *   Step 1: user enters email → we ask Clerk to send a 6-digit reset code.
 *   Step 2: user enters the code + a new password → we verify the code,
 *           submit the new password, and finalize the session.
 *
 * Why one route with internal state instead of two routes: Clerk's
 * signIn client state lives in memory, so a full page navigation between
 * steps would lose it. Single page sidesteps the issue.
 */
export function ForgotPasswordCard() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [step, setStep] = useState<"email" | "reset">("email");
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
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const isReady = !!signIn && fetchStatus !== "fetching";

  useEffect(() => {
    if (step === "reset") inputsRef.current[0]?.focus();
  }, [step]);

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

  function handleKeyDown(
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

  // ── Step 1: ask Clerk to email a 6-digit reset code ─────────────
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    setError(null);
    setIsLoading(true);

    // First create the sign-in attempt with the email as the identifier.
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

    // Now request the reset code.
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
    setStep("reset");
    setNotice("Code sent. Check your inbox.");
    setTimeout(() => setNotice(null), 5000);
  }

  // ── Step 2: verify the code + submit the new password ──────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Enter all 6 digits.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
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

    const { error: submitError } =
      await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (submitError) {
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

  // Step 2: reset
  return (
    <AuthCardFrame
      title="Enter your code"
      subtitle={`We sent a 6-digit code to ${email}. Use it to set a new password.`}
      width="md"
    >
      <form onSubmit={handleResetPassword} className="space-y-5">
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
              onKeyDown={(e) => handleKeyDown(e, i)}
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

        <AuthInput
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="new-password"
          placeholder="New password (8+ characters)"
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

        <AuthSubmitButton isLoading={isLoading} disabled={!isReady}>
          Reset password & sign in
        </AuthSubmitButton>

        <div className="pt-1 text-center text-xs text-white/60">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
              setPassword("");
              setConfirm("");
              setError(null);
            }}
            className="font-medium text-white transition-colors hover:text-white/70"
          >
            Use a different email
          </button>
        </div>
      </form>
    </AuthCardFrame>
  );
}
