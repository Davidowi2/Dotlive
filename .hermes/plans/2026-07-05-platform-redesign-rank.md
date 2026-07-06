# DOT Platform Redesign — Ranked Build Plan

> **Status:** 2026-07-05 — in progress, audit underway
> **Source:** Conversations with the user, `.hermes/plans/2026-06-28_113500-dot-rearchitecture.md`, `.hermes/plans/2026-06-28_120000-dot-os-july-launch.md`, live-site walkthrough as `browserverify@test.com`.
> **Method:** Rank, don't cut. Every item stays on the list. Dependencies dictate the order.

---

## Locked product definition

> DOT is the operating system where African startups prove credibility, attract talent, and raise capital.

**Three pillars, mutually reinforcing:**
- **Credibility** → Vantage (0–1000, the soul of the platform)
- **Talent** → Work + Builder Arena
- **Capital** → Buy Shares + Loan Panel + Stakes (as conviction)

**Shared primitives:** Identity, Vantage, Wallet, Notifications, Vouch, Search, Admin. Built once, reused everywhere.

**Locked math:**
- 1 DOT = ₦15 (immutable in V1, no kobo anywhere, no live FX)
- Staking: 12% APY, 14-day cooldown, manual claim, no slashing
- Vantage weight: capped at 200, with scope multiplier (founder 1.0, builder 0.8, capital 0.6)
- Vantage signal decay: 1% per 30 days of inactivity
- Loan interest: 2% monthly on outstanding principal (24% APR), 3/6/12-month terms
- Loan voting: plurality of assigned capital partners, 60% quorum required
- Share price: stored as Naira, displayed as DOT
- Dividends: quarterly, paid by the venture in DOT equivalent
- Wallet multi-ledger: available / staked / locked / earned_lifetime / burned_lifetime / staked_lifetime / redeemed_lifetime
- Venture online net worth = wallet.available + wallet.staked + wallet.locked + sum(milestoneEscrowRemaining) + sum(activeStakes × currentDotValue)

---

## Audit findings — live site walkthrough (2026-07-05)

Issues discovered on first-pass of `/dashboard` as authenticated user `browserverify@test.com`. Numbered for reference in the build order.

### DASHBOARD (`/dashboard`)

| # | Issue | Severity |
|---|-------|----------|
| D-01 | Wallet hero card: "CAPITAL" label has no value beside it — label/value split bug | High |
| D-02 | Vantage hero card: "GROWTH" label has no value — same label/value split | High |
| D-03 | Vantage progress shows 0 / 70 / 1000 — three different numbers, none match the 700/1000 score | High |
| D-04 | Sidebar duplicates "Meetings" — appears under WORKSPACE and CAPITAL | Medium |
| D-05 | "OPERATOR" role slug leaks into the top user card and the sidebar | High |
| D-06 | "Update Vantage" CTA shown to a user who already has a 700 score — copy is wrong | Medium |
| D-07 | "What To Do Next" suggests "Take Vantage" but user already has a score — stale copy | Medium |
| D-08 | Watchlist shows 4 ventures — need to verify if real or seeded | Low |
| D-09 | Snapshot cards show "0 courses done", "0 memberships yet" — no next action, the "₦0 that lies" pattern | High |
| D-10 | Notifications list shows 5 cards but bell badge says "3" — counter mismatch | Medium |
| D-11 | "Capital Partner" appears in sidebar for a user with role "Founder" — role-based nav is wrong | High |
| D-12 | Stakes (the conviction signal) is invisible on the dashboard — big miss | High |
| D-13 | Fundability line: "0% ready to raise" while Vantage is 700 — broken state | High |

### To audit (not yet visited)
- `/wallet` — Stakes tab, Escrow tab
- `/stakes` — already built last session
- `/ventures` — milestones, team, advisors, escrow tabs
- `/vantage` — assessment, history, score
- `/discover`, `/search`, `/meetings`, `/notifications`, `/portfolio`, `/referrals`, `/leaderboard`, `/work`, `/academy`, `/sessions`, `/pitchathons`, `/profile`, `/settings`, `/help`, `/kyc`, `/investor`, `/capital`, `/demo`, `/community`

