# DOT OS — Rearchitecture Proposal

> **Why this doc exists:** the user is no longer a "client" giving tickets. They
> are the engineer who'll be blamed if the platform collapses. They've said the
> app "looks too alike" and "something is wrong with dot." This doc is my best
> read of what they're saying, with proposed changes. They review and approve
> before I code.

**Date:** 2026-06-28
**Status:** AWAITING USER REVIEW — do not code until approved

---

## The 11 problems (numbered per their last message)

1. **Vantage is a generic quiz** — looks like Instagram polls ("medium / medium")
2. **"Support this founder" button is duplicated** — appears on community page AND discover
3. **"Support this founder" with no information** — can't invest in a business you don't understand
4. **No share/dividend model** — "support" should mean buying shares → earn dividends
5. **No loan panel** — founders should submit to a capital panel for review + monthly feedback
6. **Builder Arena badges not clickable** — "Reach Level 2 · tasks" is static
7. **"Get started" + "Login" showing in authenticated header** — public chrome leaking
8. **No back button in communities** — can't escape
9. **Communities should be company/startup groups** — builders can't start them
10. **DOT Demo "Meet" does nothing** — needs private chat (follow → accept → DM)
11. **DOT Work job creation is invisible** — user doesn't see how to post

Plus the meta-critique:
> **"the app looks too alike ... something is wrong with dot"**

---

## Root cause (my read)

DOT was designed as a **single-shell app** with routes. Every page inherits
the same chrome: sidebar → header → cards. The user perceives this as
"alike" because there's no per-role differentiation, no per-product
branding, and no clear model behind each interaction.

The current model is "list + card + button". That's fine for a directory.
It collapses for: assessment, investing, communities-as-groups, hiring,
lending, demo-day-meet, and jobs.

The architecture is wrong because **we built a brochure site, not a
multi-product OS**. The fix is not more polish — it's a structural rebuild
around **5 distinct role experiences**, each with its own chrome.

---

## Proposed rearchitecture

### A) Five role experiences (replace the single sidebar)

Today: every user sees the same sidebar with all sections.

After: each role lands on their **role-specific home**, with role-scoped nav,
role-themed accents, role-relevant metrics. Switching role = switching app.

| Role | Home route | Sidebar items | Accent |
|---|---|---|---|
| **Founder** | `/founder/home` | My venture, Vantage, Capital, Investors, Hire builders, Demo Day, Community | Violet |
| **Investor** | `/investor/home` | My portfolio, Dividends, Discover, Loan panel, Voting, Watchlist | Amber |
| **Builder** | `/builder` (already) | Gigs, Reputation, Level, Earnings, Skills, Community | Emerald |
| **Community leader** | `/community/admin` | Members, Channels, Posts, Sponsors, Events | Sky |
| **Capital partner** | `/capital/partner` | Loan queue, Due diligence, Returns, Reports | Rose |
| **Judge** | `/capital/judge` | Pitch queue, Rubrics, Scores | Indigo |
| **Admin** | `/admin` (already) | Members, Wallets, Tokens, Roles | Slate |

The existing sidebar is renamed to **Workspace** and becomes one of these —
or lives as the cross-role activity surface for everyone. Implement the
overlap clearly: a builder can post a gig AND see their venture's Vantage
score AND join a community. But their **home**, their **default chrome**, is
their role.

### B) Founder profile replaces "venture cards"

Today: `/founder/wild-horizon-...` shows name, badges, "Support this founder" button.

After: a founder's public profile IS their venture. It must answer the
questions an investor needs:

