import type { Metadata } from "next";
import { PendingCard } from "@/components/auth/pending-card";

export const metadata: Metadata = { title: "Pending approval" };

export default function PendingPage() {
  return <PendingCard />;
}
