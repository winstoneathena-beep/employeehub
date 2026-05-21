import { headers } from "next/headers";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import type {
  UserJSON,
  SessionJSON,
  WebhookEvent,
} from "@clerk/nextjs/server";
import { env } from "@/lib/env";
import { db, users } from "@/lib/db";
import { audit } from "@/lib/audit";
import { isAdminEmail } from "@/lib/admin-emails";
import { syncUserToDb } from "@/lib/sync-user";

/**
 * Clerk webhook receiver.
 *
 * Subscribed events:
 *   - user.created     → enforce @goparkwell.com; insert into users table;
 *                        bootstrap admin role if email is in ADMIN_EMAILS;
 *                        sync role to Clerk publicMetadata so middleware
 *                        can gate /admin/* against it.
 *   - user.updated     → mirror Clerk-side profile changes into our DB.
 *                        Also re-checks ADMIN_EMAILS so a newly-added admin
 *                        email gets promoted on their next profile edit.
 *   - user.deleted     → remove the local users row (audit_log entry
 *                        survives so we can see the deletion in history).
 *   - session.created  → bump lastSignInAt + write audit log so we have
 *                        a running record of sign-ins.
 *
 * Every webhook call is svix-signed; we reject 401 on bad signatures so
 * an attacker can't forge events.
 *
 * Idempotent — Clerk retries on 5xx. Inserts use ON CONFLICT DO NOTHING
 * semantics via separate select+insert; deletes are no-ops if the row
 * is already gone.
 */

const ALLOWED_DOMAIN = "@goparkwell.com";

// ── Entry point ────────────────────────────────────────────────────
export async function POST(req: Request) {
  if (!env.CLERK_WEBHOOK_SECRET) {
    console.error(
      "[clerk-webhook] CLERK_WEBHOOK_SECRET not set — refusing to process.",
    );
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // 1. svix signature verification
  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] signature verification failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  // 2. Dispatch by event type
  try {
    switch (evt.type) {
      case "user.created":
        await handleUserCreated(evt.data, req);
        break;
      case "user.updated":
        await handleUserUpdated(evt.data, req);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data, req);
        break;
      case "session.created":
        await handleSessionCreated(evt.data, req);
        break;
      default:
        // Ignore other event types — we're not subscribed but Clerk may
        // send them anyway.
        break;
    }
  } catch (err) {
    console.error(`[clerk-webhook] handler failed for ${evt.type}:`, err);
    // Return 500 so Clerk retries. The audit-log writer already swallows
    // its own errors, so a 500 here means a real handler bug we want to
    // see and fix.
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}

// ── user.created ────────────────────────────────────────────────────
async function handleUserCreated(data: UserJSON, req: Request) {
  const userId = data.id;
  const email = primaryEmail(data);
  const firstName = data.first_name ?? null;
  const lastName = data.last_name ?? null;
  const department = readDepartment(data);

  if (!email) {
    console.warn(`[clerk-webhook] user.created without email (id=${userId})`);
    return;
  }

  // Server-side @goparkwell.com gate
  if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
    await audit({
      action: "user.signed_up.rejected_non_goparkwell",
      target: { clerkUserId: userId, email },
      metadata: { reason: `email does not end in ${ALLOWED_DOMAIN}` },
      request: req,
    });

    try {
      const client = await clerkClient();
      await client.users.deleteUser(userId);
    } catch (err) {
      console.error(`[clerk-webhook] failed to delete rejected user ${userId}:`, err);
    }
    return;
  }

  const role = isAdminEmail(email) ? "admin" : "user";

  // Idempotent insert — if Clerk retries, second insert hits the unique
  // constraint and we update in place.
  await db
    .insert(users)
    .values({
      clerkUserId: userId,
      email,
      firstName,
      lastName,
      department,
      role,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { email, firstName, lastName, department, role, updatedAt: new Date() },
    });

  // Sync role into Clerk publicMetadata so middleware/JWT can read it.
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });
  } catch (err) {
    console.error(`[clerk-webhook] failed to set publicMetadata for ${userId}:`, err);
  }

  await audit({
    action: "user.signed_up",
    target: { clerkUserId: userId, email },
    metadata: { role, bootstrappedAsAdmin: role === "admin" },
    request: req,
  });
}

