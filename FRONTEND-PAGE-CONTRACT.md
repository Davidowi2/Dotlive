# DOT — Frontend Page-by-Page Redesign Contract

> Canonical source of truth for a best-in-class redesign of the TanStack Start frontend.
> Principles: **Vantage is king · 3 pillars (Credibility/Talent/Capital) · one-question-per-page rule · whiteboarding > options**

---

## 0. Cross-Cutting Design Contracts

These rules apply to every page unless a page-specific section explicitly overrides them.

### 0.1 One-Question-Per-Page Rule
- Every page must have exactly **one primary action / one primary question** the user is answering.
- If a page currently asks the user to do more than one thing, the redesign must split it into distinct routes or use progressive disclosure.
- Metadata: `page.question = "…"` — captured in every page entry below.

### 0.2 Vantage-First Information Architecture
- Any page that surfaces the founder's Vantage data must show: **Vantage Point + the 5 pillar scores** (Founder / Traction / Capital / Market / Execution) and a trend indicator (vs last assessment).
- Supporting metrics (fundability %, total DOT raised, members count) may be present but must be visually subordinate.
- Vantage data must be the **first thing** below the PageHeader, before any charts, tables, or recommendation lists.

### 0.3 3 Pillar Palette
| Pillar | Semantic role |
|--------|---------------|
| **Credibility** | Vantage, validation, trust — `primary` accent |
| **Talent** | Builders, Academy, Work, Mentor — `teal` accent |
| **Capital** | Capital, Demo, Portfolio — `gold` accent |

All accent colors, icons, and sidebar sections must map to one of the three pillars.

### 0.4 Layout Primitives (non-negotiable)
| Primitive | When to use |
|-----------|-------------|
| `PageShell` | Public pages (home/about/journey). Provides global header/footer/eyebrow/title/intro. |
| `AppShell` | Authenticated pages. Provides top header, role-aware sidebar, mobile bottom nav, theme toggle, notification bell. |
| `HeroCardMockup` (landing only) | App preview on `/`. Factual mock data only; never mock dynamic user data. |
| `SectionMarker` | Long-form content pages. `n="01" label="…"` divider. Keeps editorial rhythm. |
| `StatCard` | Dashboard tiles. Always label + value + optional trend + arrow-to-detail. |
| `EmptyState` | Empty data states. Must offer exactly **one** primary action. |
| `PageSkeleton.*` | Loading states. Match the shape of the content, not a spinner island. |

### 0.5 Typography
| Element | Token |
|---------|-------|
| H1 page title | `font-display text-4xl font-bold sm:text-5xl` |
| H2 section title | `font-display text-2xl sm:text-3xl font-light tracking-tight` |
| H3 card title | `font-display text-lg font-semibold` |
| Eyebrow / section label | `tracking-editorial text-muted-foreground` |
| Body | `text-sm/leading-relaxed` (public) · `text-sm/leading-relaxed` (app) |
| Mono / numbers | `tabular-nums tracking-tight` |

### 0.6 Motion & Animation
- All fades: `FadeIn` with `delay` prop, 0 → 1s range.
- Hover lift: `hover:-translate-y-0.5 hover:shadow-soft transition-all`
- No `<marquee>`, no auto-rotating carousels, no CSS keyframes outside `motion.tsx`.
- Spinners only for sub-500ms waits; anything longer gets a skeleton.

### 0.7 Loading & Empty States
- **Skeleton first**: any data-fetching page must render a shape-matched skeleton before the spinner.
- **EmptyState**: always `icon + headline + body + exactly one primary CTA`.
- For authenticated pages with no data: **whiteboarding screen** (see `EcosystemEmptyState.tsx` pattern) — invite user to define their market before showing blank tables.

### 0.8 Forms & Validation
- Validation messages: `sonner` toast only. No inline error labels unless the field is required and empty at submit.
- All forms: `space-y-4` between inputs. Labels via `<Label htmlFor="#">`. Primary button `w-full` on mobile, `auto` on desktop.
- Password strength meter: 4-step bar, colors `bg-destructive → bg-warning → bg-gold → bg-primary`.

### 0.9 SEO & Meta
- Every route: `head()` function returning `meta[]` with at minimum `title`, `description`, `og:title`, `og:description`.
- Public marketing pages: also `og:image` referencing `/og/<route>.png`.
- Authenticated app pages: `robots: noindex`.

