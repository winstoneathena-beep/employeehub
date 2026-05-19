import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { PillNavbar } from "@/components/hub/pill-navbar";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <div className="relative min-h-screen w-full">
      <PillNavbar />

      <main className="mx-auto w-full max-w-3xl px-4 pt-32 pb-20 sm:px-6">
        <div className="flex flex-col items-start gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-parkwell-blue/10 text-parkwell-blue">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-parkwell-blue">
              Admin · Approver area
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Approval workflow lands in PR 2.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Once Clerk is wired, this page lists pending sign-ups for
              director approval. Approve or reject from here; users receive
              the confirmation email automatically.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
              <p className="text-sm font-semibold text-foreground">
                /admin/pending
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Queue of unapproved accounts with approve / reject actions.
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
              <p className="text-sm font-semibold text-foreground">
                /admin/users
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Full user list, role management, audit log.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-parkwell-blue/40 hover:text-parkwell-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Hub
          </Link>
        </div>
      </main>
    </div>
  );
}