---

## Ranked build order

Each item is a shipping unit. When a unit touches >1 file, the dependency dictates the order. **No commit until the build is green and the page is walked in a real browser.**

### P0 — Discipline layer (no excuses, ship first)
- **0.1** Audit the rest of the authenticated app (every page, every tab, every CTA). Output: append to the audit table above.
- **0.2** Fix the AppShell role-aware nav — 5 roles, 5 homes, 5 accents. Removes OPERATOR slug, hides Capital Partner for non-capital users, dedupes Meetings. **(Fixes D-04, D-05, D-11)**
- **0.3** Build `<PageIntent>` component — one line at the top of every page stating what the page is for. **(Fixes D-07 in pattern form)**
- **0.4** Build the empty-state rulebook — three states only (first-time, no-data, error). Apply across all pages. **(Fixes D-09 in pattern form)**
- **0.5** Fix the label/value split bugs on the dashboard hero cards. **(Fixes D-01, D-02, D-03, D-13)**

### P1 — Shared stake/escrow widgets (the split-brain fix)
- **1.1** Build a single `<StakeSummaryCard>` component that reads from one source. Used in `/stakes`, `/wallet` Stakes tab, `/dashboard` hero.
- **1.2** Build a single `<EscrowSummaryCard>` component. Used in `/wallet` Escrow tab, `/ventures` Escrow tab.
- **1.3** Add the missing `/wallet` Stakes tab and Escrow tab wired to the new widgets.
- **1.4** Add the missing `/ventures` Milestones / Team / Advisors / Escrow tabs, all reading from real data.
- **1.5** Add a `<StakesWidget>` to the `/dashboard` hero. **(Fixes D-12)**

### P2 — Vouch primitive (smallest feature with biggest soul impact)
- **2.1** DB: `vouches` table (`id, voucherId, voucheeId, scope, message, weight, expiresAt, revokedAt, createdAt`).
- **2.2** Endpoint: `POST /api/vouches` (create), `DELETE /api/vouches/:id` (revoke), `GET /api/users/:id/vouches` (list given + received).
- **2.3** UI: "Vouch for [name]" button on every profile. Vouch list section on profile pages. Revoke button on own vouches.
- **2.4** Vantage engine reads vouches as one of 9 signals, weighted 10%, with weight = `min(voucherVantage, 200) × scopeMultiplier`.

### P3 — Notifications as an OS
- **3.1** Bell + dedicated `/notifications` inbox with 3 tabs (Received / Sent / Activity).
- **3.2** Event emitters: stake created, reward claimed, loan status changed, share issued, dividend paid, vouch received, follow request, community post, meeting request.
- **3.3** Per-category mute in `/settings`.
- **3.4** Email for high-stakes events only: loan, dividend, share, follow request. In-app for the rest.
- **3.5** 90-day archive. **(Fixes D-10)**

### P4 — Buy Shares flow (replaces "Support this founder")
- **4.1** DB: `share_holdings`, `dividend_payments` tables.
- **4.2** Founder profile shows: shares outstanding, current share price (₦ + DOT), dividend last paid, holders count.
- **4.3** "Buy Shares" modal on founder profile and venture profile: available shares, current price, min/max, projected dividend, risk disclosure.
- **4.4** On confirm: DOT debited, locked in venture escrow, shares issued to investor.
- **4.5** `/investor/portfolio` shows: holdings per venture, shares, price paid, current value, last dividend.
- **4.6** Quarterly dividend distribution: founder triggers, per-share rate set, total debited from venture escrow, pro-rata credited to holders.
- **4.7** Share price update flow (admin or venture admin), price history chart on profile.

