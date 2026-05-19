"use client";

import { motion } from "motion/react";

type Edge = "top" | "right" | "bottom" | "left";

const beamGeom: Record<Edge, string> = {
  top: "top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent",
  right:
    "top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white to-transparent",
  bottom:
    "bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent",
  left: "bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white to-transparent",
};

const animByEdge: Record<Edge, Record<string, [string, string]>> = {
  top: { left: ["-50%", "100%"] },
  right: { top: ["-50%", "100%"] },
  bottom: { right: ["-50%", "100%"] },
  left: { bottom: ["-50%", "100%"] },
};

export function TravelingBeam({
  edge,
  delay = 0,
}: {
  edge: Edge;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute ${beamGeom[edge]} opacity-60`}
      initial={{ filter: "blur(2px)" }}
      animate={{
        ...animByEdge[edge],
        opacity: [0.25, 0.6, 0.25],
        filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
      }}
      transition={{
        ...Object.fromEntries(
          Object.keys(animByEdge[edge]).map((k) => [
            k,
            {
              duration: 2.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 1,
              delay,
            },
          ]),
        ),
        opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay },
        filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay },
      }}
    />
  );
}
