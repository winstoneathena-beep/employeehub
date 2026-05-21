"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import {
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { AuthCardFrame } from "./auth-card-frame";
import { AuthInput } from "./auth-input";
import { AuthSubmitButton } from "./auth-submit-button";

const ALLOWED_DOMAIN = "@goparkwell.com";

type FocusKey =
  | "firstName"
  | "lastName"
  | "email"
  | "role"
  | "password"
  | "confirm"
  | null;

export function SignUpCard() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<FocusKey>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = !!signUp && fetchStatus !== "fetching";

  function validate(): string | null {
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return `Email must be a ${ALLOWED_DOMAIN} address.`;
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirm) {
      return "Passwords do not match.";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;

    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setIsLoading(true);

    // Step 1: create the in-progress sign-up with user-provided fields.
    // `unsafeMetadata.role` is the supported way to attach the department/role
    // string; the webhook (PR 2B) mirrors this into pending_users.role.
    const { error: createError } = await signUp.create({
      emailAddress: email,
      password,
      firstName,
      lastName,
      unsafeMetadata: { role },
    });

    if (createError) {
      setError(
        createError.longMessage ??
          createError.message ??
          "Sign up failed",
      );
      setIsLoading(false);
      return;
    }

    // Step 2: trigger the 6-digit verification email.
    const { error: sendError } = await signUp.verifications.sendEmailCode();

    if (sendError) {
      setError(
        sendError.longMessage ??
          sendError.message ??
          "Could not send verification code",
      );
      setIsLoading(false);
      return;
    }

    // Don't clear isLoading on success — navigating away.
    router.push("/verify");
  }

  return (
    <AuthCardFrame
      title="Create your account"
      subtitle="Parkwell employees only — @goparkwell.com email required"
      width="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            type="text"
            name="firstName"
            autoComplete="given-name"
            placeholder="First name"
            icon={<User className="h-4 w-4" />}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            isFocused={focused === "firstName"}
            onFocusChange={(f) => setFocused(f ? "firstName" : null)}
            required
          />
          <AuthInput
            type="text"
            name="lastName"
            autoComplete="family-name"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            isFocused={focused === "lastName"}
            onFocusChange={(f) => setFocused(f ? "lastName" : null)}
            required
          />
        </div>

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
          type="text"
          name="role"
          autoComplete="organization-title"
          placeholder="Department or role"
          icon={<Briefcase className="h-4 w-4" />}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          isFocused={focused === "role"}
          onFocusChange={(f) => setFocused(f ? "role" : null)}
          required
        />

        <AuthInput
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="new-password"
          placeholder="Password (8+ characters)"
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
          placeholder="Confirm password"
          icon={<Lock className="h-4 w-4" />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          isFocused={focused === "confirm"}
          onFocusChange={(f) => setFocused(f ? "confirm" : null)}
          required
          minLength={8}
        />

        {/* Required by Clerk's bot-protection / CAPTCHA when enabled in the
            dashboard. Harmless to keep even when not configured. */}
        <div id="clerk-captcha" />

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

        <p className="text-[11px] leading-relaxed text-white/50">
          We&apos;ll email you a 6-digit code to confirm your address. Once
          you enter it, you&apos;re straight into TeamHub.
        </p>

        <AuthSubmitButton isLoading={isLoading} disabled={!isReady} className="mt-2">
          Create account
        </AuthSubmitButton>

        <p className="pt-2 text-center text-xs text-white/60">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="group/link relative font-medium text-white transition-colors duration-300 hover:text-white/70"
          >
            <span className="relative z-10">Sign in</span>
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-white transition-all duration-300 group-hover/link:w-full" />
          </Link>
        </p>
      </form>
    </AuthCardFrame>
  );
}
