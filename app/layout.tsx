import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Parkwell TeamHub",
    template: "%s · Parkwell TeamHub",
  },
  description: "Parkwell's internal portal — sign in to access company tools.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      signInFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      signUpFallbackRedirectUrl={env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#19b2ec", // Parkwell Blue
          colorBackground: "#0a202e", // Ink — matches our glass cards
          colorText: "#f5f7fa",
          colorTextSecondary: "rgba(255,255,255,0.6)",
          colorInputBackground: "rgba(255,255,255,0.05)",
          colorInputText: "#ffffff",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-geist-sans), Helvetica Neue, Arial, sans-serif",
        },
        elements: {
          // Force text color on Clerk's root + popovers + modals so they
          // don't inherit our body's `color: var(--foreground)` (which is
          // dark Ink in light mode → unreadable dark-on-dark in the Clerk
          // dropdown). Clerk's modals portal directly to <body>, so they
          // pick up that inherited color unless we explicitly set ours.
          rootBox: "text-white",
          userButtonPopoverCard:
            "bg-black/80 backdrop-blur-xl border border-white/10 text-white",
          userButtonPopoverActionButton: "text-white hover:bg-white/5",
          userButtonPopoverActionButtonText: "text-white",
          userButtonPopoverActionButtonIcon: "text-white/70",
          userButtonPopoverFooter: "text-white/60",
          modalContent:
            "bg-[#0a202e] text-white border border-white/10",
          modalCloseButton: "text-white hover:text-white/80",
          card: "bg-black/80 backdrop-blur-xl border border-white/10 text-white",
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        data-scroll-behavior="smooth"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
