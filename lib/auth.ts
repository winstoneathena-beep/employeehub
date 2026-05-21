import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Role helpers built on top of Clerk's auth() / currentUser().
 *
 * Phase 1C — role gating lives at the page level (server components) rather
 * than in middleware. Trade-off:
 *   + No Clerk dashboard session-token customization required to start.
 *   + Authoritative — reads the latest publicMetadata, no JWT staleness.
 *   - One Clerk API call per protected request (~50ms). Acceptable for
 *     /admin/* which is low-traffic.
 *
 * If admin pages get hot enough that this latency matters, the upgrade
 * path is: add `metadata: "{{user.public_metadata}}"` to Clerk's session
 * token claims, then read role from sessionClaims in middleware.
 */

export type AppRole = "user" | "admin";

/**
 * Returns the current user's role, derived from Clerk's publicMetadata.role.
 * Returns null if signed out OR if the user has no role set (which shouldn't
 * happen post-Phase-1B, but we fall back gracefully).
 */
export async function getCurrentRole(): Promise<AppRole | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  if (role === "admin" || role === "user") return role;
  return null;
}

/**
 * Page-level admin gate. Call at the top of any admin server component.
 *   - Signed-out → redirect to /sign-in
 *   - Signed-in but not admin → redirect to / (no error page; failure
 *     is silent so we don't reveal that /admin/* exists)
 *   - Admin → returns the userId for the page to use
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const role = await getCurrentRole();
  if (role !== "admin") {
    redirect("/");
  }

  return { userId };
}
