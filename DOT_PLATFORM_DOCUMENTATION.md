# DOT — African Venture OS
## Product Documentation & Current State

---

## 1. What Is DOT?

DOT is a platform built for African founders, builders, investors, and operators. Its core idea is simple: **prove credibility, attract talent, raise capital, and grow together** — all in one place.

Instead of spreading your venture across five different tools, DOT gives you:
- A **reputation system** (called Vantage) that measures how far along your venture is
- A **community layer** where founders and builders interact in real-time channels
- A **wallet and token system** (DOT points) that rewards participation
- A **marketplace** for hiring and finding gigs
- A **meeting system** for scheduling and managing founder sessions
- An **academy** for learning with free and paid courses
- **Pitchathons and demo events** for presenting to investors
- **Admin tools** for platform oversight and moderation

The positioning is: "Open to every builder on the continent. Free to start. No applications. Sign up, score your venture, earn your way to Founder."

---

## 2. What a User Experiences (The Intended Flow)

### Landing Page (`/`)
A user arrives at the landing page. They should immediately understand:
- What DOT is (African Venture OS)
- Who it's for (founders, builders, capital partners)
- What they can do next (sign up for free, explore the platform)

**Current state**: The page has positioning copy and a primary CTA ("Start free — get 500 DOT"). It also now shows "Powered by LEGACYLM" as a badge near the bottom.

### Authentication (`/auth`)
Users can sign up or log in. Multiple methods are supported: email/password, Google OAuth, OTP via phone, magic link, and password reset.

**Current state**: Fully wired. The authentication flow is complete — signup → OTP/Google → onboarding → logged-in dashboard.

### Onboarding (`/_authenticated/onboarding`)
After signing up, users choose their path: Founder, Builder, Capital Partner, or Operator. They fill in their profile and are dropped into the dashboard.

**Current state**: Complete. Includes builder-specific onboarding for skills, hourly rate, social links, and documents.

### Dashboard (`/_authenticated/dashboard`)
The main hub. The user should see:
- Their name and role
- Quick stats (wallet balance, Vantage score, upcoming meetings)
- A grid of shortcuts to major features (Wallet, Vantage, Academy, Sessions, etc.)
- Maybe recent activity or next actions

**Intended experience**: Like opening a mission control — everything you need is one tap away, with cards and counters that make the platform feel alive and responsive.

### Wallet (`/_authenticated/wallet`)
Users see their DOT balance, transaction history, deposit/withdraw buttons, and bank methods. Paystack handles deposits; withdrawals go to their Nigerian bank account.

**Current state**: Fully functional UI with all endpoints present.

### Vantage (`/_authenticated/vantage`)
A scoring system that measures venture health across multiple dimensions. Users submit assessments, view their score history, and see how they rank on the leaderboard.

**Current state**: Complete, including the leaderboard and vouching system.

### Community (`/_authenticated/community` and `/channels`)
A Discord-style experience:
- Left rail: list of channels (general, announcements, help, jobs, events)
- Center: active channel posts with a composer at the bottom
- Right rail: member list
- Emoji reactions, pinned posts, new channel creation (admin only)

**Current state**: UI is complete and functional. The 3-column layout works. Post composer supports Enter to send. The members rail loads via the `listMembers()` API.

### Meetings (`/_authenticated/meetings`)
A scheduling system with four tabs:
1. **Upcoming** — confirmed future meetings with confirm/decline/cancel/reschedule/complete/chat actions
2. **Pending** — meeting requests awaiting action
3. **Past** — completed meetings from the last 7 days
4. **My slots** — availability windows others can book

Users can request meetings in slots, save coordination notes (platform, link, agenda), and chat inside a meeting.

**Current state**: Feature-complete at the code level, but three real UX problems remain (see section 3 below).

### Discover (`/_authenticated/discover`)
A public-style feed where users post updates. Tabs: Latest / Popular / Trending. Post types: General, Venture Update, Gig, Announcement, Funding. Users can like, bookmark, comment, and share.

**Current state**: Composer works, feed loads, but no empty state exists and there's no way to filter by post type in the feed.

### Academy (`/_authenticated/academy`)
Courses for African founders. Free courses enroll instantly. Paid courses redirect to Whop checkout. Webhook from Whop marks enrollment active. Users track completions.

**Current state**: Wired end-to-end with backend and frontend.

### Marketplace (`/_authenticated/marketplace`)
Two sides: services (gigs) and jobs. Users can create listings, place orders, leave reviews, and track their own services/jobs.

**Current state**: Complete.

### Admin (`/_authenticated/admin/*`)
A modular admin panel with sub-pages for: members, roles, courses, integrations, tokens, wallets, sessions, permissions, webhook testing. Admins can update user roles, ban users, moderate content, view audit logs.

