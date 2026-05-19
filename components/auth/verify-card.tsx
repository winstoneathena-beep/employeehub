"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AuthCardFrame } from "./auth-card-frame";
import { AuthSubmitButton } from "./auth-submit-button";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 600; // 10 min

export function VerifyCard() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => ""),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Enter all 6 digits.");
      return;
    }
    setError(null);
    setIsLoading(true);
    // TODO(clerk): replace with Clerk attemptEmailVerification once env keys are set
    setTimeout(() => {
      setIsLoading(false);
      router.push("/pending");
    }, 1200);
  }

  function handleResend() {
    // TODO(clerk): trigger resend once wired
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
    inputsRef.current[0]?.focus();
  }

  const mm = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <AuthCardFrame
      title="Verify your email"
      subtitle="We sent a 6-digit code to your inbox. Enter it below."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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

        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-parkwell-red/30 bg-parkwell-red/10 px-3 py-2 text-center text-xs text-parkwell-red"
          >
            {error}
          </motion.p>
        ) : null}

        <div className="text-center text-xs text-white/50">
          Code expires in{" "}
          <span className="font-mono text-white/80">
            {mm}:{ss}
          </span>
        </div>

        <AuthSubmitButton isLoading={isLoading}>Verify</AuthSubmitButton>

        <div className="pt-1 text-center text-xs text-white/60">
          Didn&apos;t get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > RESEND_SECONDS - 30}
            className="font-medium text-white transition-colors hover:text-white/70 disabled:cursor-not-allowed disabled:text-white/30"
          >
            Resend code
          </button>
        </div>
      </form>
    </AuthCardFrame>
  );
}
