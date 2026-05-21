import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkWithTheme } from "@/components/clerk-with-theme";
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
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* ThemeProvider must sit above ClerkWithTheme so the latter can
            read resolvedTheme via next-themes. Reversed order = no theme
            reactivity. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkWithTheme>{children}</ClerkWithTheme>
        </ThemeProvider>
      </body>
    </html>
  );
}
