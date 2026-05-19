"use client";

import {
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import type { ReactNode } from "react";
import { TravelingBeam } from "./traveling-beam";
import { ParkwellMark } from "./parkwell-mark";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** "sm" for sign-in/verify/pending; "md" for sign-up (more fields). */
  width?: "sm" | "md";
};

const widthClass = {
  sm: "max-w-sm",
  md: "max-w-md",
};

/**
 * Glass card frame used for every auth surface.
 * Handles: 3D mouse tilt, animated traveling beams, corner glows,
 * Parkwell wordmark header, glassmorphism background.
 *
 * The form/content lives in `children`.
 */
export function AuthCardFrame({
  title,
  subtitle,
  children,
  width = "sm",
}: Props) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - r.left - r.width / 2);
    mouseY.set(e.clientY - r.top - r.height / 2);
  };
  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn("relative z-10 mx-auto w-full", widthClass[width])}
      style={{ perspective: 1500 }}
    >
      <motion.div
        className="relative"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileHover={{ z: 10 }}
      >
        <div className="group relative">
          {/* Ambient card glow */}
          <motion.div
            aria-hidden
            className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-700 group-hover:opacity-70"
            animate={{
              boxShadow: [
                "0 0 10px 2px rgba(25,178,236,0.05)",
                "0 0 18px 6px rgba(25,178,236,0.1)",
                "0 0 10px 2px rgba(25,178,236,0.05)",
              ],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "mirror",
            }}
          />

          {/* Traveling beams on the border */}
          <div className="pointer-events-none absolute -inset-[1px] overflow-hidden rounded-2xl">
            <TravelingBeam edge="top" />
            <TravelingBeam edge="right" delay={0.6} />
            <TravelingBeam edge="bottom" delay={1.2} />
            <TravelingBeam edge="left" delay={1.8} />

            {/* Corner glow spots */}
            <motion.div
              aria-hidden
              className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
            />
            <motion.div
              aria-hidden
              className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatType: "mirror",
                delay: 0.5,
              }}
            />
            <motion.div
              aria-hidden
              className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                repeatType: "mirror",
                delay: 1,
              }}
            />
            <motion.div
              aria-hidden
              className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
                repeatType: "mirror",
                delay: 1.5,
              }}
            />
          </div>

          {/* Card border hover */}
          <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] opacity-0 transition-opacity duration-500 group-hover:opacity-70" />

          {/* Glass card body */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
            {/* Inner pattern */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                backgroundSize: "30px 30px",
              }}
            />

            <div className="relative">
              {/* Header */}
              <div className="mb-5 space-y-1 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="mx-auto"
                >
                  <ParkwellMark />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-b from-white to-white/80 bg-clip-text pt-2 text-xl font-semibold text-transparent"
                >
                  {title}
                </motion.h1>

                {subtitle ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs text-white/60"
                  >
                    {subtitle}
                  </motion.p>
                ) : null}
              </div>

              {children}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
