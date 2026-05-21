"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Crown,
  Pause,
  Play,
  Search,
  Trash2,
  UserMinus,
} from "lucide-react";
import type { User } from "@/lib/db";
import { initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  deleteUser,
  demoteUser,
  promoteUser,
  suspendUser,
  unsuspendUser,
} from "@/app/admin/users/actions";

type Props = {
  users: User[];
  currentClerkUserId: string;
};

type RoleFilter = "all" | "user" | "admin";
type StatusFilter = "all" | "active" | "suspended";

export function UsersTable({ users, currentClerkUserId }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        u.email,
        u.firstName ?? "",
        u.lastName ?? "",
        u.department ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, roleFilter, statusFilter]);

  function run(action: () => Promise<void>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar — search + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department"
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none transition-colors focus:border-parkwell-blue/40 focus:ring-2 focus:ring-parkwell-blue/20"
          />
        </div>

        <FilterSelect
          value={roleFilter}
          onChange={(v) => setRoleFilter(v as RoleFilter)}
          label="Role"
          options={[
            { value: "all", label: "All roles" },
            { value: "user", label: "User" },
            { value: "admin", label: "Admin" },
          ]}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as StatusFilter)}
          label="Status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
          ]}
        />

        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {users.length}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-parkwell-red/30 bg-parkwell-red/10 px-3 py-2 text-sm text-parkwell-red"
        >
          {error}
        </div>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">User</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Department</th>
              <th className="px-4 py-3 text-left font-medium">Last sign-in</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {users.length === 0
                    ? "No users yet — they'll appear here as people sign up."
                    : "No users match the current filters."}
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isSelf = u.clerkUserId === currentClerkUserId;
                return (
                  <tr
                    key={u.id}
                    className={cn(
                      "transition-colors",
                      isPending && "opacity-60",
                      "hover:bg-muted/30",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-parkwell-blue/10 text-xs font-semibold text-parkwell-blue">
                          {initials(u.firstName, u.lastName)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">
                            {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                              "—"}
                            {isSelf ? (
                              <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                You
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} reason={u.suspendedReason} />
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {u.department || <span className="text-muted-foreground/60">—</span>}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {relativeTime(u.lastSignInAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground/60">
                            —
                          </span>
                        ) : (
                          <>
                            {u.role === "user" ? (
                              <ActionButton
                                title="Promote to admin"
                                onClick={() =>
                                  run(
                                    () => promoteUser(u.clerkUserId),
                                    `Promote ${u.email} to admin?`,
                                  )
                                }
                              >
                                <Crown className="h-4 w-4" />
                              </ActionButton>
                            ) : (
                              <ActionButton
                                title="Demote to user"
                                onClick={() =>
                                  run(
                                    () => demoteUser(u.clerkUserId),
                                    `Demote ${u.email} to regular user?`,
                                  )
                                }
                              >
                                <UserMinus className="h-4 w-4" />
                              </ActionButton>
                            )}

                            {u.status === "active" ? (
                              <ActionButton
                                title="Suspend"
                                onClick={() => {
                                  const reason = window.prompt(
                                    `Suspend ${u.email}? They won't be able to sign in until you unsuspend them.\n\nOptional reason (saved to the audit log):`,
                                    "",
                                  );
                                  if (reason === null) return;
                                  run(() => suspendUser(u.clerkUserId, reason));
                                }}
                              >
                                <Pause className="h-4 w-4" />
                              </ActionButton>
                            ) : (
                              <ActionButton
                                title="Unsuspend"
                                onClick={() =>
                                  run(
                                    () => unsuspendUser(u.clerkUserId),
                                    `Restore sign-in access for ${u.email}?`,
                                  )
                                }
                              >
                                <Play className="h-4 w-4" />
                              </ActionButton>
                            )}

                            <ActionButton
                              title="Delete user"
                              destructive
                              onClick={() =>
                                run(
                                  () => deleteUser(u.clerkUserId),
                                  `Delete ${u.email} permanently? This removes their Clerk account and all local data. Cannot be undone.`,
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </ActionButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Small UI primitives ──────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-parkwell-blue/40 focus:ring-2 focus:ring-parkwell-blue/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RoleBadge({ role }: { role: "user" | "admin" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        role === "admin"
          ? "bg-parkwell-blue/10 text-parkwell-blue"
          : "bg-muted text-muted-foreground",
      )}
    >
      {role}
    </span>
  );
}

function StatusBadge({
  status,
  reason,
}: {
  status: "active" | "suspended";
  reason?: string | null;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "active"
          ? "bg-parkwell-green/10 text-parkwell-green"
          : "bg-parkwell-red/10 text-parkwell-red",
      )}
      title={status === "suspended" && reason ? `Reason: ${reason}` : undefined}
    >
      {status}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  title,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
        destructive
          ? "hover:bg-parkwell-red/10 hover:text-parkwell-red"
          : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