| Field | Example | Source |
|---|---|---|
| Logo | `DU` square | user.uploaded or generated |
| Venture name | "MarketX" | ventures table |
| One-liner | "B2B wholesale marketplace for African SMEs" | ventures.tagline |
| Stage | Scale | ventures.stage |
| Category | Commerce | ventures.industry |
| HQ | South Africa | ventures.location |
| Founded | 2024 | ventures.foundedYear |
| Headcount | 12 | ventures.headcount |
| ARR | ₦48M / yr | ventures.annualRevenue |
| Funding to date | ₦120M | ventures.totalRaised |
| Vantage Point | 920 / 1000 | vantage latest |
| Fundability | 85% | vantage latest |
| Shares outstanding | 1,000,000 | ventures.sharesOutstanding |
| Share price | ₦150 | ventures.sharePrice |
| Dividend last paid | 2.3% / quarter | ventures.dividendYtd |
| Loan status | None / Active / Repaid | loan_applications |
| Community | "DU Builders" | ventures.communityId |

This profile is the **investor's pre-investment checklist**. Without it,
"Support this founder" is meaningless.

### C) "Support" → Buy shares (with real flow)

Replace the static "Support this founder" button with a **Buy Shares** modal:

1. Click **Buy Shares** on founder profile
2. Modal shows:
   - Available shares (e.g. 47,200 of 1,000,000 outstanding)
   - Current share price (₦150)
   - Minimum purchase (1 share)
   - Maximum purchase (10% of outstanding)
   - Projected dividend (if founder reaches forecast)
   - Risk disclosures
3. User enters shares → preview cost in DOT
4. User confirms → backend locks DOT in escrow → shares issued to user
5. New row in `share_holdings` table: `{investorId, ventureId, shares, acquiredAt, pricePaid}`
6. Monthly dividend distribution job → updates all holders' balances
7. User sees their holdings in `/investor/portfolio`

Schema additions:
```sql
CREATE TABLE ventures (
  id UUID PRIMARY KEY,
  founder_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  tagline TEXT,
  industry TEXT,
  location TEXT,
  founded_year INT,
  headcount INT,
  annual_revenue BIGINT, -- in kobo (smallest unit)
  total_raised BIGINT,
  shares_outstanding BIGINT NOT NULL DEFAULT 1000000,
  share_price BIGINT NOT NULL DEFAULT 100, -- in kobo
  dividend_ytd REAL DEFAULT 0,
  stage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE share_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id TEXT REFERENCES users(id),
  venture_id UUID REFERENCES ventures(id),
  shares BIGINT NOT NULL,
  price_paid BIGINT NOT NULL,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(investor_id, venture_id)
);

CREATE TABLE dividend_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES ventures(id),
  period TEXT, -- '2026-Q3'
  total_amount BIGINT NOT NULL, -- in kobo
  per_share BIGINT NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES ventures(id),
  amount BIGINT NOT NULL,
  purpose TEXT NOT NULL,
  monthly_revenue_proof TEXT, -- screenshot URL
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending | approved | rejected | disbursed
  monthly_feedback JSONB DEFAULT '[]', -- [{month, revenue, paid_amount}]
  decision_notes TEXT
);
```

### D) Loan panel (capital partner view)

`/capital/partner` shows:
- Loan queue (sorted by submission date)
- Per loan: venture, amount, monthly revenue, purpose, founder's history
- Approve / Reject / Request more info
- Once approved: monthly feedback form (founder submits revenue → partner reviews)

`/capital/partner/loan/:id` shows full detail:
- Venture profile
- Loan amount + terms
- Monthly repayment table (founder uploads proof each month)
- Capital partner's notes
- Approval chain (which partners approved)

### E) Communities = company/startup groups (Discord model already done)

Today: anyone can create a community. `/community/communities` is just a list.

After:
- **Only founders + community_leader role** can create communities
- **Builders can ONLY join**, never create
- Community creation requires: venture name, logo, description, category
- Communities are always scoped to **one venture or company** — no general-purpose "lounge"
- Channel structure: #announcements (admin-only), #general, #help, #jobs (auto), #events
- Builders in a community see: venture roadmap, hiring posts, product updates
- Admins see: member management, sponsorship tools, posts analytics

Required schema already exists (`community_channels`, `community_posts`).

