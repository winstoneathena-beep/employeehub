"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { env } from "@/lib/env";

/**
 * ClerkProvider wrapper that reads the current next-themes value and
 * passes a matching appearance config to Clerk.
 *
 * Why this exists: Clerk doesn't natively follow next-themes. If you
 * hardcode `baseTheme: dark`, the user-button dropdown and manage-account
 * modal stay dark even when the rest of the app is in light mode — making
 * text unreadable.
 *
 * Has to live in a client component (next-themes' useTheme is client-only).
 * Mount it inside <ThemeProvider> in the root layout.
 */

const sharedVars = {
  colorPrimary: "#19b2ec", // Parkwell Blue
  borderRadius: "0.75rem",
  fontFamily:
    "var(--font-geist-sans), Helvetica Neue, Arial, sans-serif",
};

const darkAppearance = {
  baseTheme: dark,
  variables: {
    ...sharedVars,
    colorBackground: "#0a202e", // Ink — matches our glass cards
    colorText: "#f5f7fa",
    colorTextSecondary: "rgba(255,255,255,0.6)",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInputText: "#ffffff",
  },
};

const lightAppearance = {
  variables: {
    ...sharedVars,
    colorBackground: "#ffffff",
    colorText: "#0a202e", // Ink as text on light surface
    colorTextSecondary: "rgba(10,32,46,0.65)",
    colorInputBackground: "#f5f9fc", // muted from globals
    colorInputText: "#0a202e",
  },
};

export function ClerkWithTheme({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  // On the very first render `resolvedTheme` is undefined until next-themes
  // hydrates. Default to dark — our auth pages are dark-only, so this is
  // the correct first-paint choice; light kicks in after hydration if the
  // user prefers it.
  const isDark = resolvedTheme !== "light";

  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      signInFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      signUpFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
      appearance={isDark ? darkAppearance : lightAppearance}
    >
      {children}
    </ClerkProvider>
  );
}