### 0.10 Mobile Breakpoints
- Sidebar collapses to bottom nav (top 4 items + "More" sheet).
- All grids go single-column below `sm`.
- Hero mockups on `/` hide on `lg:block`; introduce alternate mobile composition instead.

### 0.11 Accessibility
- All interactive icons: `aria-label` or visible label.
- Color never the sole signal: status also uses icons + uppercase text.
- Focus rings: `focus-visible:ring-2 focus-visible:ring-primary/40`.

---

## 1. Public Marketing Pages

### 1.1 `/` — Landing Page (LandingPage)

**Question this page answers:** *"What is DOT, and why should I care?"*
**User state:** Anonymous visitor. Possible landing intent: founder / investor / community leader / builder / curious.

#### Current Sections
| Section | Purpose | Contract |
|---------|---------|----------|
| HeroSection | Value prop + primary CTA | **Keep.** H1 already reads like a one-question answer. Add subheadline translation variant meta (`h1_alt`) for locale testing. |
| StartupScoreHeroSection | A/B tested headline for scoring | **Restructure.** The currency selector USD/NGN/ZAR/BTC is misplaced here — it has no context. Move to onboarding step 1 or `/discover` filter. Limit to 2 variants in prod (A/B), remove inline currency toggle. |
| BuiltWithSection | Stack showcase | **Keep responsibility, rename category.** From "Built With" → **"Built on real infra"** — one row per dependency, not three pills. Demystifies "which real backs this." |
| ByTheNumbersSection | Social proof | **Guard it.** Hardcode "7 stages, 500 DOT starter, 2,000 DOT→Founder" — do not let this degrade into fictitious community counts. |
| BuilderValueSection | Who is this for? | **Keep.** Three audiences = Credibility / Talent / Capital groupings. Each card: 3 bullet points max, one CTA. |
| HowItWorksSection | How DOT operates | **Keep.** Rename to "What DOT does." Six pillars already exist on `/platform` — consolidate or move there to reduce redundancy. |
| BuilderJourneySection | End-to-end progression | **Keep** as visual summary. Link each stage word to the journey's corresponding anchor on `/journey`. |
| PillarsSection | 3 pillars deck | **Eliminate redundancy** with BuilderValueSection — merge these into one unified "6 Pillars" section: 3 sections × 2 columns = 6 cards. |
| PilotProgramSection | Program stats | **Keep.** Rephrase headline: from "Join the pilot" to "In pilot — numbers coming." Frames honesty over hype. |
| AudiencesSection | Wrapping CTA | **Keep + tighten.** One primary button: "Start free — get 500 DOT." One secondary: "See the platform." Remove tertiary link. |

**Redesign specs:**
- Hero CTA updates to use `?mode=signup` for deep-linking.
- Footer links to `/terms`, `/privacy`, `/about` — all must be present and live.
- `ssr: true` must remain on `/` — it is a primary SEO landing page.
- `MobileCta` (`sticky` bottom on mobile) is **mandatory** — link anchors to `#start` / `#pillars` / `#join`.

### 1.2 `/about` — About DOT

**Question this page answers:** *"Who are the people behind DOT, and what do they believe?"*
**User state:** Proving legitimacy. High intent to trust/verify.

#### Sections
| Section | Status |
|---------|--------|
| 01 Mission | **Keep.** Strong "measurable, not opaque" framing — align visually with Vantage metric. |
| 02 Company Story | **Keep.** Add a timeline card component for the 2026 founding story. |
| 03 Values | **Keep.** 4-card grid is solid. |
| 04 Team | **Hardened.** "Coming soon" is legitimate — reframe as "Our team page is under wraps until the pilot closes." Do not fabricate bios. |
| 05 Where we are, honestly | **Keep.** Solid honest framing. Promote to 03, downgrade Values to 04 — order by information value (mission → story → footprint → values → team). |

**Redesign specs:**
- Replace hardcoded `10,000 · 100 · $200K` stat block with a component that reads from a `pilotTargets` constant in `lib/constants.ts`.
- CTA block: use `[background-image:var(--gradient-primary)]` only.

### 1.3 `/journey` — Founder Journey

**Question this page answers:** *"What stages will I move through, and what do I earn at each?"*
**User state:** Evaluating fit. Needs clarity on progression and incentives.

#### Sections
| Section | Status |
|---------|--------|
| 01 Why stages | **Keep.** |
| 02 Seven stages | **Keep.** Improve interactive: allow click on a stage to expand outputs inline — no scroll jumping. |
| 03 DOT wallet | **Keep.** Illustrative. Pilot values should come from `lib/constants.ts`. |
| 04 End-to-end | **Keep.** Three-column layout is clean. |

