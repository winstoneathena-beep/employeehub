import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Auth gating for Parkwell TeamHub.
 *
 * Public routes (anyone can hit):
 *   /sign-in, /sign-up, /verify
 *   /api/webhooks/*  (Clerk + Resend post here)
 *
 * Everything else requires a signed-in session. The /admin/* role check
 * (must be admin) lands in PR 2B alongside the @goparkwell.com server-side
 * enforcement webhook.
 *
 * Note: Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`,
 * but Clerk's official integration still ships as `clerkMiddleware()`
 * mounted on `middleware.ts`. We accept the deprecation warning.
 * When Clerk publishes proxy.ts support we'll migrate.
 */

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  // Match everything except Next internals + static assets.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