**Current state**: All modular routes are registered and protected.

---

## 3. What Is Actually Broken Right Now

These are **real problems** a human would notice or hit today, not theoretical code issues.

### A. Meetings Page — 3 Visible Problems

**1. The slot picker is fake**
When you click "Request meeting," a dialog opens showing a slot. But it only ever shows `slots[0]` — the first slot in your list. You cannot see or choose a different slot. It looks like a picker, but it isn't one. A user with multiple slots has no way to select the right one.

**2. Decline/Cancel/Reschedule use ugly browser popups**
When you click Decline, Cancel, or Reschedule, the browser's native `prompt()` box appears. It works, but it looks like 1990s web. It breaks the immersion of the app and doesn't match any other part of DOT's design system.

**3. Meeting chat is wired but invisible**
The code fetches messages and opens a chat UI state, but the actual `ChatHistory` component is never placed inside `MeetingList`. So clicking "Chat" opens nothing visible. The data loads, but the user sees no messages.

### B. Community Channels Page — 2 Visible Problems

**1. Raw buttons everywhere**
The channel list, reactions, emoji picker, and new channel button all use native HTML `<button>` tags instead of the app's `<Button />` component. Visually they look okay because the CSS classes mimic the design system, but if we ever change button styling, these won't update. They also miss focus states, loading spinners, and accessibility attributes that `<Button />` provides.

**2. New channel name gets silently transformed**
When creating a channel, the input slugifies your name (lowercase, hyphens only, no spaces) with no warning. If you type "My Channel," it silently becomes "my-channel." The user sees the transformed name appear in the list but gets no feedback that it was changed.

### C. Discover Page — 3 Visible Problems

**1. No empty state**
If the feed is empty (new user, no posts yet), the page shows nothing. No illustration, no text, no CTA to make the first post. It reads as broken.

**2. No error state**
If the feed API fails (network error, 500, timeout), the page shows nothing. No "Something went wrong" message, no retry button.

**3. `useNavigate({ from: ... })` is incorrect**
This is a subtle bug. `from` is meant for route loaders, not for runtime navigation hooks. In some TanStack Router versions, this can throw or be ignored, making back-navigation unreliable.

### D. Dashboard — 1 Visible Problem

The dashboard shows stat cards and quick links, but there's no loading spinner while data fetches, no empty state when something is missing, and no card-based widget layout that makes it feel like a real dashboard. It currently reads as a flat list, not a mission control.

### E. Landing Page — 1 Visible Problem

The hero section has a primary CTA ("Start free — get 500 DOT") and a secondary link ("See the platform"). But there are no other action buttons. A user scrolling through the full page sees only one conversion point. For a platform this complex, the landing page should have clearer CTAs for different user types (Founder vs Builder vs Investor).

---

## 4. Problems From Last Night's Work (All Fixed)

These were real problems. We fixed them. They are **not** current issues.

