"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  href: string;
  icon: typeof Home;
  /** Only show when the current user has approver/admin role (stubbed for now). */
  privileged?: boolean;
};

const items: Item[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Tools", href: "/#tools", icon: LayoutGrid },
  { label: "Admin", href: "/admin", icon: Shield, privileged: true },
];

/**
 * Persistent pill-shaped navbar floating at the top-center of every Hub page.
 * Glass effect, adaptive to light/dark theme.
 *
 * For PR 1 we always show all items; once Clerk is wired, hide `privileged`
 * items unless the user's role qualifies.
 */
export function PillNavbar() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={cn(
          "pointer-events-auto flex items-center gap-1 rounded-full border px-1.5 py-1.5",
          "border-border bg-card/80 shadow-lg shadow-black/5 backdrop-blur-xl",
          "dark:border-white/10 dark:bg-black/40 dark:shadow-black/40",
        )}
      >
        {items.map((it) => {
          const isActive =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group/nav relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-parkwell-blue text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{it.label}</span>
            </Link>
          );
        })}

        <div className="mx-1 h-5 w-px bg-border" />

        <ThemeToggle className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" />

        <Link
          href="/sign-in"
          aria-label="Account"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <User className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    </nav>
  );
}
