# Parkwell TeamHub

Internal portal for Parkwell employees. Lives at `parkwellteamhub.com`. Repo
is named `employeehub` (generic internal codename); product is **Parkwell
TeamHub**. Separate venture from `goparkwell.com` (the public marketing site).

## What this is

The Hub is the gateway. Employees sign in once at `parkwellteamhub.com` and
are routed to internal tools at subdomains (`signs.parkwellteamhub.com`,
future tools, etc.) without re-authenticating. Auth state is shared via a
session cookie scoped to `.parkwellteamhub.com`.

See `../TeamHub Project/Parkwell TeamHub — Project Brief.md` for the full
spec and `Parkwell TeamHub - Project Owner's Guide.docx` for the
plain-English companion.

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind v4 + `tw-animate-css` + shadcn-style tokens
- **Motion**: `motion` (the package formerly known as framer-motion)
- **Icons**: `lucide-react`
- **Themes**: `next-themes` (light + dark, system-aware)
- **Auth (PR 2)**: Clerk in headless mode (`useSignUp` / `useSignIn` hooks)
- **Email (PR 2)**: Resend + `@react-email`
- **Database (PR 2)**: Vercel Postgres (Neon-backed)
- **Hosting**: Vercel

## Current state — PR 1

| Surface | Route | State |
|---|---|---|
| Sign in | `/sign-in` | UI complete · submit stubbed |
| Sign up | `/sign-up` | UI complete · submit stubbed, client-side `@goparkwell.com` check |
| Verify code | `/verify` | UI complete · 6-digit segmented input, 10-min countdown |
| Pending approval | `/pending` | Static status page |
| Hub | `/` | Persistent pill navbar · Signs tool tile · welcome header |

**Not yet wired**: Clerk, Resend, Postgres, `/admin/pending` approver flow,
Signs cross-subdomain session, server-side email allowlist. Those land in
PR 2 once external accounts are created.

## Local development

```bash
npm install
cp .env.example .env.local      # fill in real values once accounts exist
npm run dev
```

Open <http://localhost:3000>. Click through `/sign-in`, `/sign-up`,
`/verify`, `/pending`, and the Hub at `/`.

## Project structure

```
app/
  (auth)/            ← shared dark auth shell
    sign-in/page.tsx
    sign-up/page.tsx
    verify/page.tsx
    pending/page.tsx
    layout.tsx       ← wraps with AuthShell
  page.tsx           ← Hub dashboard (root)
  layout.tsx         ← Root layout + ThemeProvider
  globals.css        ← Parkwell brand tokens (light + dark)
components/
  auth/              ← AuthShell, card frame, cards, input, button
  hub/               ← PillNavbar, ToolTile, WelcomeHeader, ThemeToggle
  theme-provider.tsx
lib/
  utils.ts           ← cn() helper
public/brand/        ← chevron, wordmark, logo, wave-ink
```

## Build playbook — what comes next

PR 2 unblocks on account creation by Winstone. Order matters:

1. Create Vercel account → connect this repo (`winstoneathena-beep/employeehub`)
2. Buy `parkwellteamhub.com` through Vercel registrar (~$11.25)
3. Create Clerk app named "Parkwell TeamHub"
   - User & Authentication → Email, Phone → 6-digit code (not magic link)
   - Sessions → cookie domain = `.parkwellteamhub.com`
   - Restrictions → email allowlist for `@goparkwell.com`
4. Create Resend account → add `parkwellteamhub.com` as sending domain
5. Add Vercel Postgres to the project (auto-injects `DATABASE_URL`)
6. Paste Clerk / Resend keys into Vercel env vars
7. Add DNS records: SPF + DKIM + DMARC (Resend gives the exact values)

Then PR 2 swaps the stubbed `setTimeout` calls in the auth cards for real
Clerk hooks and ships the approver flow.

## Brand

Tokens live in `app/globals.css`. Direct utilities:

- `text-parkwell-blue`, `bg-parkwell-blue` (#19b2ec) — primary
- `text-ink`, `bg-ink` (#0a202e) — dark surface
- `text-ocean` (#2c586d), `text-parkwell-green`, `text-parkwell-yellow`,
  `text-parkwell-red`

Plus shadcn-style semantic tokens (`bg-card`, `text-muted-foreground`, etc.)
that adapt to light/dark theme.

## Notes for agents

- **Next.js 16 has breaking changes** — see `AGENTS.md`.
- The **auth surfaces are dark-only** by design (front-door treatment).
  The Hub respects the user's light/dark theme.
- Keep the visual language consistent with the reference at
  `../TeamHub Project/components/sign in card example.rtf` — dark
  glassmorphism, 3D tilt, animated border beams. Parkwell Blue replaces
  the reference's purple. **No Google sign-in** (brief mandates
  `@goparkwell.com` email + password only).