**Redesign specs:**
- Stage numbers are **purely visual** — real data-driven stage mapping lives in `/_authenticated/dashboard`. Do not duplicate the rail.
- Add a "Start the assessment" CTA at the bottom of page that routes to `/auth?mode=signup`.

### 1.4 `/platform` — Platform

**Question this page answers:** *"What are the six tools in DOT, and how do they relate?"*
**User state:** Needs product mental model.

#### Sections
| Section | Status |
|---------|--------|
| 01 Overview / data model | **Keep.** Shared data model aside is excellent. |
| 02 Six pillars grid | **Keep.** 6 cards. Add a subtle accent stripe at the top of each card. |
| 03 Stack | **Keep.** Dependencies table is honest. |
| 04 Data & integrations | **Keep.** |
| 05 Roadmap | **Keep.** |

**Redesign specs:**
- Pillar mapping: Vantage=Credibility, Academy/Work=Talent, Demo/Capital=Capital, Sessions/Leaderboard=Growth.
- Ensure "Vantage" in `/platform` matches `/journey` pillar numbering exactly.

### 1.5 `/investors` — Investors & Capital Partners

**Question this page answers:** *"Why would I use DOT Demo to find deals?"*
**User state:** Capital partner evaluation. Needs evidence, trust, and an application path.

#### Sections
| Section | Status |
|---------|--------|
| 01 DOT Demo overview | **Keep.** Gold accent consistent. |
| 02 Demo features | **Keep.** |
| 03 Vantage filter | **Keep.** Make thresholds editable per partner in backend — surface that in copy ("tuneable per fund"). |
| 04 Pilot capital | **Keep.** Remove redundant `$200,000` total — appears twice. Consolidated to one call-out. |
| 05 Partner types | **Keep.** 6 cards. Arrow-right on each card must go to `/auth?mode=investor`. |

**Redesign specs:**
- "Apply to Demo" aside panel must have a functional sign-up flow for investors — right now it's a placeholder block.
- Capital partner `Wallet` earns mention must show actual on-chain record, not marketing claim.

### 1.6 `/communities` — Community OS

**Question this page answers:** *"What does DOT give my community, and how do I apply?"*
**User state:** Community leader evaluating platform commitment.

#### Sections
| Section | Status |
|---------|--------|
| 01 What Community OS is | **Keep.** |
| 02 Features grid | **Keep.** |
| 03 Referral mechanics | **Keep.** Step list is strong. |
| 04 Community Vantage | **Keep.** Illustrative leaderboard — add caveat clearly: "pilot scores · not real." |
| 05 Apply | **Keep.** "What we'll ask" panel should lead to actual form submission. |

**Redesign specs:**
- Add `?mode=community` to the CTA on this page so the signup flow captures community intent.

### 1.7 `/auth` — Sign In / Sign Up

**Question this page answers:** *"How do I get in, and what happens next?"*
**User state:** New or returning user. Multi-modal auth (email, OTP, Google, magic link).

#### Current Modes
| Mode | Route state | Contract |
|------|-----------|----------|
| `signin` | Default | **Keep.** Email + password. Add Google button visibility-demoted below "or sign in" divider. |
| `signup` | `?mode=signup` | **Keep.** 5-step wizard (Name → Email/Password → Verify → Intent → Profile chips). |
| `otp` | `setMode("otp")` | **Keep.** Email only. |
| `otp-verify` | `setMode("otp-verify")` | **Keep.** Auto-submit on 6th digit. |
| `forgot` | `?resetToken=…` or forgot link | **Consolidate** with `/reset-password`. Keep `/reset-password` as canonical URL. |

**Redesign specs:**
- Remove demo-mode sign-in shortcut (the `import("@/api/client").then…` dev bypass).
- The 5-step signup intent picker should capture `community` intent → route `/auth?mode=signup&intent=community` so the onboarding stage routes correctly.
- After signup completion → `/onboarding`, not directly to `/dashboard`.
- **One-question-per-page**: the intent picker must be a single page, not a modal, because intent determines routing.

### 1.8 `/auth-callback` — OAuth / Magic Link / Reset Router

**Question this page answers:** *"Is the auth token valid, and where do I go?"*
**User state:** Mid-flow. No UI needed beyond status.

**Contract:** Keep as-is. Routes to:
- New user → `/onboarding`
- Existing user → `/dashboard`
- Error → `/auth?mode=signin` with error toast

