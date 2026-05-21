"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "motion/react";

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeHeader() {
  const { user, isLoaded } = useUser();
  const firstName = isLoaded ? user?.firstName : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-1"
    >
      <p className="text-sm font-medium text-parkwell-blue">
        Parkwell TeamHub
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {timeGreeting()}
        {firstName ? `, ${firstName}` : ""}.
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Your gateway to Parkwell&apos;s internal tools. Pick a tool below to
        get to work — you stay signed in across everything.
      </p>
    </motion.div>
  );
}
