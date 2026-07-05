# Frontend Page Contract — DOT Redesign
**Status:** Engineering-ready brief.  
**Guardrails:** Vantage is king, 3 pillars (Credibility/Talent/Capital), one question per page, whitespace > noise, trust signals everywhere.

---

## 1. Shell
**File:** `src/components/app/AppShell.tsx`  
**Status:** 327 lines, already sectioned sidebar + bottom nav + mobile sheet.  
**Contract:** Keep section groups exactly: Main / Growth / Community / Capital / Admin. Add Stakes under Growth. Do not reorder. Keep mobile bottom nav to 4 tabs + More sheet.

---

## 2. Dashboard
**File:** `src/routes/_authenticated/dashboard.tsx`  
**Status:** 939 lines, two-hero Wallet + Vantage rail.  
**Contract:**
- Hero remains exactly two columns: Wallet (left, gold) and Vantage (right, primary).
- Journey rail shows only first 5 stages; max width 5; do not add stage 6+ inline.
- Stat cards max 4; order fixed: Vantage, Fundability, Academy, Wallet/Activity.
- Add “Stakes” as fifth stat only if user has an active stake; otherwise hide.
- Data sources: `api/wallet`, `api/vantage` via `use-dot-data.ts` hooks. No new queries.

---

## 3. Vantage
**File:** `src/routes/_authenticated/vantage.tsx`  
**Status:** 1193 lines, flat question list.  
**Contract:**
- One question per page. Show exact `idx + 1 / TOTAL_QUESTIONS`. Disable Next until answered.
- Auto-advance only for likert + select. Text inputs require explicit Next.
- Results screen shows: score, fundability, top-3 strengths, top-3 weaknesses, top-6 next actions.
- Do not show category breakdown cards here; that belongs in the profile view.
- On submit, call `submitAssessment` then `qc.invalidateQueries(['assessments'])`.
- Emit `vantage.updated` event for realtime subscribers.

---

## 4. Wallet
**File:** `src/routes/_authenticated/wallet.tsx`  
**Status:** 1309 lines, single balance hero.  
**Contract:**
- Balance hero expands from 1 number to 3 stacked chips: Available, Staked, Locked.
- Wallet tabs: Activity | Stakes | Escrow | Settings — max 4 tabs, never scrollable tabs.
- Activity tab keeps date-grouped list. New tx types: `Stake Created`, `Unstaked`, `Reward Claimed`, `Escrow Funded`, `Escrow Released`.
- Stakes tab: active stake cards with countdown to cooldown end; unstake button disabled until cooldown expires.
- Escrow tab: milestone list with funded/released state + fund/release buttons per milestone.
- All currency display uses `formatDot` + `formatNaira`. No raw numbers.

---

## 5. Ventures
**File:** `src/routes/_authenticated/ventures.tsx`  
**Status:** Active routes + advisor endpoints.  
**Contract:**
- Venture detail tabs: Overview | Milestones | Team | Advisors | Escrow — max 5.
- Milestones tab shows vertical timeline with order_index; funded amount badge; payout amount editable only by founder.
- Escrow tab is read-only mirror of Wallet > Escrow; no fund/release actions here.
- Founder-only actions must show locked state for non-founders, not hide row.

---

## 6. Discover / Feed
**Files:** `src/routes/_authenticated/discover.tsx`, `src/routes/_authenticated/discover/communities.tsx`  
**Contract:**
- Top nav: Feed | Communities | Ventures — single row, active underline.
- Feed: post composer at top; post cards with like/comment/share/bookmark counts; sort Latest/Popular/Trending.
- Every post type displays author role badge + Vantage score chip.
- Comments: inline expandable thread; max 3 levels deep; reply button on level 2+.
- Communities: directory cards with member count + public/private badge; Join button inline.

---

## 7. Community / Messaging
**Files:** `src/routes/_authenticated/community/channels.tsx`, `src/routes/_authenticated/messages/*.tsx`  
**Contract:**
- Left rail: channel list; center: message stream; right: members/details — three-panel on desktop, tabbed on mobile.
- Channel types: text only in V1. No voice/video calls.
- Unread badge count on channel row; mark read on open.
- Messages surface: Received | Sent | Conversations — three tabs, one surface.

---

## 8. Marketplace / DOT Work
**File:** `src/routes/_authenticated/marketplace.tsx`, `src/routes/_authenticated/work.tsx`  
**Contract:**
- Unified Marketplace: Services + Jobs tabs. One table on desktop, cards on mobile.
- Each listing shows: title, builder/founder, price in DOT + NGN, delivery days, rating, Vantage score of seller.
- Order flow: Request → Confirm → Deliver → Rate. One question per step.
- Builder profile completion gate blocks Create Listing until profile is complete.
- All purchases debit wallet via `escrow_lock` transaction type.

---

## 9. Academy / Sessions / Pitchathons
**Files:** `src/routes/_authenticated/academy.tsx`, `src/routes/_authenticated/sessions.tsx`, `src/routes/_authenticated/pitchathons.tsx`  
**Contract:**
- Academy: course cards with progress bar + next-lesson CTA. Enrollment state: not-started | in-progress | completed.
- Sessions: calendar list + request/accept flow. One request per session. Status: pending | accepted | rejected | completed.
- Pitchathons: application form one question per page; submit triggers Vantage bump if accepted.

---

## 10. Admin / Operator
**Files:** `src/routes/_authenticated/admin/*.tsx`  
**Contract:**
- Data-dense tables only. No cards.
- Every mutation row shows: who, what, when, before/after values.
- Admin actions that touch wallets or stakes must emit notification to affected user.

---

## 11. Real-time
**Contract:**
- Wallet balance, Vantage score, stake state, notifications, messages are all WebSocket-backed in V2. V1 is polling via React Query with 15-30s staleTime.
- No optimistic UI for financial actions; show loader + toast on completion.

---

## 12. Component Primitives to Build/Reuse
- `<TrustBadge type="kyc|vantage|verified">` — show on every user-facing card.
- `<TierGate tier="founder|builder|investor">` — gate premium surfaces.
- `<StatCard>` — already exists; extend accent prop to include `gold`, `primary`, `destructive`.
- `<PageSkeleton>` — add `StakeCard`, `MilestoneRow`, `FeedPost` variants.

---

## 13. Frontend API Wiring Gaps
| New backend capability | Missing frontend call | Target page |
|---|---|---|
| `GET /api/wallet` now returns `stakedBalance`, `lockedBalance`, earned/burned/staked/redeemed lifetime | `WalletData` interface only has `balance` | Wallet |
| `POST /api/stakes`, `/api/stakes/:id/unstake`, `/api/stakes/:id/claim` | No stakes API module in `src/api/` | Wallet > Stakes tab |
| `POST /api/ventures/:id/escrow/fund`, `/release`, `/escrow` | No escrow API module | Wallet > Escrow tab + Ventures |
| `POST /api/vantage/sync` | No sync trigger after stake/unstake/claim | Wallet actions |
| Notification types `escrow_funded`, `escrow_released` | NotificationBell shows generic toast | Global |

---

## 14. Build / Deploy
- `npm run build` exits 0. No new TS errors.
- Lovable constraint: do not rewrite pushed git history. Clean commits only.
- Frontend deploy target: Vercel via existing config.
