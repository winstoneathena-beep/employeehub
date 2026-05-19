"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  isLoading?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

/**
 * White pill submit button with shimmer-while-loading.
 * Matches the reference 21st.dev style; arrow translates on hover.
 */
export function AuthSubmitButton({
  isLoading = false,
  disabled,
  type = "submit",
  onClick,
  children,
  className,
}: Props) {
  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.01 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn("group/btn relative w-full", className)}
    >
      <div className="absolute inset-0 rounded-lg bg-parkwell-blue/30 opacity-0 blur-lg transition-opacity duration-300 group-hover/btn:opacity-70" />

      <div className="relative flex h-10 items-center justify-center overflow-hidden rounded-lg bg-white font-medium text-black transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60">
        {/* Loading shimmer */}
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
          animate={{ x: ["-100%", "100%"] }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1,
          }}
          style={{
            opacity: isLoading ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
            >
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/70 border-t-transparent" />
            </motion.div>
          ) : (
            <motion.span
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-1.5 text-sm font-medium"
            >
              {children}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
