# DOT OS — MASTER SPECIFICATION DOCUMENT
**Version:** 1.0  
**Date:** 2025-07-04  
**Status:** LIVING DOCUMENT — Update with every architectural decision

---

## 1. VISION & POSITIONING

### The One-Liner
> **DOT is the operating system where African startups prove credibility, attract talent, and raise capital.**

### The Brand
**African Startup OS** — not a marketplace, not a tool, an *operating system*.

### The Standard We're Chasing
| Niche | Industry Leader | DOT Condensation |
|-------|-----------------|------------------|
| Talent Marketplace | Upwork ($3.5B GMV) | **DOT Work** — 1 page |
| Company Intelligence | Crunchbase ($100M+ ARR) | **Vantage** — 1 page |
| Capital Marketplace | AngelList ($2B+ deployed) | **Pitchathons + Shares + Demo** — 2 pages |
| Founder Program | Y Combinator (3% acceptance) | **Academy + Sessions + Certificates** — 2 pages |

**Each gets industrial depth, not a toy.** One page = one full workflow.

---

## 2. ARCHITECTURAL DECISION: OPTION B — MUTUAL REINFORCEMENT

### Why Not Option A (Single North Star)?
- African Startup OS brand *requires* all three pillars connected
- Builders can succeed without Vantage (jobs → courses → sessions)
- Founders can raise without posting gigs
- "OS" metaphor = shared primitives, not one app

### The Keystone Metric: Vantage Score (0-1000)
**Only number spanning all niches.** Founders earn tier via score. Builders unlock via score. Investors gate via score.

### Shared Primitives (The "OS" Layer)
| Primitive | Purpose | Status |
|-----------|---------|--------|
| **Identity** | One profile, all roles, reputation follows you | ✅ Partial |
| **Vantage Score** | Universal credibility — reads from ALL activity | ✅ Core algo |
| **DOT Wallet** | Single currency: earn, learn, stake, invest, govern | ⚠️ Needs hardening |
| **Notifications + Chat** | Universal comms layer | ✅ Basic |
| **Search/Discovery** | Cross-platform find: ventures, builders, investors, courses | ✅ `/search` + `/discover` |
| **Admin/Analytics** | Platform observability | ⚠️ Basic |

**Rule:** No niche page ships "deep" until primitives it depends on are hardened.

---

## 3. THE FOUR CONDENSED PLATFORMS

### 3.1 DOT WORK — Upwork Condensed
**Page:** `/work` (5 tabs: Overview, Applications, Contracts, Earnings, Profile)  
**Core Loop:** Investors/Founders post gigs → Builders complete → Earn DOT → Reputation → Better gigs  
**Industrial Standard:** Job feed, proposals, contracts, payments, reviews, earnings dashboard, tax docs

### 3.2 VANTAGE — Crunchbase Condensed
**Page:** `/vantage` + `/founder/:id`  
**Core Loop:** Structured assessment (6 categories, 21 questions) → Score 0-1000 → Benchmarks → Investor memo  
**Industrial Standard:** Company profile, financials, signals, comparables, investor memo, API

### 3.3 CAPITAL — AngelList Condensed
**Pages:** `/pitchathons` + `/demo` + `/investor`  
**Core Loop:** Seasonal live pitch events → Judges score → Top ventures get funded → Shares issued → Dividends  
**Industrial Standard:** Live pitch, Q&A, voting, commit, wire, cap table, deal room

### 3.4 ACADEMY — YC Condensed
**Pages:** `/academy` + `/sessions` + `/certificates`  
**Core Loop:** Whop-powered courses → Progress → Certificates → Vantage boost → Verified Builder tier  
**Industrial Standard:** Curriculum, office hours, cohort, cert, alumni network

---

## 4. DOT CURRENCY — THE ECONOMIC ARCHITECTURE

### 4.1 The Four Value Layers
| Layer | Mechanism | Demand Driver |
|-------|-----------|---------------|
| **Earn (Proof of Work)** | Complete gigs → paid in DOT | Real income |
| **Learn (Proof of Stake)** | Pay DOT for courses, sessions, certs | Career capital, Vantage boost |
| **Signal (Proof of Credibility)** | Stake DOT on ventures → Community Score weight | Social capital, allocation power |
| **Govern (Proof of Commitment)** | Stake DOT for tier access (Founder 2K, Investor 10K) | Gatekeeping, quality filter |

