import { clerkClient } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-emails";

const ALLOWED_DOMAIN = "@goparkwell.com";

type SyncResult =
  | { status: "synced"; email: string; role: "user" | "admin" }
  | { status: "skipped"; reason: "no_email" | "wrong_domain" };

/**
 * Upsert a single Clerk user into our local `users` table.
 *
 * Used by:
 *   - the user.created webhook (initial sync at sign-up)
 *   - the session.created webhook (backfills users who signed up BEFORE
 *     the sync code shipped — their user.created never inserted)
 *   - /admin/users page render (last-resort backfill of the current
 *     admin so they see themselves in the table even if webhook events
 *     never fired)
 *
 * Idempotent — uses INSERT ... ON CONFLICT DO UPDATE.
 * Returns a discriminated result so callers can audit-log accordingly.
 */
export async function syncUserToDb(clerkUserId: string): Promise<SyncResult> {
  const client = await clerkClient();
  const u = await client.users.getUser(clerkUserId);

  const emails = u.emailAddresses;
  const primary = emails.find((e) => e.id === u.primaryEmailAddressId);
  const email = (primary?.emailAddress ?? emails[0]?.emailAddress)?.toLowerCase();

  if (!email) {
    return { status: "skipped", reason: "no_email" };
  }
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return { status: "skipped", reason: "wrong_domain" };
  }

  const role = isAdminEmail(email) ? "admin" : "user";
  const md = u.unsafeMetadata as Record<string, unknown> | undefined;
  const deptRaw = md?.role;
  const department =
    typeof deptRaw === "string" && deptRaw.trim() ? deptRaw.trim() : null;

  await db
    .insert(users)
    .values({
      clerkUserId: u.id,
      email,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      department,
      role,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        department,
        role,
        updatedAt: new Date(),
      },
    });

  // Keep Clerk's publicMetadata.role in sync (cheap, idempotent).
  const currentRole = (u.publicMetadata as { role?: string } | undefined)?.role;
  if (currentRole !== role) {
    try {
      await client.users.updateUserMetadata(u.id, {
        publicMetadata: { role },
      });
    } catch (err) {
      console.error(
        `[sync-user] failed to sync publicMetadata for ${u.id}:`,
        err,
      );
    }
  }

  return { status: "synced", email, role };
}