### P5 — Loan panel (plurality voting, with the road)
- **5.1** DB: `loan_applications`, `loan_votes`, `loan_milestones`, `loan_repayments` tables.
- **5.2** Founder: `/capital/apply` form (amount, purpose, use of funds, monthly revenue proof, term, rate).
- **5.3** Founder: `/capital/apply/$id` shows real-time vote timeline (who voted what, when, with note).
- **5.4** Capital partner: `/capital/queue` with filter/sort.
- **5.5** Vote action: approve / reject / request-more-info. Plurality wins with 60% quorum. 7-day auto-escalation if quorum not met.
- **5.6** On approval: partners commit DOT shares = vote weight / total weight. 90% coverage threshold for "funded." 14-day partial-acceptance window.
- **5.7** Milestone-gated release: founder's use-of-funds becomes milestones, capital partners can hold release with a vote.
- **5.8** Monthly repayment: auto-debit from escrow on 1st of month. 7-day grace, 30-day default triggers partner review.
- **5.9** Loan closeout: "Loan repaid" badge on venture profile, small Vantage bump to both founder and partners.

### P6 — Discord-style communities (scoped to ventures)
- **6.1** DB: `community_channels`, `community_posts` (already in plan, verify).
- **6.2** Community creation gated on venture ownership.
- **6.3** 3-column layout: channels | posts | members.
- **6.4** Admin/owner posts get pinned indicator.
- **6.5** Builders can only join, not create.

### P7 — Vantage rebuild (20 real business questions)
- **7.1** Rewrite question bank: 10 business fundamentals, 5 traction, 3 team, 2 vision.
- **7.2** Weighted scoring: fundamentals 40%, traction 30%, team 20%, vision 10%.
- **7.3** Result page: score breakdown by category, gap analysis, peer-stage comparison, recommended actions.
- **7.4** Re-take cap: 1/week.

### P8 — Demo Day "Meet" → follow request → private chat
- **8.1** DB: `follow_requests`, `message_threads`, `direct_messages`.
- **8.2** "Meet" button on Demo Day ventures → modal → follow request.
- **8.3** Founder accepts/declines in `/inbox/follow-requests`.
- **8.4** On accept: private chat thread created, both see it in `/messages`.
- **8.5** Meetings = Messaging: one surface, 3 tabs (Received / Sent / Conversations). Accept → inline chat.

### P9 — /work Post-a-job + Post-a-service
- **9.1** Hero CTAs: "Post a job" (founders) + "Post a service" (builders).
- **9.2** `/work/jobs/new` 5-step wizard with escrow funding.
- **9.3** Persistent "Post" FAB on mobile.
- **9.4** Connect to existing marketplace endpoints.

---

## Cross-cutting concerns

These get applied continuously, not at the end:

1. **No kobo anywhere.** Search-and-replace the codebase. Add a server-side guard on the `*Kobo` columns to reject values. Display layer always rounds to Naira.
2. **No fabricated numbers.** Every number the user sees comes from a real query. If unknown, show "—" with a one-line reason. Never a "₦0.00" that lies.
3. **No spinner that lingers.** If the data is in flight, show the last good value with a tiny "updated 12s ago" line. If no last good value, show the appropriate empty state, not a skeleton.
4. **One question per page.** Every page has a `<PageIntent>` line. If a page can't be described in one question, it's two pages.
5. **3-click rule.** Any action reachable in 3 clicks max from the user's home.
6. **Naira first, DOT second.** Money values display as `₦7,500 (500 DOT)`. The number that pays rent leads.

---

## Verification protocol

Every shipping unit must:
1. `npm run build` exits 0
2. Real browser walk-through as `browserverify@test.com` confirms the page renders, the data is real, the CTAs work
3. One commit per unit, clean history on main (Lovable-connected, no force push)
4. Audit table updated with the issues fixed

---

## Out of scope (per locked user decisions)

- Multi-language (English only)
- Live streaming for Demo Day (countdown + registration only)
- Mentorship module
- Generic campaign engine (config-as-data, refactor when needed)
- Mobile app (web-responsive only)
- Public "share" landing pages beyond what exists
- KYC partner integration (Smile ID / QoreID) — store data, manual review, integrate later
- Live FX (1 DOT = ₦15 is fixed in V1)
- Secondary share market (peer-to-peer transfer only in V1)
- Compounding staking rewards (manual claim, no auto-compound in V1)
