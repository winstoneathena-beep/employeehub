import type { Metadata } from "next";
import { VerifyCard } from "@/components/auth/verify-card";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyPage() {
  return <VerifyCard />;
}