### 1.9 `/events/` — DOT Demo Events List

**Question this page answers:** *"What DOT Demo events are open right now?"*
**User state:** Prospective pitcher or voter.

**Contract:**
- Keep `AppShell`-backed (authenticated-optional).
- Sections: **LIVE now** (prominent) → **Open for registration / voting** → **Upcoming** → **Past**.
- Each event card: name, status badge, prize pool, date range, track chips, countdown timer.
- "Apply to pitch" button routes to `/auth?mode=signup` if unauthenticated.

### 1.10 `/events/$slug` — Event Detail

**Question this page answers:** *"What is this event, who are the ventures, and how do I vote?"*
**User state:** Engaged. Could be founder, voter, or sponsor.

**Contract:**
- Hero: name, status, description, prize pool, date/time meta, Apply button (if open), livestream link (if live).
- Voting section: only visible `event.status === "voting_open" || "live"`. Show sign-in gate if anonymous.
- Ventures are rendered as cards with vote button per venture. Vote is a mutation → optimistic update + toast.
- Leaderboard: top N by `totalVotes`. Render only for voting-open or live events.
- Sponsors / Judges grids: visible if populated.
- No redirect should occur on vote — toast + invalidation is sufficient.

### 1.11 `/founder/$id` — Public Founder Profile

**Question this page answers:** *"Who is this founder, how credible are they, and how do I back them?"*
**User state:** Investor / community leader / curious. No auth required.

**Contract:**
- Keep public no-auth. If share offer exists → show BuySharesDialog on auth gate.
- Hero: avatar initial, venture name, founder name, `dotId` code, bio, meta strip (industry, country, stage, website).
- KPI strip: Vantage Point, Fundability %, Community votes, DOT raised — 4 cells max.
- VentureEnrichmentSection: 11-field profile card for the first owned venture.
- JourneyStrip: 7-stage rail colored by stage mapping.
- Ventures list: card per owned venture.
- Empty state: "Profile not yet complete" with `/discover` escape.
- ShareLink: copy-to-clipboard using `navigator.clipboard.writeText`.
- **Investor actions must require auth.** → redirect to `/auth?mode=signin&next=/founder/<id>`.

### 1.12 `/reset-password` — Password Reset

**Question this page answers:** *"How do I set a new password?"*
**User state:** Clicked email reset link OR requesting a fresh link.

**Contract:**
- Three states in order: *(no token)* → request form → *(token in URL)* → set-new-password form → success → `/auth?mode=signin`.
- Merge `/auth` forgot mode into here; keep `/reset-password` canonical.
- Validation: passwords must match; min 8 chars.

### 1.13 `/` (splat) — Not Found

**Question this page answers:** *"Where do I go from here?"*
**Contract:**
- Two variants: public (with `SiteHeader`/`SiteFooter`) and authenticated (with `AppShell` + Back button).
- Search box is decorative — label "Search coming soon."
- Suggested destinations: Home, Platform, Journey, Communities — 4-card grid.
- Zero external links that could leave the app.

---

## 2. Authenticated App Pages

### 2.1 `/dashboard` — Dashboard

**Question this page answers:** *"What is my current status, and what's the next right action?"*
**User state:** Logged in. First thing they see each session.

#### Current Components
| Block | Status |
|-------|--------|
| PageHeader (welcome + primary action) | **Keep.** Action is context-aware: founders → "Update Vantage", others → "Top up wallet." |
| Wallet + Vantage hero cards | **Keep.** Gold for wallet, primary for Vantage. |
| Founder journey rail (5 stages) | **Keep.** Show first 5 stages only. Progress bar is accurate to `JOURNEY_STAGES` index. |
| Stat cards (Vantage / Fundability / Academy / Wallet / Builder) | **Keep.** Role-aware: seekers see finance + fundability; builders see earned/gigs/rating. |
| Action cards (workspace shortcuts) | **Refine.** Surfaces differently per role. Max 4 actions visible. |

**Redesign specs:**
- The journey rail connector lines must not break on mobile — test `sm:left-7` vertical connectors on narrow screens.
- Empty-state onboarding for brand-new founders: show "Take Vantage" as the only focused action, replace stat cards with a single whiteboarding card.
- Never render stale `+38 pts this week` hardcoded — derive from the most recent two assessments or show `—`.

### 2.2 `/vantage` — Vantage Assessment

**Question this page answers:** *"How ready is my venture, and what should I improve?"*
**User state:** Founder ready to take or reviewing assessment.