### 4.2 Supply Mechanics
- **Fixed Supply:** 1B DOT max (hard cap)
- **Emission Only Via Value Creation:** Gig completion, course finish, challenge win, Pitchathon placement
- **Burn Mechanisms:** Course fees, stake slashing, tier upgrade fees, transaction fees
- **Treasury:** Platform fees (1-2%) → buyback/burn or ecosystem grants

### 4.3 Pricing Anchor
| Anchor | Rate | Purpose |
|--------|------|---------|
| **Fiat Bridge** | 1 DOT = 15 NGN = $0.009 | Paystack → NGN → DOT |
| **Gig Minimum** | 500 DOT ($4.50) | Labor floor |
| **Course Pricing** | 500-5,000 DOT | Education market |
| **Founder Tier** | 2,000 DOT ($18) | Venture creation unlock |
| **Investor Tier** | 10,000 DOT ($90) | Deal flow unlock |
| **Stake Minimum** | 1,000 DOT ($9) | Skin in game |

### 4.4 Redemption Engine (The Only Bridge to Reality)
```
Phase 0 (Months 1-3): Earn-only, no cash-out. Build NGN reserves.
Phase 1 (Months 4-6): Capped redemptions (₦50K/week), 15 NGN/DOT fixed, 200% reserve ratio.
Phase 2 (Month 7+): Open redemptions, 300% reserve ratio, external market makers.
```
**Reserves funded by:** 2% gig fees, 2% share fees, Academy rev share, tier fees, Paystack fees.

---

## 5. THE COMPLETE REVENUE FLYWHEEL

### 5.1 Three Revenue Engines

#### Engine 1: Gig Marketplace (Layer 1 — Recurring, High Volume)
| Flow | Platform Cut |
|------|--------------|
| Gig posted (NGN → DOT) → Builder completes → Receives DOT | **2% of NGN value** |
| Builder withdraws DOT → NGN | **1.5% withdrawal fee** |

#### Engine 2: Capital Marketplace (Layer 2 — High Value, Lower Volume)
| Flow | Platform Cut |
|------|--------------|
| Investor buys shares | **2% transaction fee** |
| Secondary share trades | **2% fee** |
| Dividend distribution | **1% distribution fee** |

#### Engine 3: Informal Economy Bridge (Layer 3 — The Unlock)
| Flow | Platform Cut |
|------|--------------|
| Merchant marks up 2x, accepts 50% DOT | **1% on DOT portion** |
| Customer pays 500 NGN + 33 DOT (same effective price) | — |
| Merchant redeems DOT → NGN | **1.5% redemption fee** |

**Merchant Math:** Item costs 500 NGN → Lists at 1,000 NGN OR 500 NGN + 33 DOT → Customer pays 500 NGN + 33 DOT → Merchant redeems 33 DOT = 495 NGN → **Total 995 NGN on 500 NGN cost = 99% margin.**

### 5.2 The Shares Promotion Loop (Self-Paying Marketing)
```
Investor buys shares → Has financial interest → Promotes venture (shares, intros, gigs, stakes)
→ Venture grows → Share value ↑ → Investor wins → Platform fees ↑ → Reserves ↑ → DOT stronger
```

### 5.3 Complete Revenue Stack
| Layer | Revenue Stream | Scales With |
|-------|----------------|-------------|
| **1: Gig Fees** | 2% gig fee, 1.5% withdrawal | #gigs × avg size |
| **2: Capital Fees** | 2% share buy/sell, 1% dividends | Total capital deployed |
| **3: Ecosystem Fees** | 1.5% deposit, Academy rev share, tier fees, 1% informal DOT | Total activity |
| **4: Treasury Yield** | NGN reserves yield, DOT buyback | Reserve size |

**All fees paid in NGN → Reserves grow → Redemption guarantee strengthens → DOT trust ↑ → More activity → Flywheel.**

---

## 6. TIER-BY-TIER IMPLEMENTATION SEQUENCE

