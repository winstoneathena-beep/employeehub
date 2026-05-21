import { redirect } from "next/navigation";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/lib/admin-emails";

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
 *
 * Self-healing for bootstrap admins: if publicMetadata.role is missing
 * but the user's email is in ADMIN_EMAILS, we promote them here and now
 * (writes publicMetadata so subsequent checks are fast). Covers the case
 * where a bootstrap admin signed up BEFORE the webhook started syncing
 * roles — they'd otherwise be locked out of /admin forever.
 */
export async function requireAdmin(): Promise<{ userId: string }> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const declaredRole = (
    user.publicMetadata as { role?: string } | undefined
  )?.role;
  if (declaredRole === "admin") {
    return { userId };
  }

  // Self-heal: bootstrap admins whose Clerk metadata isn't set yet.
  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (isAdminEmail(primaryEmail)) {
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: "admin" },
      });
    } catch (err) {
      console.error(
        "[requireAdmin] bootstrap publicMetadata sync failed:",
        err,
      );
    }
    return { userId };
  }

  redirect("/");
}