Frontend change: `/community/create` form gets a "This community belongs to which venture?" step. If user has no venture, they can't create.

### F) Vantage rebuilt as a real business assessment

Today: generic "team / market / revenue / product" sliders with no detail.

After: **20 specific business questions** that founders would ask themselves.
Each question is binary or scored 0-4, mapped to a category. Final score is
weighted: business fundamentals (40%), traction (30%), team (20%), vision (10%).

Example questions:

**Business fundamentals (10 questions)**
1. Have you incorporated a legal entity? (Y/N)
2. Do you have a registered bank account under the company name? (Y/N)
3. Have you filed any tax/regulatory paperwork? (Y/N)
4. Do you have a written business plan? (Y/N)
5. Have you signed any customer LOIs or paid POCs? (0/1-5/5+/10+)
6. Do you have a written monthly financial forecast? (Y/N)
7. Have you raised any external capital? (None/Pre-seed/Seed/Series A+)
8. Do you have IP filed (trademark, patent)? (None/Provisional/Granted)
9. Are your founders full-time? (One/All part-time/All full-time)
10. Do you have a co-founder? (Solo/Co-founder 1/Co-founder 2+)

**Traction (5 questions)**
11. How many paying customers in the last 90 days? (0/1-10/11-50/51-200/200+)
12. What is your monthly recurring revenue? (None/₦100k/₦1M/₦10M/₦100M+)
13. Month-over-month growth rate over last 6 months? (Decline/Flat/<10%/10-30%/30%+)
14. Customer retention rate (90-day)? (<40%/40-60%/60-80%/80-95%/95%+)
15. Have you turned a profit for any month? (Y/N)

**Team (3 questions)**
16. Total team headcount? (1/2-3/4-7/8-15/15+)
17. Does your team have prior startup experience? (Y/N/All founders have exits)
18. Do you have an advisory board? (None/1-2 advisors/3+ advisors/Formal board)

**Vision (2 questions)**
19. Have you published a 12-month roadmap? (Y/N)
20. Have you documented your exit or liquidity path? (Y/N)

Scoring:
- Y/N → 1/0
- 5-option → 0/0.25/0.5/0.75/1
- Weighted per category
- Total 0-1000

Result page shows:
- Score breakdown by category
- Gap analysis ("Add at least 1 paying customer to improve Traction by 25 pts")
- Comparison to peer stage (Idea vs MVP vs Scale)
- Recommended actions
- Re-take button (capped at 1/week)

### G) DOT Demo "Meet" → private chat (follow request flow)

Today: clicking "Meet" does nothing.

After:
1. Click **Meet** on a Demo Day venture
2. If not logged in: redirect to /auth
3. If logged in: modal asks "Send a follow request to {{founder name}}?"
4. Founder receives notification + email
5. Founder accepts or declines in `/inbox/follow-requests`
6. If accepted: private chat thread created
7. Both see each other in `/messages` with chat history

Required schema:
```sql
CREATE TABLE follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT REFERENCES users(id),
  recipient_id TEXT REFERENCES users(id),
  venture_id UUID REFERENCES ventures(id),
  message TEXT,
  status TEXT DEFAULT 'pending', -- pending | accepted | declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_id TEXT REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a TEXT REFERENCES users(id),
  participant_b TEXT REFERENCES users(id),
  venture_id UUID REFERENCES ventures(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);
```

### H) DOT Work job creation made visible

Today: `/work` has tabs (Gigs/Jobs/Orders/Sell). The "Sell" tab lets you post a service. But **there's no obvious button to post a job**.

After:
- `/work` hero has two prominent CTAs:
  - **Post a job** (orange) — for founders hiring
  - **Post a service** (emerald) — for builders offering
- A persistent "Post" FAB on mobile (bottom-right)
- `/work/jobs/new` flow:
  1. Step 1: Title, category, description
  2. Step 2: Budget range (min/max DOT), duration, deadline
  3. Step 3: Required skills
  4. Step 4: Fund escrow (DOT) — locks money until work delivered
  5. Step 5: Publish

