import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UsersIcon } from "lucide-react";
import { desc } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PillNavbar } from "@/components/hub/pill-navbar";
import { UsersTable } from "@/components/admin/users-table";

export const metadata: Metadata = { title: "Users" };

// Always fresh — admin actions revalidatePath('/admin/users'), but we also
// want fresh data on direct nav.
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { userId: currentClerkUserId } = await requireAdmin();

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="relative min-h-screen w-full">
      <PillNavbar />

      <main className="mx-auto w-full max-w-6xl px-4 pt-32 pb-20 sm:px-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Admin
        </Link>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-parkwell-blue">
              <UsersIcon className="h-4 w-4" />
              <span>Users</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {allUsers.length} {allUsers.length === 1 ? "person" : "people"}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Promote others to admin, suspend access when someone&apos;s on
              leave, or remove accounts entirely. All actions are recorded
              in the audit log.
            </p>
          </div>
        </div>

        <UsersTable
          users={allUsers}
          currentClerkUserId={currentClerkUserId}
        />
      </main>
    </div>
  );
}
