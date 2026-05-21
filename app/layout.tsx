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
          // Used for any Clerk-rendered fallbacks (e.g., UserButton dropdown).
          // Our auth pages use headless hooks, so this is just defensive.
          card: "bg-black/60 backdrop-blur-xl border border-white/10",
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