### I) "Get started" / "Login" leaking into authenticated header

Bug fix: the public marketing header (`/components/site/PublicHeader.tsx`) is
showing on community page because the route uses `<AppShell>` which has its
own header. Need to remove the public header from `_authenticated` routes
and only show on `_public` routes.

### J) No back button in communities

Bug fix: every authenticated page should have a "← Back" link when there's
a referrer or when nested under a parent. Use TanStack Router's
`useRouterState()` to show the back link only when there's history.

### K) Builder Arena badges not clickable

Today: "Reach Level 2 · tasks" is a static badge.

After: clicking it opens a modal showing **each requirement** with progress:
- ✓ "Add a headline and 3+ skills" → progress 1/3
- ○ "Earn 100 reputation" → progress 0/100
- ○ "Complete 5 tasks with 4+ rating" → progress 0/5

Each requirement links to the action that satisfies it.

---

## What I'd build first (priority order)

If approved, I'd build in this order. Each step is a shipping unit:

1. **Founder schema + profile rebuild** (B)
   - Add `ventures` table + migration
   - Rewrite `/founder/$id` to show real fields
   - Auto-create a venture row when user takes founder role

2. **Shares + buy flow** (C)
   - Add `share_holdings` + `dividend_payments` + `ventures`
   - Rewrite "Support this founder" → "Buy Shares"
   - Modal with purchase flow + DOT escrow
   - Investor portfolio view

3. **Role-specific homes + sidebar** (A)
   - Add `roleHome` config
   - Render `<RoleNav>` instead of single sidebar
   - Per-role accent colors

4. **Vantage rebuild** (F)
   - New 20-question assessment
   - Weighted scoring
   - Gap analysis result page

5. **Communities restricted to ventures** (E)
   - Add `ventureId` to communities
   - Gate community creation on venture ownership
   - Builder role loses "Create community" button

6. **DOT Demo private chat** (G)
   - Add `follow_requests` + `message_threads` + `direct_messages`
   - Modal flow on "Meet" click
   - `/messages` inbox

7. **DOT Work post-a-job flow** (H)
   - Hero CTAs
   - 5-step job creation wizard
   - DOT escrow integration

8. **Loan panel** (D)
   - `loan_applications` table
   - Founder: submit application
   - Capital partner: review queue
   - Monthly feedback loop

9. **Chrome fixes** (I, J, K)
   - Remove public header from authenticated routes
   - Add back buttons
   - Make Builder Arena badges interactive

---

## What I'd NOT do

- ❌ Rebuild the wizard — it works
- ❌ Rebuild notifications — they work
- ❌ Rebuild certificate system — they work
- ❌ Rebuild community channels — they work
- ❌ Rebuild admin — it works

These are working. The user-facing polish on /builder, /work, /discover,
/profile is already substantial. They don't need a rewrite — they need
the **economic model** (shares, dividends, loans, assessments, chat)
behind them to be real.

---

## Open questions for the user

Before I start coding, I need 3 answers:

1. **Share price unit** — DOT or kobo? (My recommendation: kobo = smallest unit, 1 DOT = 15,000 kobo at current rate. Shares priced in kobo.)

2. **Dividend frequency** — quarterly (4x/yr), semi-annual (2x/yr), or annual? (My recommendation: quarterly, paid from venture's actual revenue, not a synthetic payout.)

3. **Loan panel scope** — only capital partners can approve, OR also community leaders for their community's ventures? (My recommendation: only capital partners. Keeps the role clean.)

---

## My promise

Once you approve this plan, I'll execute the 9 steps in order. Each step is
a real shipping unit — pushed, tested in browser, verified working — before
I move to the next. I'll commit at every step so you can roll back any
single one.

No more "fix this and ship" in isolation. The platform gets rebuilt around
the economic model first, then the chrome fixes last.

**Awaiting your sign-off before I start.**
