<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Parkwell TeamHub — agent guide

## Project context

- This repo is the **Hub** at `parkwellteamhub.com` — the gateway employees log in to before reaching internal tools.
- Sibling project: `../parkwell-signs` — the existing Signs site that will attach at `signs.parkwellteamhub.com`.
- Source of truth specs live in `../TeamHub Project/`:
  - `Parkwell TeamHub — Project Brief.md` (technical spec)
  - `Parkwell TeamHub - Project Owner's Guide.docx` (plain-English companion)
- **All architectural decisions are made.** Don't propose alternatives unless a constraint changes.

## Hard rules

1. **Auth is Clerk** (headless mode, custom UI). No NextAuth, no Supabase Auth, no roll-your-own.
2. **Email verification is a 6-digit code**, never a magic link. Corporate scanners (M365 Defender) pre-fetch link URLs and consume single-use tokens.
3. **Email allowlist** — only `@goparkwell.com`. Enforce **server-side**, not just client-side.
4. **Admin is `/admin`**, not a subdomain. Subdomains are for *tools*, not for control surfaces of the Hub itself.
5. **Cookie domain** is `.parkwellteamhub.com` (leading dot) so sessions traverse subdomains.
6. **No social sign-in.** Email + password only.
7. **Brand colors are fixed.** Parkwell Blue `#19b2ec`, Ink `#0a202e`, Ocean `#2c586d` + the three accent colors. The reference card's purple was visual *language*, not literal palette.
8. **Visual language**: dark glassmorphism for the *front door* (sign-in / sign-up / verify / pending); utilitarian light+dark for the *Hub dashboard* (pill navbar, simple tool tiles).

## Next.js 16 breaking changes that bite

- `middleware.ts` is now **`proxy.ts`** (Edge runtime not supported in `proxy`).
- `cookies()`, `headers()`, `params`, `searchParams` are **async** — `await` them.
- `next lint` is removed — use ESLint CLI directly.
- Turbopack is the default for `dev` and `build`.
- `images.domains` is deprecated — use `images.remotePatterns`.
- All parallel route slots need explicit `default.js`.

## Conventions

- Components live in `components/<area>/<name>.tsx`. Areas: `auth/`, `hub/`, `ui/` (generic).
- Client components must start with `"use client"`.
- Use `cn()` from `@/lib/utils` for conditional classes.
- Import from `motion/react`, not `framer-motion` (the package was renamed).
- Server-side validation lives next to API routes (`app/api/.../route.ts`) — for PR 2.

## When you finish a piece of work

- Mark the related task completed via TaskUpdate.
- Update `README.md`'s "Current state" table if a route's status changed.
- Confirm `npm run dev` boots without console errors before claiming done.
- Don't commit unless explicitly asked.
