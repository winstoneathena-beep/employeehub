import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";

/**
 * Layout for /sign-in, /sign-up, /verify, /forgot-password.
 *
 * If the visitor is already signed in, kick them to the Hub instead of
 * letting them land on an auth page. Without this, an already-signed-in
 * user who hits /forgot-password sees Clerk's "you're already signed in"
 * error with no obvious recovery path.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (userId) {
    redirect("/");
  }

  return <AuthShell>{children}</AuthShell>;
}
