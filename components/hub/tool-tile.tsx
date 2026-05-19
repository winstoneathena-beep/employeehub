"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  href: string;
  /** Rendered icon element (e.g. <Signpost className="h-5 w-5" />). */
  icon: ReactNode;
  /** "available" routes; "soon" renders disabled. */
  state?: "available" | "soon";
};

export function ToolTile({
  title,
  description,
  href,
  icon,
  state = "available",
}: Props) {
  const isAvailable = state === "available";
  const content = (
    <motion.div
      whileHover={isAvailable ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 transition-shadow",
        isAvailable
          ? "border-border hover:border-parkwell-blue/40 hover:shadow-xl"
          : "cursor-not-allowed border-dashed border-border opacity-60",
      )}
    >
      {/* Brand glow */}
      {isAvailable ? (
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-parkwell-blue/10 blur-2xl transition-opacity group-hover:bg-parkwell-blue/20" />
      ) : null}

      <div className="relative">
        <div
          className={cn(
            "mb-4 flex h-10 w-10 items-center justify-center rounded-xl",
            isAvailable
              ? "bg-parkwell-blue/10 text-parkwell-blue"
              : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative mt-6 flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-medium",
            isAvailable ? "text-parkwell-blue" : "text-muted-foreground",
          )}
        >
          {isAvailable ? "Open tool" : "Coming soon"}
        </span>
        {isAvailable ? (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-parkwell-blue" />
        ) : null}
      </div>
    </motion.div>
  );

  if (!isAvailable) return content;
  return (
    <Link href={href} aria-label={`Open ${title}`}>
      {content}
    </Link>
  );
}
