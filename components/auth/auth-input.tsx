"use client";

import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentProps<"input"> & {
  icon?: ReactNode;
  trailing?: ReactNode;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
};

/**
 * Glassmorphism input with animated focus highlight.
 * Used inside auth cards. Icon optional, trailing slot for show-password toggles.
 */
export function AuthInput({
  icon,
  trailing,
  isFocused,
  onFocusChange,
  className,
  ...rest
}: Props) {
  return (
    <motion.div
      className={cn("relative", isFocused && "z-10")}
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="absolute -inset-[0.5px] rounded-lg bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center overflow-hidden rounded-lg">
        {icon ? (
          <div
            className={cn(
              "absolute left-3 flex h-4 w-4 items-center justify-center transition-colors duration-300",
              isFocused ? "text-white" : "text-white/40",
            )}
          >
            {icon}
          </div>
        ) : null}

        <input
          {...rest}
          onFocus={(e) => {
            onFocusChange(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            onFocusChange(false);
            rest.onBlur?.(e);
          }}
          className={cn(
            "h-10 w-full rounded-lg border border-transparent bg-white/5 px-3 text-sm text-white placeholder:text-white/30",
            "transition-all duration-300 outline-none",
            "focus:border-white/20 focus:bg-white/10",
            icon && "pl-10",
            trailing && "pr-10",
            className,
          )}
        />

        {trailing ? <div className="absolute right-3">{trailing}</div> : null}

        {isFocused ? (
          <motion.div
            layoutId="auth-input-highlight"
            className="absolute inset-0 -z-10 bg-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        ) : null}
      </div>
    </motion.div>
  );
}