### TIER 0: HARDEN PRIMITIVES (Weeks 1-2) — *No niche work*
| Sprint | Task | Done When |
|--------|------|-----------|
| 1 | Vantage Sync Service — single `updateVantage(userId)` from all sources | Any niche calls `updateVantage`, score updates <5s |
| 1 | Wallet Multi-Ledger — `available`, `staked`, `locked`, `earned_lifetime`, `burned_lifetime` | All loops move DOT correctly |
| 1 | Staking Engine — `stakeDOT(userId, targetType, targetId, amount)`, `unstake()`, `slash()` | Capital loops + Work escrow functional |
| 1 | Escrow Engine — `escrow(gigId, amount)`, `release()`, `dispute()` | Gig payments secure |
| 1 | Tier Gates Middleware — `requireTier('builder'/'founder'/'investor')` | Premium routes protected |
| 1 | Price Oracle — `getDOTPrice(ngn)` → 15 NGN fixed | Consistent valuation |
| 1 | Emission/Burn Ledger — Every mint/burn auditable | Treasury transparency |
| 2 | Notifications v2 — Context threads (meeting, gig, pitch, cohort), push, email | Engagement layer |
| 2 | Identity Hardening — Role gates, verification badges (KYC, Vantage≥700, Verified Builder) | Trust signals |
| 2 | Search Unification — Single `/api/search` returns ventures, builders, investors, courses | Cross-platform discovery |
| 2 | Admin Analytics — Per-niche dashboards, cohort funnels | Observability |

### TIER 1: FOUNDER CORE (Weeks 3-5)
| Feature | Pages | Depends On |
|---------|-------|------------|
| Venture creation (video, deck, cover, team, status workflow) | `/onboarding`, `/founder/:id` | Identity, Vantage |
| Venture detail (problem, solution, traction, team, deck, video) | `/demo/:id` | Venture creation |
| Pitchathons: seasonal, live, YouTube embed, 3-4 judges, scoring | `/pitchathons`, `/pitchathons/:id` | Ventures, Vantage≥700 gate |
| Shares: buy/sell, dividends, cap table | `/demo/:id` (investor view) | Wallet staking/escrow |
| Founder dashboard: Community Score, ranks, comments, followers | `/founder/:id` | Ventures, Vantage, Comments |

### TIER 2: BUILDER CORE (Weeks 6-8)
| Feature | Pages | Depends On |
|---------|-------|------------|
| DOT Work: gigs, proposals, contracts, earnings, reputation | `/work` (5 tabs) | Identity, Wallet, Vantage |
| Academy: courses (Whop checkout), progress, certificates | `/academy`, `/academy/:id` | Wallet, Vantage sync |
| Sessions: live cohorts, calendar, attendance, certificates | `/sessions` | Academy, Notifications |
| Builder profile: headline, skills, hourly rate, portfolio, ratings | `/builder/:id` | DOT Work completions |
| Academy → Vantage: cert = +pts, cohort = +pts, badge unlock | `/academy` + `/vantage` | Vantage sync, Certificates |

### TIER 3: INVESTOR / CAPITAL CORE (Weeks 9-11)
| Feature | Pages | Depends On |
|---------|-------|------------|
| Investor dashboard: deal flow, portfolio, thesis, commitments | `/investor` | Ventures, Shares, Wallet |
| Demo: venture showcase, investor requests, meetings | `/demo`, `/meetings` | Ventures, Identity |
| Capital Partner: qualification, badge, event hosting | `/capital` | Admin, Pitchathons |
| Analytics: platform-wide + per-niche | `/admin/analytics` | All tiers |

### TIER 4: CROSS-CUTTING POLISH (Weeks 12-14)
Trending, Follow, Comments, Referrals, Mobile audit, Performance.

---

## 7. REINFORCEMENT LOOPS (Explicit Wiring)

