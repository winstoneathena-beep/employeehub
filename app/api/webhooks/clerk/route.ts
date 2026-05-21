import { headers } from "next/headers";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { env } from "@/lib/env";

/**
 * Clerk webhook receiver.
 *
 * Subscribed events: user.created
 * Purpose: enforce @goparkwell.com on the server side. The sign-up card
 * checks the email domain in the browser, but anyone hitting Clerk's API
 * directly could bypass that. When user.created fires, we re-check the
 * primary email — if it's not @goparkwell.com, we delete the user
 * immediately via the Clerk Backend SDK.
 *
 * Security: every webhook from Clerk is signed by svix. We verify the
 * signature using CLERK_WEBHOOK_SECRET. If the signature doesn't match,
 * we reject with 401 — that prevents an attacker from POSTing a fake
 * user.created event to try to make us delete a real user.
 *
 * Reliability: Clerk retries failed webhooks up to ~24h. Our handler is
 * idempotent — deleting an already-deleted user is a no-op (Clerk returns
 * an error, which we swallow; the desired end state is the same).
 */

const ALLOWED_DOMAIN = "@goparkwell.com";

export async function POST(req: Request) {
  if (!env.CLERK_WEBHOOK_SECRET) {
    // Misconfigured deploy. Log + fail loud so it shows in Vercel logs.
    console.error(
      "[clerk-webhook] CLERK_WEBHOOK_SECRET is not set — refusing to process.",
    );
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // ── 1. Verify svix signature ────────────────────────────────────
  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("[clerk-webhook] svix signature verification failed:", err);
    return new Response("Invalid signature", { status: 401 });
  }

  // ── 2. Handle user.created ──────────────────────────────────────
  if (evt.type === "user.created") {
    const userId = evt.data.id;
    const emails = evt.data.email_addresses ?? [];
    const primary = emails.find(
      (e) => e.id === evt.data.primary_email_address_id,
    );
    const emailAddress = (
      primary?.email_address ?? emails[0]?.email_address ?? ""
    ).toLowerCase();

    if (!emailAddress) {
      console.warn(
        `[clerk-webhook] user.created without email (id=${userId}) — skipping.`,
      );
      return new Response("ok", { status: 200 });
    }

    if (!emailAddress.endsWith(ALLOWED_DOMAIN)) {
      console.warn(
        `[clerk-webhook] deleting non-${ALLOWED_DOMAIN} user: ${emailAddress} (id=${userId})`,
      );
      try {
        const client = await clerkClient();
        await client.users.deleteUser(userId);
      } catch (err) {
        // Most likely the user was already deleted (idempotent retry).
        // Log and return 200 so Clerk doesn't keep retrying.
        console.error(
          `[clerk-webhook] failed to delete user ${userId}:`,
          err,
        );
      }
      return new Response("deleted", { status: 200 });
    }

    // Email is allowed. No action needed.
    return new Response("ok", { status: 200 });
  }

  // Other event types — ignore for now (could add audit logging later).
  return new Response("ok", { status: 200 });
}
