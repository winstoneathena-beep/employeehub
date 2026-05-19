"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Dark page backdrop for all auth surfaces (sign-in / sign-up / verify / pending).
 * Parkwell Blue gradient + animated radial glows + soft grid.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050d14] px-4 py-12">
      {/* Base gradient — Parkwell Blue → Ink → black */}
      <div className="absolute inset-0 bg-gradient-to-b from-parkwell-blue/30 via-ocean/40 to-[#050d14]" />

      {/* Soft grid mask for depth */}
      <div className="absolute inset-0 bg-grid-soft" />

      {/* Noise overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Top radial glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-[60vh] w-[120vh] -translate-x-1/2 rounded-b-[50%] bg-parkwell-blue/20 blur-[80px]" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[60vh] w-[100vh] -translate-x-1/2 rounded-b-full bg-parkwell-blue/15 blur-[60px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
      />

      {/* Bottom radial glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-[90vh] w-[90vh] -translate-x-1/2 rounded-t-full bg-parkwell-blue/15 blur-[60px]"
        animate={{ opacity: [0.3, 0.55, 0.3], scale: [1, 1.1, 1] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "mirror",
          delay: 1,
        }}
      />

      {/* Floating glow spots */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-white/5 opacity-40 blur-[100px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-white/5 opacity-40 blur-[100px] [animation-delay:1s]" />

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
