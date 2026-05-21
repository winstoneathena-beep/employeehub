import { z } from "zod";

/**
 * Type-safe env loader.
 *
 * Validates required env vars at module-load time. Missing or malformed
 * values throw immediately, so the app fails loud at boot instead of
 * silently misbehaving at runtime.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   env.CLERK_SECRET_KEY  // string, guaranteed defined
 */

/** Empty strings in dotenv files should be treated as "not set", not as ""
 *  (which trips .url() / .email() validators). */
const optionalUrl = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().url().optional(),
);
const optionalEmail = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().email().optional(),
);
const optionalString = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.string().optional(),
);

const serverSchema = z.object({
  // ── App ────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // ── Clerk ─────────────────────────────────────────────
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (Clerk publishable key)"),
  CLERK_SECRET_KEY: z
    .string()
    .min(1, "Missing CLERK_SECRET_KEY (Clerk secret key — server-side only)"),
  CLERK_WEBHOOK_SECRET: optionalString, // required only when webhook is wired (PR 2B)

  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/verify"),

  // ── Email (Resend) ────────────────────────────────────
  // Optional until PR 2C wires the mailer.
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  EMAIL_REPLY_TO: optionalEmail,

  // ── Database (Postgres / Neon) ────────────────────────
  // Optional until PR 2B wires Drizzle.
  DATABASE_URL: optionalUrl,

  // ── Cookie domain for cross-subdomain sessions ────────
  // Production: ".parkwellteamhub.com". Local dev: leave blank.
  NEXT_PUBLIC_COOKIE_DOMAIN: optionalString,
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  // Pretty-print errors so the user immediately sees which keys are missing.
  console.error("\n❌ Invalid environment variables:\n");
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error(
    "\nCheck your .env.local (local dev) or Vercel env vars (deployed).\n",
  );
  throw new Error("Environment validation failed");
}

export const env = parsed.data;
