# DOT Platform — Architecture & Folder Structure

> Single source of truth for the codebase layout. If you add a file, also add a
> line for it here so future contributors can find it.

> **Status:** Audited 2026-07-10. The repo currently contains **3 conflicting
> roots** (one active frontend, one active backend, two legacy duplicates). See
> [§13 — Restructuring Plan](#13-restructuring-plan) for the recommended
> cleanup. **Phase 1 (loose scripts → `scripts/`) executed.**

---

## Table of Contents

1. [Top-Level Layout](#1-top-level-layout)
2. [Active Frontend — `src/`](#2-active-frontend--src)
3. [Active Backend — `dotlive-backend/`](#3-active-backend--dotlive-backend)
4. [Shared Type Packages](#4-shared-type-packages)
5. [Legacy / Snapshot Directories](#5-legacy--snapshot-directories)
6. [Configuration Files](#6-configuration-files)
7. [Documentation Inventory](#7-documentation-inventory)
8. [Naming Conventions](#8-naming-conventions)
9. [Import / Export Rules](#9-import--export-rules)
10. [Module Dependency Map](#10-module-dependency-map)
11. [Status Legend](#11-status-legend)
12. [Quick-Reference: Where does X live?](#12-quick-reference-where-does-x-live)
13. [Restructuring Plan](#13-restructuring-plan)

---

## 1. Top-Level Layout

```
dotlive-main/
├── src/                          # ✅ ACTIVE — Frontend (TanStack Start)
├── dotlive-backend/              # ✅ ACTIVE — Backend (Fastify + Drizzle + Neon)
├── dotlive-monorepo/             # ⚠️ LEGACY — partial early backend, NOT used
├── dotlive-main-tracked/         # ⚠️ LEGACY — snapshot of an older frontend
├── docs/                         # ✅ Long-form docs (DEVLOG, UPTIMEROBOT)
├── .hermes/                      # 🤖 Agent planning artifacts (plans, prompts, audits)
├── .kiro/                        # 🤖 Specs dir (meeting-scheduler, referral-system)
├── .lovable/                     # ⚙️ Lovable.dev project config (do not edit)
├── public/                       # ✅ Static assets served at /
├── package.json                  # ✅ Frontend manifest
├── tsconfig.json                 # ✅ Frontend TS config
├── vite.config.ts                # ✅ Frontend build config
├── components.json               # ⚙️ shadcn/ui generator config
├── bun.lock / package-lock.json  # 🔒 Lockfiles (do not hand-edit)
├── AGENTS.md                     # 📜 Lovable sync guard-rails
└── *.md                          # ⚠️ Mixed bag of project docs (see §7)
```

---

## 2. Active Frontend — `src/`

All frontend code lives in `src/`. Subfolders are organised by **role**, not by
feature (we have few enough features that role-based grouping is more legible
than feature-sliced design).

### 2.1 `src/api/` — REST client modules

One file per backend route group. Every file exports plain functions that call
`dotApi.get / post / patch / delete` (defined in `client.ts`).

| File | Domain | Notes |
|---|---|---|
| `client.ts` | HTTP transport | Base URL, JWT, 401 redirect, `ApiError` |
| `auth.ts` | Login / signup / `getMe` | Token lifecycle |
| `authAlternatives.ts` | Alt auth flows | Magic-link helpers |
| `wizard.ts` | Onboarding wizard | First-login state |
| `users.ts` | User profile / search | |
| `ventures.ts` | Ventures CRUD + browse | |
| `founder.ts` | Founder profile | |
| `feed.ts` | Social feed | |
| `notifications.ts` | Notification OS | |
| `wallet.ts` | Wallet balance + ops | |
| `stakes.ts` | Staking positions | |
| `loans.ts` | Loan panel | |
| `dividends.ts` | Dividend distributions | |
| `investments.ts` | Investor share purchases | |
| `investor.ts` | Investor profile | |
| `marketplace.ts` | Gig / job marketplace | |
| `meetings.ts` | Meeting scheduler | |
| `pitch.ts` | Pitch decks | |
| `pitchathons.ts` | Pitchathon events | |
| `academy.ts` | Academy / courses | |
| `adminAcademy.ts` | Admin-side academy mgmt | |
| `admin.ts` | Admin auth checks | |
| `admin-tools.ts` | Admin utilities | |
| `analytics.ts` | Analytics queries | |
| `connections.ts` | Social connections | |
| `community.ts` | Community mgmt | |
| `challenges.ts` | Community challenges | |
| `vouches.ts` | Vouch system | |
| `referrals.ts` | Referral program | |
| `demoEvents.ts` | Demo event system | |
| `leaderboard.ts` | Leaderboard reads | |
| `builderDocuments.ts` | Builder KYC docs | |
| `builders.ts` | Builder profiles | |
| `upload.ts` | File upload helper | |
| `vantage.ts` | Vantage score queries | |

### 2.2 `src/components/` — UI components

Grouped by **scope**:

#### `src/components/ui/` — shadcn/ui primitives (50 files)
Low-level, do not edit unless upgrading shadcn. Includes button, card, dialog,
input, etc. — see `components.json` for the registry.

#### `src/components/app/` — App-shell–level components
Used across all authenticated pages.

| File | Purpose |
|---|---|
| `AppShell.tsx` | Top-level layout: header, sidebar, mobile nav |
| `AdminShell.tsx` | Admin-specific shell (operator UI) |
| `PageHeader.tsx` | Page title + eyebrow + subtitle |
| `PageIntent.tsx` | "Why this page" callout |
| `PageSkeleton.tsx` | Loading skeleton |
| `EmptyState.tsx` | Empty/error list state (per project rules) |
| `EcosystemEmptyState.tsx` | Network-state variant of EmptyState |
| `ErrorState.tsx` | Generic error UI |
| `StatCard.tsx` | KPI tile |
| `DataTable.tsx` | Generic table |
| `NotificationBell.tsx` | Header notifications dropdown |
| `BackButton.tsx` | Browser-back wrapper |
| `TransferDialog.tsx` | DOT transfer dialog |
| `DeliveryDialog.tsx` | Gig delivery flow |

#### `src/components/site/` — Public marketing components
`Logo`, `SiteHeader`, `SiteFooter`, `PageShell`, `MobileCta`.

#### `src/components/theme/` — Theming
`ThemeToggle.tsx` (light / dark switcher).

#### `src/components/onboarding/` — Onboarding flow
`WizardOverlay.tsx` (first-login wizard).

#### `src/components/builder/` — Builder-only
Certifications, Documents, VouchCard, LevelRequirementsModal.

#### `src/components/founder/` — Founder-only
`VentureEnrichmentSection.tsx`.

#### `src/components/investor/` — Investor-only
`BuySharesDialog.tsx`.

#### `src/components/marketplace/` — Marketplace-only
`PostJobWizard.tsx`.

#### `src/components/profile/` — Profile-only
`BuilderProfileSection.tsx`.

#### `src/components/vouch/` — Vouch system
`VouchButton`, `VouchDisplay`, `VouchList`, `vouch-utils.ts`, `index.ts`.

#### `src/components/brand/` — Brand kit
`ToolIcons.tsx`.

#### `src/components/seo/` — SEO helpers
`Seo.tsx`.

#### Top-level file
`CookieConsent.tsx` — site-wide consent banner.

### 2.3 `src/contexts/` — React contexts

| File | Purpose |
|---|---|
| `DotAuthContext.tsx` | JWT-backed auth provider, `useDotAuth()` hook |

### 2.4 `src/hooks/` — Custom hooks

| File | Purpose |
|---|---|
| `use-auth.tsx` | Auth-related helpers (legacy, prefer `useDotAuth`) |
| `use-dot-data.ts` | Generic data helper |
| `use-mobile.tsx` | Responsive breakpoint hook |
| `use-reduced-motion.ts` | `prefers-reduced-motion` wrapper |
| `use-role-gate.ts` | Role-based rendering guard |
| `use-admin.ts` | Admin data hooks |
| `use-analytics.ts` | Analytics hooks |
| `use-dividends.ts` | Dividend hooks |
| `use-meetings.ts` | Meeting hooks |
| `use-pitch.ts` | Pitch deck hooks |
| `use-referrals.ts` | Referral hooks |
| `use-vouches.ts` | Vouch hooks |

### 2.5 `src/lib/` — Pure logic, utilities, edge functions

| File | Purpose |
|---|---|
| `utils.ts` | `cn()` classnames helper |
| `constants.ts` | `ROLE_LABELS`, enums, role list |
| `feature-flags.ts` | Runtime feature flags |
| `netWorth.ts` | `wallet + staked + locked + escrow + activeStakes*15` |
| `vantage.ts` | Vantage score calculations (client) |
| `vantage.server.ts` | Vantage score calculations (server) |
| `paystack.functions.ts` | Paystack wrapper |
| `academy.functions.ts` | Academy business logic |
| `admin.functions.ts` | Admin business logic |
| `upload.ts` | File upload helper |
| `error-capture.ts` | SSR error capture (h3 wrapper) |
| `error-page.ts` | Renders the 500 HTML page |
| `lovable-error-reporting.ts` | Posts errors to Lovable |
| `__tests__/wallet.test.ts` | Net-worth unit tests |

### 2.6 `src/integrations/` — Third-party SDK wrappers

| Path | Purpose |
|---|---|
| `integrations/supabase/client.ts` | Supabase browser client |
| `integrations/supabase/client.server.ts` | Supabase server client |
| `integrations/supabase/auth-middleware.ts` | Auth bridge |
| `integrations/supabase/auth-attacher.ts` | Attaches tokens to Supabase calls |
| `integrations/supabase/types.ts` | Generated Supabase types |
| `integrations/lovable/index.ts` | Lovable cloud-auth bridge |

### 2.7 `src/routes/` — TanStack Router routes

File-based routing.

#### Public
- `__root.tsx` — Root layout, QueryClientProvider, error boundary
- `index.tsx` — Marketing landing
- `auth.tsx` — Login / signup
- `auth-callback.tsx` — OAuth callback
- `reset-password.tsx`
- `journey.tsx`, `platform.tsx`, `about.tsx`, `privacy.tsx`, `terms.tsx`
- `communities.tsx`, `investors.tsx`, `founder.$id.tsx`, `operator.tsx`
- `events/index.tsx`, `events/$slug.tsx`
- `sitemap[.]xml.ts`
- `$.tsx` — Catch-all 404

#### Authenticated (`_authenticated/`)
- `route.tsx` — Auth guard (redirects to `/auth` if no JWT)
- `dashboard.tsx`, `discover.tsx`, `search.tsx`, `help.tsx`
- `academy.tsx`, `analytics.tsx`, `builder.tsx`, `certificates.tsx`
- `community.tsx`, `c.$id.tsx`, `deals.$id.tsx`
- `demo.tsx`, `demo.$id.tsx`
- `investor.tsx`, `judge.tsx`, `kyc.tsx`
- `leaderboard.tsx`, `loans.tsx`, `marketplace.tsx`
- `meetings.tsx`, `notifications.tsx`
- `onboarding.tsx`, `pitch-deck.tsx`, `pitchathons.tsx`
- `portfolio.tsx`, `profile.tsx`, `referrals.tsx`
- `sessions.tsx`, `settings.tsx`, `stakes.tsx`
- `vantage.tsx`, `ventures.tsx`, `wallet.tsx`, `work.tsx`
- `join.$code.tsx` — Referral join

#### Nested groups
- `_authenticated/admin/` — Operator panel (10 routes: courses, members, permissions, roles, sessions, tokens, wallets, integrations, test-webhook, index)
- `_authenticated/builder/$id.tsx` — Builder profile detail
- `_authenticated/capital/` — Capital partner (index, portfolio)
- `_authenticated/community/` — Community mgmt (challenges, channels)
- `_authenticated/discover/communities.tsx` — Community discovery
- `_authenticated/messages/` — DMs (index, $id)
- `_authenticated/onboarding/builder.tsx` — Builder onboarding flow

#### Server API (Nitro)
- `routes/api/public/webhooks/paystack.ts`

### 2.8 `src/types/` — Global TypeScript types
- `api.ts` — Shared API types

### 2.9 Top-level files
- `router.tsx` — Router factory (QueryClient)
- `server.ts` — Server entry (h3 + 500 fallback)
- `start.ts` — `start` client entry
- `styles.css` — Tailwind entry
- `routeTree.gen.ts` — ⚙️ Auto-generated by TanStack Router plugin (do not edit)

---

## 3. Active Backend — `dotlive-backend/`

Fastify + Drizzle ORM + Neon Postgres. Lives at `dotlive-backend/apps/api/`.

### 3.1 `apps/api/src/db/`
- `client.ts` — Drizzle + Neon HTTP client
- `schema.ts` — Drizzle table definitions
- `insertHelper.ts`, `insertTypes.ts` — Typed insert helpers
- `migrations/` — Drizzle SQL migrations (0000..0013)

### 3.2 `apps/api/src/lib/` — Backend business logic
- `auth.ts` — JWT verify / sign
- `admin.ts` — Admin guards
- `permissions.ts` — RBAC
- `cache.ts` — `TTLCache` (LRU Map)
- `dot.ts` — DOT math (1 DOT = ₦15)
- `staking.ts` — APY logic (12%)
- `token-supply.ts` — Token supply
- `vantage-engine.ts`, `vantage-sync.ts` — Vantage calc + sync
- `os-engine.ts` — Notification / OS engine
- `notify.ts` — Email + push dispatch
- `email.ts` — Email templates
- `cert.ts` — Certificate generation
- `cloudinary.ts` — Cloudinary uploads

### 3.3 `apps/api/src/routes/` — Fastify routes (38 files)
- `auth.ts`, `otp.ts`, `magic-link.ts`
- `users.ts`, `builders.ts`
- `ventures.ts`, `investments.ts`, `investor.ts`
- `feed.ts`, `connections.ts`
- `wallet.ts`, `withdrawals.ts`, `stakes.ts`, `loans.ts`
- `community.ts`, `community-billing.ts`, `challenges.ts`
- `meetings.ts`, `notifications.ts`
- `academy.ts`, `certificates.ts`
- `pitch.ts`, `pitchathons.ts`
- `referrals.ts`, `vouches.ts`
- `leaderboard.ts`, `vantage.ts`, `stats.ts`
- `admin.ts`, `admin-tools.ts`
- `capital-partner.ts`, `payments.ts`
- `onboarding.ts`, `wizard.ts`, `extras.ts`, `demo-events.ts`
- `marketplace.ts`, `venture-escrow.ts`
- `upload.ts`, `webhooks.ts`
- `__tests__/` — `critical-mutations.test.ts`, `schema-validation.test.ts`

### 3.4 `apps/api/scripts/` — Node scripts (15 files)
DB admin, seed, promote, verify. All use `.mjs` for direct execution.

### 3.5 `apps/api/src/types/fastify.d.ts`
Fastify request augmentation.

### 3.6 `apps/api/src/sharedTypes.ts` + `packages/shared/`
Cross-package shared types (the shared package emits `.js` + `.d.ts`).

---

## 4. Shared Type Packages

```
dotlive-backend/
└── packages/shared/        # shared types package
    ├── package.json
    ├── types.ts
    ├── types.js
    └── types.js.map
```

Import from `@dotlive/shared` after the package is built.

---

## 5. Legacy / Snapshot Directories

### 5.1 `dotlive-main-tracked/` ⚠️ LEGACY
An older snapshot of the frontend. **NOT** used by the current build. Contains
its own `package.json`, `bun.lock`, `vite.config.ts`, and a duplicate
`supabase/migrations/` directory.

Decision: this is dead code and should be deleted (see §13).

### 5.2 `dotlive-monorepo/` ⚠️ LEGACY
A partial early-stage backend variant. Contains only `apps/api/src/` with a
subset of routes and 2 migrations. **NOT** wired into any deploy.

Decision: this is dead code and should be deleted (see §13).

---

## 6. Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Frontend manifest (TanStack Start) |
| `tsconfig.json` | Frontend TS paths (`@/*` → `src/*`) |
| `vite.config.ts` | Frontend build |
| `components.json` | shadcn generator |
| `bunfig.toml`, `bun.lock` | Bun runtime config |
| `dotlive-backend/package.json` | Backend manifest |
| `dotlive-backend/tsconfig.json` | Backend TS config |
| `dotlive-backend/drizzle.config.ts` | Drizzle migrations |
| `dotlive-backend/render.yaml` | Render deploy config |
| `dotlive-backend/vercel.json` | Vercel deploy config |
| `dotlive-backend/.env.example` | Backend env template |
| `.env.example` | Frontend env template |
| `.gitignore`, `.prettierrc`, `.prettierignore` | Tooling |
| `eslint.config.js` | Lint rules |
| `.lovable/project.json` | Lovable dev project config (do not edit) |
| `AGENTS.md` | Lovable sync guard-rails |

---

## 7. Documentation Inventory

### 7.1 Active docs (keep at root)
- `AGENTS.md` — Lovable sync rules
- `DEV_LOG.md` — Master dev log (project memory)
- `docs/DEVLOG.md` — Mirror of dev log
- `docs/UPTIMEROBOT.md` — Uptime monitoring setup
- `DOT_OS_MASTER_SPEC.md` — DOT OS specification
- `DESIGN_SYSTEM_SPEC.md` — Design system contract
- `FRONTEND-PAGE-CONTRACT.md` — Frontend route contracts
- `FRONTEND_REDESIGN_CONTRACT.md` — Frontend redesign contract
- `DEPLOYMENT-CHECKLIST.md` — Deploy steps
- `MONITORING_SETUP.md` — Monitoring config
- `PAYSTACK_CONFIG.md` — Paystack integration
- `dotlive-backend/NEON_TROUBLESHOOTING.md` — DB troubleshooting
- `dotlive-backend/README.md` — Backend README
- `dotlive-backend/SCHEMA-VALIDATION-README.md` — DB schema validation

### 7.2 Audit / report files (snapshot, do not maintain)
There are **40+** audit, fix, and status `.md` files at the root and inside
`.hermes/`. These are point-in-time artifacts from past debugging sprints.
They are valuable for archaeology but clutter the working tree. See §13 for
the recommended move to `docs/audits/`.

### 7.3 `.hermes/` — Agent planning artifacts
- `.hermes/plans/` — Sprint plans (5 files)
- `.hermes/prompts/` — Session prompts 3–15 (13 files)
- `.hermes/audit-*.md`, `.hermes/spec-*.json` — Audit state
- `.hermes/*.md` — Past session reports, verification logs

### 7.4 `.kiro/` — Kiro specs
- `.kiro/specs/meeting-scheduler/` — design.md, requirements.md, tasks.md
- `.kiro/specs/referral-system/` — design.md, requirements.md, tasks.md

### 7.5 Root-level scripts
- `admin-promote-test.py`, `admin-test.py` — ad-hoc admin scripts
- `check-token.mjs` — JWT inspector

These belong in `scripts/` (see §13).

---

## 8. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React component file | `PascalCase.tsx` | `AppShell.tsx` |
| Hook | `camelCase.ts` starting with `use-` | `use-mobile.tsx` |
| Context | `PascalCaseContext.tsx` | `DotAuthContext.tsx` |
| API client | lowercase domain noun | `wallet.ts` |
| Backend route | lowercase domain noun | `venture-escrow.ts` |
| TanStack route param | `$paramName` | `founder.$id.tsx` |
| Route grouping folder | `_underscore` prefix | `_authenticated/` |
| Migrations | `NNNN_short_slug.sql` | `0013_runtime_fixes.sql` |
| Constants | `UPPER_SNAKE_CASE` | `ROLE_PRIORITY` |
| Type / interface | `PascalCase` | `FeedPost` |
| Tailwind utility | `cn()` from `lib/utils.ts` | |
| shadcn component | unchanged from registry | |

---

## 9. Import / Export Rules

1. Use **path aliases** (`@/...`) — never deep relative imports.
2. API client modules **only** export functions that call `dotApi.*`. No JSX.
3. Components **only** export components, never hooks (except compound
   components like `Sidebar`).
4. Hooks **only** export hooks.
5. `lib/` is **pure** — no React, no fetch. Logic that talks to APIs lives in
   `api/`, logic that talks to the DOM/React lives in `hooks/`.
6. The route file `_authenticated/route.tsx` is the single source of truth for
   the auth guard. Do not add auth checks to individual routes.

---

## 10. Module Dependency Map

```
routes/__root.tsx
  └── contexts/DotAuthContext.tsx
        └── api/auth.ts → api/client.ts
  └── components/onboarding/WizardOverlay.tsx
        └── api/wizard.ts
  └── components/CookieConsent.tsx

routes/_authenticated/{page}.tsx
  ├── components/app/AppShell.tsx
  │     └── contexts/DotAuthContext.tsx
  ├── components/app/{PageHeader,PageIntent,EmptyState,StatCard,...}.tsx
  ├── components/seed-specific/*
  ├── hooks/use-*
  └── api/<domain>.ts → api/client.ts

api/client.ts
  └── env: VITE_API_URL (default: https://dotlive-api.onrender.com)

api/auth.ts
  └── api/client.ts

api/<domain>.ts
  └── api/client.ts
```

**No circular dependencies detected.** All arrows point inward toward
`api/client.ts` and `contexts/DotAuthContext.tsx`.

---

## 11. Status Legend

| Icon | Meaning |
|---|---|
| ✅ | Active, used in production |
| ⚙️ | Auto-generated or tool-managed (do not hand-edit) |
| 🤖 | Agent-only artifacts (safe to ignore for builds) |
| ⚠️ | Legacy / snapshot / candidate for deletion |
| 📜 | Guard-rail document (read first) |
| 🔒 | Lockfile (regenerate, do not hand-edit) |

---

## 12. Quick-Reference: Where does X live?

| I'm looking for… | It lives in… |
|---|---|
| A page route | `src/routes/_authenticated/<name>.tsx` |
| A shadcn primitive | `src/components/ui/<name>.tsx` |
| An API call function | `src/api/<domain>.ts` |
| Auth context | `src/contexts/DotAuthContext.tsx` |
| A custom hook | `src/hooks/use-<thing>.ts` |
| Pure business logic | `src/lib/<thing>.ts` |
| Backend route | `dotlive-backend/apps/api/src/routes/<domain>.ts` |
| Drizzle schema | `dotlive-backend/apps/api/src/db/schema.ts` |
| Migration | `dotlive-backend/apps/api/src/db/migrations/NNNN_*.sql` |
| Server scripts | `dotlive-backend/apps/api/scripts/<name>.mjs` |
| Sprint plan | `.hermes/plans/<date>-<name>.md` |
| Session prompt | `.hermes/prompts/session-N-<name>.md` |
| Past audit | `.hermes/audit-*.md` or root `*_AUDIT*.md` |

---

## 13. Restructuring Plan

> **Critical issue:** the working tree contains three "roots" — the active
> frontend (`src/`), the active backend (`dotlive-backend/`), and two legacy
> duplicates (`dotlive-main-tracked/`, `dotlive-monorepo/`). All evidence
> points to the two legacy trees being abandoned snapshots: their `package.json`
> versions are pinned to earlier dates, neither is referenced by the active
> `package.json` workspaces, and neither has a `routeTree.gen.ts` matching the
> current router.

### 13.1 Proposed layout

```
dotlive-main/
├── apps/
│   ├── web/                      # ⟵ rename from `src/`
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── integrations/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── router.tsx
│   │   ├── server.ts
│   │   ├── start.ts
│   │   └── styles.css
│   └── api/                      # ⟵ move from `dotlive-backend/apps/api/`
│       ├── scripts/
│       ├── src/
│       │   ├── db/
│       │   ├── lib/
│       │   ├── routes/
│       │   ├── types/
│       │   ├── seed-feed.ts
│       │   ├── server.ts
│       │   └── sharedTypes.ts
│       ├── drizzle.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── .env.example
├── packages/
│   └── shared/                   # ⟵ move from `dotlive-backend/packages/shared/`
│       ├── package.json
│       ├── types.ts
│       ├── types.js
│       └── types.js.map
├── docs/                         # All docs (existing + relocated)
│   ├── audits/                   # ⟵ move all `*_AUDIT*`, `BUG_FIX_*`, etc.
│   ├── sessions/                 # ⟵ move `.hermes/prompts/` and session reports
│   ├── plans/                    # ⟵ move `.hermes/plans/`
│   ├── specs/                    # ⟵ move `.kiro/specs/`
│   ├── ARCHITECTURE.md           # ⟵ this file
│   ├── DEV_LOG.md
│   ├── DOT_OS_MASTER_SPEC.md
│   ├── DESIGN_SYSTEM_SPEC.md
│   ├── FRONTEND-PAGE-CONTRACT.md
│   ├── FRONTEND_REDESIGN_CONTRACT.md
│   ├── DEPLOYMENT-CHECKLIST.md
│   ├── MONITORING_SETUP.md
│   ├── PAYSTACK_CONFIG.md
│   └── UPTIMEROBOT.md
├── scripts/                      # ⟵ move `admin-*-test.py`, `check-token.mjs`
│   ├── admin-promote-test.py
│   ├── admin-test.py
│   └── check-token.mjs
├── public/                       # Static assets (move from `dotlive-main-tracked/public/`)
├── .hermes/                      # KEEP — agent working dir
├── .kiro/                        # KEEP — spec dir
├── .lovable/                     # KEEP
├── package.json                  # root workspace
├── bunfig.toml
├── bun.lock
├── tsconfig.base.json
├── eslint.config.js
├── .prettierrc
├── .prettierignore
├── .gitignore
├── components.json
├── AGENTS.md
└── README.md                     # ⟵ add new top-level README pointing here
```

### 13.2 Directory purposes

| Dir | What goes here |
|---|---|
| `apps/web/` | Active frontend. The TanStack Start app. |
| `apps/api/` | Active backend. The Fastify + Drizzle + Neon API. |
| `packages/shared/` | Cross-package TypeScript types. |
| `docs/audits/` | Point-in-time audit, fix, and status reports. Read-only history. |
| `docs/sessions/` | Agent session prompts + verification logs. |
| `docs/plans/` | Sprint and launch plans. |
| `docs/specs/` | Kiro feature specs. |
| `scripts/` | One-off Python / Node scripts not part of any app. |
| `public/` | Static assets served at `/`. |
| `.hermes/` | Agent planning artifacts (do not commit externally). |
| `.kiro/` | Kiro spec tooling state. |

### 13.3 Naming conventions

| Old | New | Reason |
|---|---|---|
| `src/` | `apps/web/` | Standard monorepo layout (`apps/` + `packages/`). |
| `dotlive-backend/apps/api/` | `apps/api/` | Same. |
| `dotlive-backend/packages/shared/` | `packages/shared/` | Same. |
| `dotlive-main-tracked/` | **delete** | Legacy snapshot, unused. |
| `dotlive-monorepo/` | **delete** | Legacy partial backend, unused. |
| `*_AUDIT*.md` at root | `docs/audits/` | Centralised archive. |
| `BUG_FIX_*_COMPLETED.md` at root | `docs/audits/bug-fixes/` | Same. |
| `FINAL_*.md`, `READY-*.md` | `docs/audits/` | Same. |
| `.hermes/prompts/` | `docs/sessions/prompts/` | Discoverable from the docs root. |
| `.hermes/plans/` | `docs/plans/` | Same. |
| `.kiro/specs/` | `docs/specs/` | Same. |
| `admin-*-test.py` at root | `scripts/` | Loose files off the root. |
| `check-token.mjs` at root | `scripts/` | Same. |

### 13.4 Migration steps

| # | Step | Status |
|---|---|---|
| 1 | Inventory confirmed — this document is the source of truth. | ✅ Done |
| 2 | Move loose root scripts (`admin-promote-test.py`, `admin-test.py`, `check-token.mjs`) into `scripts/`. Fix `check-token.mjs` env path to use `import.meta.dirname`. | ✅ Done |
| 3 | Move docs (`.hermes/plans/`, `.hermes/prompts/`, `.kiro/specs/`, root audit `.md` files) into `docs/`. | ⏳ Pending |
| 4 | Rename `src/` → `apps/web/`. | ⏳ Pending |
| 5 | Move `dotlive-backend/apps/api` → `apps/api` and `dotlive-backend/packages/shared` → `packages/shared`. | ⏳ Pending |
| 6 | Delete `dotlive-main-tracked/` and `dotlive-monorepo/`. | ⏳ Pending |
| 7 | Update import paths in `tsconfig.json`, `vite.config.ts`, backend `package.json`. | ⏳ Pending |
| 8 | Add root `package.json` workspaces for `apps/*` and `packages/*`. | ⏳ Pending |
| 9 | Verify with `npm run build` and smoke test of `/discover`. | ⏳ Pending |

### 13.5 Risk assessment

| Risk | Mitigation |
|---|---|
| Import paths break | Use `git mv` so history is preserved; grep all `@/` imports. |
| Lovable sync breaks | Confirmed with `AGENTS.md` — history rewrites are the only thing banned. Move-only operations are safe. |
| TanStack route tree regenerates | `routeTree.gen.ts` regenerates from `apps/web/src/routes/`. |
| Backend env paths shift | Update `dotlive-backend/render.yaml` `rootDir` (this is already a known constraint per project memory). |

---

*Last updated: 2026-07-10 — Audit pass 1 + Phase 1 (loose scripts → `scripts/`) complete.*
