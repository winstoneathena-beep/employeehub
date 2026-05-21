import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Database schema for Parkwell TeamHub.
 *
 * Clerk owns the authoritative user record (sessions, passwords, MFA, etc.).
 * This DB stores the Hub-specific data that doesn't belong in Clerk:
 *   - users     → local mirror with admin-relevant fields (role, status,
 *                 department) and a clerkUserId join key
 *   - auditLog  → append-only feed of significant events for accountability
 *                 + security signal
 *
 * Mirroring Clerk into `users` keeps admin pages fast (one DB query) instead
 * of round-tripping to Clerk's API on every page render. The webhook keeps
 * the mirror in sync.
 */

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);

export const users = pgTable(
  "users",
  {
    /** Local UUID — primary key. Stable even if Clerk re-assigns IDs. */
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /** Foreign key to Clerk's user. The join between this row and a Clerk session. */
    clerkUserId: text("clerk_user_id").notNull().unique(),

    email: text("email").notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),

    /** Free-text "Department or role" the user typed at sign-up. */
    department: text("department"),

    role: userRoleEnum("role").notNull().default("user"),
    status: userStatusEnum("status").notNull().default("active"),

    /** Why a user is suspended, set when status flips to "suspended". */
    suspendedReason: text("suspended_reason"),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),

    /** Touched by the session.created webhook. Powers the "last active" column. */
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
    index("users_status_idx").on(t.status),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/**
 * Audit log — append-only.
 *
 * Every significant event lands here: sign-ups (kept or rejected), sign-ins,
 * admin actions (promote/demote/suspend/delete), webhook rejections.
 *
 * No foreign keys to users.id on purpose — we want the log to survive even
 * if the user row gets deleted later.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    /** Stable action identifier. Examples:
     *    user.signed_up
     *    user.signed_up.rejected_non_goparkwell
     *    user.signed_in
     *    user.signed_in.failed
     *    user.updated
     *    user.deleted
     *    admin.user.promoted
     *    admin.user.demoted
     *    admin.user.suspended
     *    admin.user.unsuspended
     *    admin.user.deleted
     */
    action: text("action").notNull(),

    /** Who performed the action. Null when the system did it (e.g., webhook). */
    actorClerkUserId: text("actor_clerk_user_id"),
    actorEmail: text("actor_email"),

    /** Who the action was performed on. Often === actor for self-actions. */
    targetClerkUserId: text("target_clerk_user_id"),
    targetEmail: text("target_email"),

    /** Free-form details: reason, before/after values, IP, user agent, etc. */
    metadata: jsonb("metadata"),

    /** Captured when available (sign-in events from session.created webhook). */
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_log_action_idx").on(t.action),
    index("audit_log_actor_idx").on(t.actorClerkUserId),
    index("audit_log_target_idx").on(t.targetClerkUserId),
    index("audit_log_created_at_idx").on(t.createdAt),
  ],
);

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
