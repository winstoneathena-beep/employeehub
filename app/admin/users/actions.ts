"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";

/**
 * Server actions for /admin/users.
 *
 * Every action:
 *   1. Re-checks the caller is an admin (defence in depth — even though the
 *      page also guards, an attacker could POST directly to the action).
 *   2. Validates business rules (no self-targeting, no demoting the last
 *      admin, etc.) — throws so the client surfaces an error.
 *   3. Updates the DB.
 *   4. Mirrors role/status into Clerk where applicable (publicMetadata for
 *      role; banUser/unbanUser for status).
 *   5. Writes an audit_log entry.
 *   6. revalidatePath('/admin/users') so the table refreshes.
 */

async function loadActor() {
  const { userId } = await requireAdmin();
  const actor = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);
  return { clerkUserId: userId, email: actor[0]?.email ?? null };
}

async function loadTarget(clerkUserId: string) {
  const target = await db
    .select({ email: users.email, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);
  return target[0] ?? null;
}

export async function promoteUser(targetClerkUserId: string) {
  const actor = await loadActor();
  if (actor.clerkUserId === targetClerkUserId) {
    throw new Error("You can't change your own role.");
  }
  const target = await loadTarget(targetClerkUserId);
  if (!target) throw new Error("User not found.");

  await db
    .update(users)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(users.clerkUserId, targetClerkUserId));

  const client = await clerkClient();
  await client.users.updateUserMetadata(targetClerkUserId, {
    publicMetadata: { role: "admin" },
  });

  await audit({
    action: "admin.user.promoted",
    actor,
    target: { clerkUserId: targetClerkUserId, email: target.email },
    metadata: { from: target.role, to: "admin" },
  });

  revalidatePath("/admin/users");
}

export async function demoteUser(targetClerkUserId: string) {
  const actor = await loadActor();
  if (actor.clerkUserId === targetClerkUserId) {
    throw new Error("You can't change your own role.");
  }
  const target = await loadTarget(targetClerkUserId);
  if (!target) throw new Error("User not found.");

  // Don't strand the org without an admin.
  const remainingAdmins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));
  if (remainingAdmins.length <= 1) {
    throw new Error(
      "Can't demote the last admin. Promote someone else first.",
    );
  }

  await db
    .update(users)
    .set({ role: "user", updatedAt: new Date() })
    .where(eq(users.clerkUserId, targetClerkUserId));

  const client = await clerkClient();
  await client.users.updateUserMetadata(targetClerkUserId, {
    publicMetadata: { role: "user" },
  });

  await audit({
    action: "admin.user.demoted",
    actor,
    target: { clerkUserId: targetClerkUserId, email: target.email },
    metadata: { from: "admin", to: "user" },
  });

  revalidatePath("/admin/users");
}

export async function suspendUser(
  targetClerkUserId: string,
  reason?: string,
) {
  const actor = await loadActor();
  if (actor.clerkUserId === targetClerkUserId) {
    throw new Error("You can't suspend yourself.");
  }
  const target = await loadTarget(targetClerkUserId);
  if (!target) throw new Error("User not found.");

  await db
    .update(users)
    .set({
      status: "suspended",
      suspendedAt: new Date(),
      suspendedReason: reason?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, targetClerkUserId));

  // Clerk's banUser invalidates existing sessions and blocks future sign-ins.
  const client = await clerkClient();
  await client.users.banUser(targetClerkUserId);

  await audit({
    action: "admin.user.suspended",
    actor,
    target: { clerkUserId: targetClerkUserId, email: target.email },
    metadata: { reason: reason?.trim() || null },
  });

  revalidatePath("/admin/users");
}

export async function unsuspendUser(targetClerkUserId: string) {
  const actor = await loadActor();
  const target = await loadTarget(targetClerkUserId);
  if (!target) throw new Error("User not found.");

  await db
    .update(users)
    .set({
      status: "active",
      suspendedAt: null,
      suspendedReason: null,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, targetClerkUserId));

  const client = await clerkClient();
  await client.users.unbanUser(targetClerkUserId);

  await audit({
    action: "admin.user.unsuspended",
    actor,
    target: { clerkUserId: targetClerkUserId, email: target.email },
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(targetClerkUserId: string) {
  const actor = await loadActor();
  if (actor.clerkUserId === targetClerkUserId) {
    throw new Error("You can't delete yourself.");
  }
  const target = await loadTarget(targetClerkUserId);
  if (!target) throw new Error("User not found.");

  // Don't strand the org. We allow demoting last admin warning above; same
  // logic applies here — if the target is admin and the only one, refuse.
  if (target.role === "admin") {
    const remainingAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));
    if (remainingAdmins.length <= 1) {
      throw new Error(
        "Can't delete the last admin. Promote someone else first.",
      );
    }
  }

  // Audit BEFORE Clerk delete — once Clerk fires user.deleted webhook, the
  // local row goes away and we lose context.
  await audit({
    action: "admin.user.deleted",
    actor,
    target: { clerkUserId: targetClerkUserId, email: target.email },
    metadata: { role: target.role, status: target.status },
  });

  const client = await clerkClient();
  await client.users.deleteUser(targetClerkUserId);
  // Webhook user.deleted cleans up the local row.

  revalidatePath("/admin/users");
}