#### Current Flow
| Stage | Status |
|-------|--------|
| Intro | **Keep.** Summary of 5 pillars + latest score + trend. |
| Taking (question wizard) | **Keep.** Auto-advance on likert/select. Progress bar. Category header. |
| Results | **Keep.** Strengths / Weaknesses / NextActions — delivered as a report card. |

**Redesign specs:**
- Results view must render the 5-pillar donut/ring SVG with actual scores from `submitAssessment` response, not a placeholder.
- Add a "Share report" button that copies a shareable summary to clipboard.
- Per-question "upgrade advice" must not exceed 6 items — cap is already there but add a visual separator between category-level and strategic advice.
- The `UPGRADE_ADVICE` map is currently inline (~130 lines). Refactor to `lib/vantage-advice.ts` to keep the route lean.

### 2.3 `/events/` + `/events/$slug` (app shell)

**Question these pages answer:** *"What Demo events can I participate in, and how do I engage?"*

**Contract** — already defined in §1.9 and §1.10. Ensure both pages work both authenticated and anonymous.

### 2.4 `/discover` — Discover (ventures / community)

**Question this page answers:** *"Who is building what, and how do I connect?"*
**User state:** Investor, founder, or community leader in exploration mode.

**Redesign specs:**
- Tabs (ventures / communities / courses) — use `Tabs` from `@/components/ui/tabs`.
- Venture card: name, industry, stage, country, Vantage score, DOT raised, vote count.
- Filter sidebar: Vantage Point (min), stage, sector, country. Collapse on mobile → fly-in sheet.
- "Vote" button is commit-style (heart icon + count). Disabled without auth with inline sign-in CTA.

### 2.5 `/wallet` — Wallet

**Question this page answers:** *"How much DOT do I have, where did it come from, and what can I do with it?"*
**User state:** Needs balance clarity plus transfer/spend action.

**Redesign specs:**
- Top card: balance (large) + "Deposit" + "Withdraw" + "Send" — gold accent.
- Transaction list: type icon + description + amount + timestamp. Filter by All / Earned / Spent.
- Pending transactions: amber badge.
- Withdrawal form: KYC tier check first. If `tier !== "verified"` → inline KYC upgrade CTA.
- Do not show balance changes to other users. Add `visibility: private` to all wallet mutations.

### 2.6 `/settings` — Account Settings

**Question this page answers:** *"Who am I on DOT, and how do I control my account?"*
**User state:** Managing personal profile + preferences.

**Redesign specs:**
- Tabs: Profile / Security / Notifications / Danger zone.
- Profile: name, email (read-only after signup), country, bio, avatar upload.
- Security: password change, active sessions (from `/admin/sessions`), connected OAuth.
- Danger zone: delete account (requires re-auth + 7-day grace period).
- Theme toggle: already exists globally; mirror here for discoverability.

### 2.7 `/search` — Search

**Question this page answers:** *"Who or what am I looking for?"*
**User state:** Knows a name, community, or course — needs to find it.

**Redesign specs:**
- Search input is the **only** element above the fold.
- Results categories: Ventures / Founders / Communities / Academy courses / Sessions.
- Keyboard shortcut hint: `⌘K` focus → wire up a `cmdk` palette for global search.
- Empty state: "Try searching for a founder name, community, or course."

### 2.8 `/vantage` result sharing (new behavior)

**Whiteboarding contract:** On results view, include a "Whiteboard this" action that opens a `Vault` (todo list) with 3-6 specific actions derived from `UPGRADE_ADVICE` — gap-closing, not option-listing.

---

## 3. Authenticated Route-to-Pillar Mapping

