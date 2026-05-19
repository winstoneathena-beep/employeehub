"use client";

import Link from "next/link";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { AuthCardFrame } from "./auth-card-frame";

type Step = {
  icon: typeof CheckCircle2;
  label: string;
  state: "done" | "active" | "next";
};

const steps: Step[] = [
  { icon: CheckCircle2, label: "Email verified", state: "done" },
  { icon: Clock, label: "Awaiting director approval", state: "active" },
  { icon: Mail, label: "We'll email you when approved", state: "next" },
];

export function PendingCard() {
  return (
    <AuthCardFrame
      title="You're almost in"
      subtitle="A Parkwell director will review your request shortly."
    >
      <div className="space-y-4">
        <ol className="space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isDone = s.state === "done";
            const isActive = s.state === "active";
            return (
              <motion.li
                key={s.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span
                  className={
                    isDone
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-parkwell-green/20 text-parkwell-green"
                      : isActive
                        ? "flex h-7 w-7 items-center justify-center rounded-full bg-parkwell-blue/20 text-parkwell-blue"
                        : "flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/40"
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={
                    isDone || isActive
                      ? "text-sm text-white/90"
                      : "text-sm text-white/50"
                  }
                >
                  {s.label}
                </span>
              </motion.li>
            );
          })}
        </ol>

        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-relaxed text-white/60">
          Most approvals happen within a few hours during business hours. If
          you haven&apos;t heard back in 24 hours, reach out at{" "}
          <a
            href="mailto:admin@parkwellteamhub.com"
            className="text-white underline underline-offset-2 transition-colors hover:text-parkwell-blue"
          >
            admin@parkwellteamhub.com
          </a>
          .
        </div>

        <Link
          href="/sign-in"
          className="block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 text-center text-sm font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCardFrame>
  );
}
