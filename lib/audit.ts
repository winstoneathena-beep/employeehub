import { db, auditLog } from "@/lib/db";

/**
 * Audit log writer.
 *
 * Append-only — never updates / deletes rows. Designed to be called from
 * everywhere (webhook handlers, server actions, page routes) with a single
 * tight signature.
 *
 * Errors are caught and logged but never thrown — a failed audit write
 * should never break the caller's flow. The trade-off: we may lose a log
 * entry occasionally; the alternative (cascading failure) is worse.
 */

type AuditPayload = {
  /** Stable identifier like 'user.signed_up' or 'admin.user.promoted'. */
  action: string;

  /** Who did it. Omit for system actions (webhook, scheduled job). */
  actor?: { clerkUserId?: string | null; email?: string | null };

  /** Who it happened to. Often === actor for self-actions. */
  target?: { clerkUserId?: string | null; email?: string | null };

  /** Action-specific details — JSON serializable. */
  metadata?: Record<string, unknown>;

  /** When called from a request handler, pass the Request to capture IP + UA. */
  request?: Request;
};

export async function audit(payload: AuditPayload): Promise<void> {
  try {
    const ip =
      payload.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      payload.request?.headers.get("x-real-ip") ||
      null;
    const ua = payload.request?.headers.get("user-agent") || null;

    await db.insert(auditLog).values({
      action: payload.action,
      actorClerkUserId: payload.actor?.clerkUserId ?? null,
      actorEmail: payload.actor?.email ?? null,
      targetClerkUserId: payload.target?.clerkUserId ?? null,
      targetEmail: payload.target?.email ?? null,
      metadata: payload.metadata ?? null,
      ipAddress: ip,
      userAgent: ua,
    });
  } catch (err) {
    // Never let an audit failure cascade.
    console.error("[audit] failed to write log entry:", err, {
      action: payload.action,
    });
  }
}