| Route | Pillar | Primary Question |
|-------|--------|-----------------|
| `/dashboard` | Credibility | "Where am I, and what's next?" |
| `/vantage` | Credibility | "How ready is my venture?" |
| `/journey` | Credibility | "What's the full progression?" |
| `/academy` | Talent | "What can I learn next?" |
| `/work` | Talent | "Where can I earn DOT?" |
| `/builder` | Talent | "What gigs are available?" |
| `/sessions` | Talent | "What mentoring events are open?" |
| `/certificates` | Talent | "What have I completed?" |
| `/wallet` | Capital | "How much DOT do I have?" |
| `/demo` | Capital | "What venture competitions are live?" |
| `/investor` | Capital | "What should I look at?" |
| `/portfolio` | Capital | "Where am I invested?" |
| `/capital` | Capital | "What's my capital-partner pipeline?" |
| `/judge` | Capital | "What do I need to score?" |
| `/community` | Community | "How is my community performing?" |
| `/community/channels` | Community | "What conversations are happening?" |
| `/community/challenges` | Community | "What active challenges can I join?" |
| `/ventures` | Credibility | "How are my ventures positioned?" |
| `/profile` / `/settings` | Workspace | "Who am I, and how do I control it?" |
| `/onboarding` | Workspace | "What role fits me?" |
| `/discover` | Workspace | "Who else is here?" |
| `/notifications` | Workspace | "What needs my attention?" |
| `/referrals` | Community/Growth | "Who have I invited, and what's their status?" |
| `/leaderboard` | Growth | "Where do I rank?" |
| `/kyc` | Capital | "Am I verified to transact?" |

---

## 4. Non-Negotiable Guardrails

1. **Never mock user data in production.** `HeroCardMockup` is fine on `/` (marketing). No other page may display synthetic data.
2. **Vantage is king.** Any page where Vantage data is loadable must show it first. Never bury a 0-1000 score below promotional cards.
3. **One question per page.** Enforce with `page.question` meta field in route definitions. Reviewer checklist.
4. **Whiteboarding > option lists.** When a user has no data (zero assessments, zero ventures, empty portfolio) show a structured onboarding card asking one question, not a grid of ten feature cards.
5. **Pillar consistency.** Every page's accent color, icon, sidebar section, and CTA tone must map to one of the three pillars or to the neutral workspace category.
6. **No synthetic social proof.** Never fabricate community counts, funding amounts, or user quotes. Use "In pilot" / "Coming soon" / "Goals" language honestly.
7. **Auth gates are explicit.** If an action requires auth, redirect to `/auth?mode=signin&next=<encoded>` rather than silently failing or showing a disabled button with no explanation.

---

## 5. File Surface of Record

| File | Role | Contract Status |
|------|------|-----------------|
| `src/routes/index.tsx` | Landing page | Redesign per §1.1 |
| `src/routes/about.tsx` | About | Redesign per §1.2 |
| `src/routes/journey.tsx` | Journey | Redesign per §1.3 |
| `src/routes/platform.tsx` | Platform | Redesign per §1.4 |
| `src/routes/investors.tsx` | Investors | Redesign per §1.5 |
| `src/routes/communities.tsx` | Communities | Redesign per §1.6 |
| `src/routes/auth.tsx` | Auth | Redesign per §1.7 |
| `src/routes/auth-callback.tsx` | Auth callback | No change |
| `src/routes/events/index.tsx` | Events list | Redesign per §1.9 |
| `src/routes/events/$slug.tsx` | Event detail | Redesign per §1.10 |
| `src/routes/founder.$id.tsx` | Public founder profile | Redesign per §1.11 |
| `src/routes/reset-password.tsx` | Password reset | Consolidate per §1.12 |
| `src/routes/$.tsx` | Not found | Keep |
| `src/routes/privacy.tsx` | Privacy | Exists — verify content current |
| `src/routes/terms.tsx` | Terms | Exists — verify content current |
| `src/routes/_authenticated/dashboard.tsx` | Dashboard | Keep + harden per §2.1 |
| `src/routes/_authenticated/vantage.tsx` | Vantage assessment | Keep + extract advice per §2.2 |
| `src/routes/_authenticated/discover.tsx` | Discover | Redesign per §2.4 |
| `src/routes/_authenticated/wallet.tsx` | Wallet | Redesign per §2.5 |
| `src/routes/_authenticated/settings.tsx` | Settings | Redesign per §2.6 |
| `src/routes/_authenticated/search.tsx` | Search | Redesign per §2.7 |
| `src/components/app/AppShell.tsx` | App shell | Privileged — keep navigation/sections |
| `src/components/site/PageShell.tsx` | Public page shell | Privileged — keep layout |
| `src/components/site/SiteHeader.tsx` | Public header | Keep, add `/auth` deep link support |
| `src/components/site/SiteFooter.tsx` | Public footer | Verify all links live |
| `src/components/site/MobileCta.tsx` | Mobile sticky CTA | Keep on `/` |
| `src/components/ui/motion.tsx` | Animations | Privileged — extract new `FadeIn` variants |

---

*Contract written: 2026-07-05*
*Next action: whiteboard with 3 fixed options per page starting with `/`, `/auth`, `/dashboard`, `/vantage` — per user constraint.*