| Loop | Trigger | Vantage Delta | Unlocks |
|------|---------|---------------|---------|
| Academy → Vantage | Complete course | +25-50 pts | Next tier courses, "Certified" badge |
| Academy → Vantage | Complete cohort (Sessions) | +75 pts | "Alumni" status, mentor access |
| DOT Work → Vantage | Complete gig (5★) | +10 pts | Verified Builder tier |
| DOT Work → Vantage | 10 completed contracts | +50 pts | "Pro Builder" badge |
| Vantage → DOT Work | Score ≥ 600 | — | Verified badge, better gigs |
| Vantage → Pitchathons | Score ≥ 700 | — | Auto-qualify |
| Pitchathon → Vantage | Top 10 placement | +100 pts | "Funded" badge, investor intros |
| Pitchathon → Wallet | Win investment | — | Shares issued, capital in wallet |
| Wallet → Vantage | Stake DOT on venture | +5 pts / 1K DOT | Signal conviction |
| Wallet → Capital | Buy shares | — | Investor tier, dividends |
| Community → All | Win challenge | +20 pts + DOT | Reputation across tiers |

---

## 8. ONBOARDING & TIER GATES (Professional, Upwork-Style)

### Tier Selector (First Screen)
```
"What brings you to DOT?"
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  I BUILD    │  I FOUND      │  I INVEST     │  I LEARN    │
│  (Builder)  │  (Founder)    │  (Investor)   │  (Academy)  │
│  Earn DOT   │  Raise Capital│  Deploy Capital│ Skills→Certs│
│  doing work │  for venture  │  in ventures  │ → Jobs      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Per-Tier Flow
| Tier | Steps | Gate |
|------|-------|------|
| **Builder** | Skills → Rate → Portfolio → **Stake 500 DOT for Verified** → First gig | 500 DOT stake |
| **Founder** | Venture basics → Problem/Solution → **Pay 2,000 DOT** → Venture creation | 2,000 DOT |
| **Investor** | Thesis → Check size → Sectors → **Stake 10,000 DOT** → Deal flow | 10,000 DOT stake |
| **Learner** | Interests → Level → **First course free (500 DOT grant)** → Whop checkout | 500 DOT grant |

### Starter Grants (Cold Start Solution)
| Grant | Amount | Trigger |
|-------|--------|---------|
| Welcome | 500 DOT | Signup + email verify |
| Referral | 500 DOT each | Referred user completes first gig/course |
| First Gig | 1,000 DOT | Complete first contract (5★) |
| First Cert | 500 DOT | Complete first Academy course |
| First Stake | 250 DOT | Stake on any venture |
| **Total earnable before $ spent: ~2,750 DOT (~$25)** | | |

---

## 9. WHOP INTEGRATION (Academy = Whop-Powered, DOT-Native)

| Layer | Whop Handles | DOT Handles |
|-------|--------------|-------------|
| Checkout | Card/NGN/Mobile money → Whop → webhook | Receives webhook, credits DOT at 15 NGN rate |
| Delivery | Video hosting, progress tracking, community | Reads progress via API, issues DOT certificates |
| Pricing | Creator sets $ price | Platform converts to DOT at 15 NGN rate |
| Refunds | Whop handles disputes | DOT clawed back on refund |
| Affiliates | Whop affiliate system | DOT referral bonuses (500 DOT each side) |

**Flow:** Learner pays $10 on Whop → Webhook → 1,111 DOT credited → Course starts → Complete → Certificate → Vantage +50 + Badge + 500 DOT bonus

---

## 10. REDESIGN REQUIREMENTS (Visual + UX)

### Design Principles
| Principle | Application |
|-----------|-------------|
| **Industrial Standard** | Every page feels like the category leader (Upwork, Crunchbase, AngelList, YC) |
| **Density with Clarity** | High information density, zero clutter. Tables, cards, grids over hero sections. |
| **Tier-Aware UI** | Free tier sees "Upgrade to unlock" inline. Premium sees full power. No dead ends. |
| **Real-Time Feel** | Vantage updates <5s, notifications instant, gig status live, wallet balance instant. |
| **Mobile-First, Desktop-Powerful** | Mobile = core workflows. Desktop = power tools (tables, multi-panel, keyboard shortcuts). |
| **Trust Signals Everywhere** | Verification badges, Vantage scores, completion rates, earnings proof, social proof. |

### Page-Level Redesign Targets

| Page | Current State | Target State |
|------|---------------|--------------|
| **`/work`** | Basic tabs, empty states | Upwork-level: job feed, filters, proposals, contracts, payments, tax docs |
| **`/vantage`** | Assessment + score | Crunchbase-level: profile, financials, signals, comparables, investor memo export |
| **`/pitchathons`** | Basic list | AngelList Demo Day: live stream, Q&A, voting, commit, wire, cap table |
| **`/academy`** | Basic catalog | YC-level: curriculum, office hours, cohort tracking, cert, alumni network |
| **`/founder/:id`** | Basic profile | Company intelligence page: traction, team, deck, video, raises, scores, comments |
| **`/demo/:id`** | Basic showcase | Data room: deal terms, cap table, share purchase, investor updates |
| **`/wallet`** | Basic balance | Multi-ledger: available/staked/locked, staking UI, redemption flow, transaction export |
| **`/leaderboard`** | DOT Work only | 7 tabs: ventures, founders, builders, communities, universities, states, countries |
| **`/admin`** | Basic | Per-niche dashboards, cohort funnels, revenue tracking, moderation tools |

### Component Library Upgrades Needed
- **Data Tables:** Sortable, filterable, paginated, exportable (tanstack table)
- **Charts:** Vantage history, earnings trends, share price, treasury (recharts)
- **Real-Time:** WebSocket for gig status, notifications, chat, live pitch
- **Forms:** Multi-step wizards (venture creation, onboarding, gig posting)
- **Media:** Video player (pitch videos), PDF viewer (decks), image gallery
- **Badges/Trust:** Verification, Vantage tier, completion rates, earnings proof

---

## 10. OPEN QUESTIONS & EXPANSION OPPORTUNITIES

### 10.1 Clarification Needed Before Tier 0

| Question | Options | Recommendation |
|----------|---------|----------------|
| **DOT Supply Cap?** | 1B fixed vs dynamic | Fixed 1B — scarcity narrative |
| **Reserve Currency?** | NGN only vs NGN + USD stablecoin | NGN first, USDC later for int'l |
| **KYC Requirement?** | Tier-gated (Founder/Investor only) vs all | Tier-gated: Builder=light, Founder/Investor=full |
| **Dispute Resolution?** | Platform arbitrates vs community jury | Platform first, jury for high-value (>₦500K) |
| **Whop Revenue Split?** | Standard 90/10 vs negotiated | Standard 90/10, platform takes 5% of creator revenue |

### 10.2 Expansion Opportunities (Post-MVP)

| Opportunity | Description | Effort |
|-------------|-------------|--------|
| **DOT Visa/Debit Card** | Spend DOT anywhere via virtual card (Flutterwave/Paystack partnership) | Medium |
| **DOT Savings/Yield** | Stake DOT → earn platform yield (from treasury) | Low |
| **DAO Governance** | DOT holders vote on platform params (fees, tiers, grants) | Medium |
| **Cross-Border Payments** | DOT as settlement rail for Africa-global freelance | High |
| **Institutional API** | Vantage scores via API for banks, VCs, govt | Medium |
| **White-Label DOT Work** | Universities/communities run own gig boards on DOT infra | High |
| **DOT Insurance** | Gig completion insurance, payment protection | Medium |

### 10.3 Technical Debt to Address

| Area | Issue | Fix |
|------|-------|-----|
| **Vantage Sync** | Multiple sources, stale data | Single `updateVantage` service, event-driven |
| **Wallet** | Single balance, no staking/escrow | Multi-ledger, explicit lock/unlock |
| **Notifications** | Basic, no threads | Context threads, push, email, in-app |
| **Search** | Fragmented | Unified index, saved searches, alerts |
| **Mobile** | Not audited | Full responsive audit, PWA |
| **Performance** | Unmeasured | <2s load, <100ms interactions, RUM |

---

## 11. DECISION LOG (Immutable)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-07-04 | Option B (Mutual Reinforcement) | African Startup OS brand requires all three pillars connected |
| 2025-07-04 | Vantage = Keystone Metric | Only number spanning all niches; founders earn tier via score |
| 2025-07-04 | Tier 0 before Tier 1 | Loops can't work without solid primitives |
| 2025-07-04 | Venture Creation first (Tier 1) | Core object referenced by Work, Pitch, Academy, Investor |
| 2025-07-04 | DOT = Revenue-Backed Redemption | No reserves = no value. NGN fees fund reserves. |
| 2025-07-04 | Informal Economy Bridge | Merchant markup model unlocks mass adoption |
| 2025-07-04 | Shares = Self-Paying Marketing | Investors promote because they own equity |

---

## 12. IMMEDIATE NEXT STEPS (This Week)

### Sprint 1: Tier 0 Hardening
```
Day 1-2: Vantage Sync Service + Wallet Multi-Ledger
Day 3-4: Staking Engine + Escrow Engine
Day 5: Tier Gates Middleware + Price Oracle + Emission Ledger
Day 6-7: Notifications v2 + Identity Hardening + Search Unification + Admin Analytics
```

### Sprint 2: Tier 1 Foundation (Week 2)
```
Venture Creation (full spec: video, deck, cover, team, status workflow)
Venture Detail Page (problem, solution, traction, team, deck, video)
Pitchathons Infrastructure (seasonal, live, YouTube, judges, scoring)
```

### Definition of Done for Tier 0
- [ ] `updateVantage(userId)` called from Academy, Work, Pitchathon, Stake, Challenge → score updates <5s
- [ ] Wallet shows `available` / `staked` / `locked` / `earned_lifetime` correctly
- [ ] `stakeDOT(userId, 'venture', ventureId, amount)` works end-to-end
- [ ] Gig escrow: post → fund → complete → release → dispute flow works
- [ ] `requireTier('founder')` blocks non-founders from `/onboarding`
- [ ] Reserve ledger endpoint returns `{ngn_reserves, dot_circulating, coverage_ratio}`
- [ ] Notifications: context threads, push, email, in-app bell all work
- [ ] Search returns ventures + builders + investors + courses in single call

---

## 13. FILES TO CREATE / UPDATE

### New Files
- `VENTURE_PARTNER_AUDIT.md` — ✅ Created
- `DOT_OS_MASTER_SPEC.md` — This file
- `docs/architecture/primitives.md` — Shared primitives deep dive
- `docs/economy/dot_currency.md` — DOT mechanics
- `docs/economy/revenue_flywheel.md` — Revenue engines
- `docs/design/system.md` — Design system spec
- `docs/implementation/tier0.md` — Sprint plans

### Existing Files to Update
- `src/lib/constants.ts` — Add `venture_partner` role, tier gates config
- `src/hooks/use-dot-data.ts` — Wallet multi-ledger, staking hooks
- `src/api/wallet.ts` — Staking, escrow, redemption endpoints
- `src/routes/_authenticated/work.tsx` — Industrial Upwork UI
- `src/routes/_authenticated/vantage.tsx` — Crunchbase-level UI
- `src/routes/_authenticated/academy.tsx` — YC-level UI
- `src/routes/_authenticated/pitchathons.tsx` — AngelList Demo Day UI
- `dotlive-backend/apps/api/src/routes/vantage.ts` — Sync service
- `dotlive-backend/apps/api/src/routes/wallet.ts` — Multi-ledger, staking
- `dotlive-backend/apps/api/src/routes/gigs.ts` — Escrow, fees
- `dotlive-backend/apps/api/src/routes/investor.ts` — Shares, capital

---

## 14. SUCCESS METRICS (North Stars)

| Metric | Target (Month 6) | Target (Month 12) |
|--------|------------------|-------------------|
| **Monthly Active Builders** | 1,000 | 10,000 |
| **Monthly Active Founders** | 200 | 1,000 |
| **Monthly Active Investors** | 50 | 200 |
| **Gigs Completed/Month** | 500 | 5,000 |
| **Vantage Assessments/Month** | 300 | 2,000 |
| **Capital Deployed (NGN)** | ₦50M | ₦500M |
| **DOT Velocity (txns/day)** | 1,000 | 20,000 |
| **Reserve Coverage Ratio** | 200% | 300% |
| **Redemption Success Rate** | 100% (capped) | 100% (open) |
| **Platform NGN Revenue/Month** | ₦2M | ₦20M |

---

**This document is the single source of truth.** Every architectural decision updates this file. Every sprint plans against this file. Every code review checks against this file.

**Last Updated:** 2025-07-04  
**Next Review:** Sprint 1 retrospective