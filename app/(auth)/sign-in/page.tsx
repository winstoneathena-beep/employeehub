import type { Metadata } from "next";
import { SignInCard } from "@/components/auth/sign-in-card";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return <SignInCard />;
}
