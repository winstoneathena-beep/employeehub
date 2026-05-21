import { env } from "./env";

/**
 * Bootstrap admin check.
 *
 * ADMIN_EMAILS is a comma-separated list of email addresses that should
 * be granted the admin role automatically when their user.created webhook
 * fires. After at least one admin exists, future admins can be promoted
 * via the /admin/users UI.
 *
 * Case-insensitive. Whitespace around commas is stripped.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const target = email.toLowerCase().trim();
  if (!target) return false;

  const list = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return list.includes(target);
}