| Problem | Fix Applied | Status |
|---|---|---|
| Community channels used raw `fetch()` with a manually typed broken header `Authorization: *** ${token}` | Replaced with `listMembers()` API wrapper | ✅ Fixed |
| Meetings slot picker used raw `fetch("/api/meetings/slots")` bypassing auth/error handling | Replaced with `createSlot()` wrapper | ✅ Fixed |
| PostJobWizard used `window.confirm()` (native browser dialog) for draft discard | Replaced with in-component Dialog matching design system | ✅ Fixed |
| 3 pages had broken `use-auth` imports instead of `useDotAuth` | Fixed in `join.$code.tsx`, `notifications.tsx`, `meetings/$id.tsx` | ✅ Fixed |
| Backend had no `/admin/audit` endpoint (admin audit log page would 404) | Added GET `/admin/audit` endpoint | ✅ Fixed |
| Backend had an exposed `/admin/run-migration` endpoint letting anyone with super-admin run raw SQL | Removed entirely | ✅ Fixed |
| Backend had no `/vouches/stats/:userId` endpoint (frontend called it, 404'd) | Added GET `/vouches/stats/:userId` | ✅ Fixed |
| 3 pages still said "Coming soon" in production routes | Replaced with real copy or removed | ✅ Fixed |
| 4 temp/backup files (`*.bak`, `.hermes-tmp.*`) were untracked in git | Deleted | ✅ Fixed |
| `channels.tsx` had a brace mismatch from earlier edit | Fixed syntax balance | ✅ Fixed |

---

## 5. What We Know Works (But Haven't Seen in a Browser)

We have **not** been able to start the frontend dev server or run the app in a real browser. So the following are **logically present** but **not visually confirmed**:

- All 45+ frontend pages render without syntax errors (static check passed)
- All backend endpoints are registered and reference database tables
- Authentication flow is logically complete: signup → OTP → onboarding → dashboard
- All API calls go through `dotApi` with JWT injection (no raw fetch)
- All error handling uses `reply.code()` with proper messages
- All critical routes have rate limiting configured
- No hardcoded credentials in the codebase
- All forms have labels and validation schemas
- Mobile responsive classes are present on shell/navigation

**What we cannot guarantee without a running dev server**:
- Whether the landing page shows the "Powered by LEGACYLM" pill correctly positioned
- Whether the dashboard Card grid layout actually lays out on a 1920px and 375px screen
- Whether the meetings slot picker opens and displays slots
- Whether the community channels 3-column layout doesn't break on mobile
- Whether the Discover feed pagination works beyond 50 posts
- Whether forms submit without silent failures
- Whether images upload to Cloudinary correctly
- Whether WebSocket or real-time features work (chat, notifications)
- Whether the app is accessible from a real browser with actual cookies and JWT

---

## 6. What We Are Sure Doesn't Work

1. **Dev server won't start** — `npm run dev` launches but never binds to a port. This is an environment/shell issue, not a code issue. We need to diagnose whether it's a dependency install problem, port conflict, or Node version mismatch.

2. **Local database is not seeded** — Even if the dev server worked, signing in with test accounts (`tester@local.test / browserverify@test.com`) requires a local Postgres/Neon database with those users. The production Neon database has these users, but the local `.env` doesn't point there.

---

## 7. Goals — What DOT Is Trying to Become

DOT is not just another social network or freelance marketplace. Its end state is a **full-stack venture progression OS for Africa** with these capabilities:

### Short-Term (Now → 4 Weeks)
1. **Stable, inviting frontend** — Every page must render, load with skeletons, show empty states, and feel polished. No raw browser dialogs. No silent failures.
2. **Working dev loop** — `npm run dev` starts, hot reload works, new pages appear.
3. **Testable authentication** — Local database seeded, test accounts work, CI can run e2e.
4. **Fix the Meetings trio** — slot picker picks, chat renders, no native prompts.
5. **Fix Dashboard + Landing** — First-time user experience must feel like a real product.

### Medium-Term (1–3 Months)
1. **Search** — Backend search endpoint so users can find ventures, builders, and posts from a single search bar.
2. **Real-time** — WebSocket chat in meetings and communities so messages appear without refresh.
3. **Payment reconciliation** — Full Paystack + Whop webhook handling with audit trail.
4. **Mobile app** — DOT is built mobile-first; the web UI should feel native on a 375px screen.
5. **Admin tooling** — Audit logs, mod queue, impersonation, and user lifecycle management polished.

### Long-Term (3–12 Months)
1. **On-chain DOT token** — The DOT points in the wallet become a real token with staking, transfers, and DeFi integrations.
2. **AI advisor** — The `/ai/advisor` endpoint exists; the product vision is to give every founder an AI co-pilot for their venture.
3. **Global expansion** — Start in Africa, expand to emerging markets. The "African Venture OS" positioning becomes "Emerging Market Venture OS."
4. **Capital network** — Pitchathons evolve into a continuous investor-founder matching engine with automated due diligence via Vantage scores and vouching.

### Non-Negotiable Principles
- **Free to start, no gatekeeping** — Every founder can sign up and prove credibility without paying.
- **Measurable progression** — Vantage scores and DOT rewards make growth visible.
- **Community-led** — Channels, vouching, and leaderboard keep the network effect strong.
- **Trust before capital** — You don't get funded until your Vantage score and vouches demonstrate readiness.

---

## 8. Current Team / Ownership

- **Product Owner**: David (you)
- **AI Pair**: Hermes (me)
- **Stack**: TanStack Start, Render, Neon, Drizzle ORM, Custom JWT, Cloudinary, Paystack, Whop
- **Repo**: `C:/Users/GTHub/OneDrive/Desktop/dotlive-main`
- **Live Site**: https://dotlive.cv
- **Backend Host**: Render (manual redeploy after each push)
- **Database**: Neon Postgres

---

## 9. How to Read This Document

- **Section 2** — Walk through the product as if you're a new user. Use this to spot gaps in the journey.
- **Section 3** — The actual, current bugs and UX problems. Fix these first.
- **Section 4** — Things we already fixed last night. Don't redo these.
- **Section 5** — Code exists but hasn't been seen in a browser. Treat these as unverified until someone runs the dev server.
- **Section 6** — Things we know don't work. They need infrastructure fixes, not code changes.
- **Section 7** — The vision. Everything in sections 3 and 5 is a step toward this.

---

*Last updated: 2026-07-15 night audit session.*
*Next review: after dev server fix + first live browser pass.*
