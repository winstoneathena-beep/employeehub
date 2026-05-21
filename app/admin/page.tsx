import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScrollText, ShieldCheck, Users } from "lucide-react";
import { PillNavbar } from "@/components/hub/pill-navbar";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="relative min-h-screen w-full">
      <PillNavbar />

      <main className="mx-auto w-full max-w-4xl px-4 pt-32 pb-20 sm:px-6">
        <div className="flex flex-col items-start gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-parkwell-blue/10 text-parkwell-blue">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-parkwell-blue">Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              TeamHub controls
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Manage who can use TeamHub, see what&apos;s happened recently,
              and configure how new tools surface in the Hub as Parkwell
              builds them out.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2">
            <AdminCard
              href="/admin/users"
              icon={<Users className="h-5 w-5" />}
              title="Users"
              description="Promote, suspend, or remove employees. Search by name, email, or role."
              status="ready"
            />
            <AdminCard
              href="#"
              icon={<ScrollText className="h-5 w-5" />}
              title="Audit log"
              description="Append-only feed of sign-ups, sign-ins, and admin actions."
              status="soon"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminCard({
  href,
  icon,
  title,
  description,
  status,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "ready" | "soon";
}) {
  const isReady = status === "ready";
  const inner = (
    <div
      className={
        isReady
          ? "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:border-parkwell-blue/40 hover:shadow-xl"
          : "flex h-full flex-col justify-between rounded-2xl border border-dashed border-border bg-muted/30 p-5 opacity-70"
      }
    >
      {isReady ? (
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-parkwell-blue/10 blur-2xl transition-opacity group-hover:bg-parkwell-blue/20" />
      ) : null}

      <div className="relative">
        <div
          className={
            isReady
              ? "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-parkwell-blue/10 text-parkwell-blue"
              : "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"
          }
        >
          {icon}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative mt-6 flex items-center justify-between text-xs">
        <span
          className={
            isReady
              ? "font-medium text-parkwell-blue"
              : "font-medium text-muted-foreground"
          }
        >
          {isReady ? "Open" : "Coming soon"}
        </span>
        {isReady ? (
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-parkwell-blue" />
        ) : null}
      </div>
    </div>
  );

  return isReady ? <Link href={href}>{inner}</Link> : inner;
}