// ── user.updated ────────────────────────────────────────────────────
async function handleUserUpdated(data: UserJSON, req: Request) {
  const userId = data.id;
  const email = primaryEmail(data);
  const firstName = data.first_name ?? null;
  const lastName = data.last_name ?? null;
  const department = readDepartment(data);

  if (!email) {
    console.warn(`[clerk-webhook] user.updated without email (id=${userId})`);
    return;
  }

  // Re-evaluate admin status — handles ADMIN_EMAILS being changed at runtime,
  // or someone changing their email to match an admin entry.
  const existing = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  const currentRole = existing[0]?.role ?? "user";
  // Promote bootstrap admins; never demote here (demotions are intentional
  // and happen through /admin/users).
  const role = isAdminEmail(email) ? "admin" : currentRole;

  await db
    .update(users)
    .set({ email, firstName, lastName, department, role, updatedAt: new Date() })
    .where(eq(users.clerkUserId, userId));

  // Sync to Clerk publicMetadata if role changed
  if (role !== currentRole) {
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role },
      });
    } catch (err) {
      console.error(`[clerk-webhook] failed to sync metadata for ${userId}:`, err);
    }
    await audit({
      action: role === "admin" ? "admin.user.promoted" : "admin.user.demoted",
      target: { clerkUserId: userId, email },
      metadata: { from: currentRole, to: role, source: "bootstrap_admin_emails" },
      request: req,
    });
  }

  await audit({
    action: "user.updated",
    target: { clerkUserId: userId, email },
    request: req,
  });
}

// ── user.deleted ────────────────────────────────────────────────────
async function handleUserDeleted(
  data: { id?: string; deleted?: boolean },
  req: Request,
) {
  const userId = data.id;
  if (!userId) return;

  const deleted = await db
    .delete(users)
    .where(eq(users.clerkUserId, userId))
    .returning({ email: users.email });

  await audit({
    action: "user.deleted",
    target: { clerkUserId: userId, email: deleted[0]?.email ?? null },
    request: req,
  });
}

// ── session.created ─────────────────────────────────────────────────
async function handleSessionCreated(data: SessionJSON, req: Request) {
  const userId = data.user_id;
  if (!userId) return;

  const userRow = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (!userRow[0]) {
    // User predates the sync code OR user.created event hasn't been
    // processed yet. Backfill from Clerk so they show up in /admin/users
    // immediately instead of having to wait for a profile edit.
    const result = await syncUserToDb(userId);
    if (result.status !== "synced") {
      console.warn(
        `[clerk-webhook] session.created backfill skipped for ${userId}: ${result.reason}`,
      );
      return;
    }
  }

  await db
    .update(users)
    .set({ lastSignInAt: new Date() })
    .where(eq(users.clerkUserId, userId));

  // Re-query for the audit log — userRow may have been from before the
  // backfill, or undefined entirely.
  const final = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  await audit({
    action: "user.signed_in",
    actor: { clerkUserId: userId, email: final[0]?.email ?? null },
    request: req,
  });
}

// ── helpers ─────────────────────────────────────────────────────────

function primaryEmail(data: UserJSON): string | null {
  const emails = data.email_addresses ?? [];
  const primary = emails.find((e) => e.id === data.primary_email_address_id);
  const value = primary?.email_address ?? emails[0]?.email_address;
  return value ? value.toLowerCase() : null;
}

function readDepartment(data: UserJSON): string | null {
  const md = data.unsafe_metadata as Record<string, unknown> | undefined;
  const dept = md?.role;
  return typeof dept === "string" && dept.trim() ? dept.trim() : null;
}
