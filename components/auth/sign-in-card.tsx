"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { AuthCardFrame } from "./auth-card-frame";
import { AuthInput } from "./auth-input";
import { AuthSubmitButton } from "./auth-submit-button";

export function SignInCard() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = !!signIn && fetchStatus !== "fetching";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    setIsLoading(true);
    setError(null);

    // Step 1: submit identifier + password
    const { error: pwError } = await signIn.password({
      identifier: email,
      password,
    });

    if (pwError) {
      setError(pwError.longMessage ?? pwError.message ?? "Sign in failed");
      setIsLoading(false);
      return;
    }

    // Step 2: activate the session (was setActive() in pre-v7 Clerk)
    const { error: finalizeError } = await signIn.finalize();

    if (finalizeError) {
      setError(finalizeError.message ?? "Could not start session");
      setIsLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <AuthCardFrame
      title="Welcome back"
      subtitle="Sign in to Parkwell TeamHub"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
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

          <AuthInput
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Password"
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
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center space-x-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 appearance-none rounded border border-white/20 bg-white/5 transition-all duration-200 checked:border-white checked:bg-white focus:ring-1 focus:ring-white/30 focus:outline-none"
            />
            <span className="text-xs text-white/60 transition-colors hover:text-white/80">
              Remember me
            </span>
          </label>

          <Link
            href="/forgot-password"
            className="text-xs text-white/60 transition-colors duration-200 hover:text-white"
          >
            Forgot password?
          </Link>
        </div>

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

        <AuthSubmitButton isLoading={isLoading} disabled={!isReady} className="mt-5">
          Sign in
        </AuthSubmitButton>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-3 text-center text-xs text-white/60"
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="group/link relative font-medium text-white transition-colors duration-300 hover:text-white/70"
          >
            <span className="relative z-10">Sign up</span>
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-300 group-hover/link:w-full" />
          </Link>
        </motion.p>
      </form>
    </AuthCardFrame>
  );
}
