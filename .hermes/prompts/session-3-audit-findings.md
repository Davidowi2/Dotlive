# DOT Platform Audit — Session 3 Prompt

## Project Context
**Stack:** TanStack Start (frontend) + Fastify/Drizzle (backend) + Neon PostgreSQL + custom JWT.
**Branch:** `audit-fixes-2026-07-05` (all changes pushed).
**Working dir:** `C:\Users\GTHub\OneDrive\Desktop\dotlive-main`.
**Test account:** `browserverify@test.com` / `Verify123!` (dev only).

## Vision (locked)
DOT is the OS where African startups prove credibility (Vantage 0-1000), attract talent (Work/Builder Arena), and raise capital (Buy Shares + Loan Panel + Stakes). Naira first, DOT second (1 DOT = ₦15). Quality bar: Stripe + Linear + private banking portal.

## Session 2 Changes (done, verified working)
1. ✅ **useVantage hook** — `src/hooks/use-dot-data.ts` — reads latest assessment from `assessments[0]`. Backend returns `desc(createdAt)`, so this is correct (was using `[length-1]` which was wrong).
2. ✅ **computeNetWorth function** — `src/lib/netWorth.ts` — single source for total net worth. Uses `Math.max(staked, stakesValue)` to avoid double-counting.
3. ✅ **NetWorthBand component** — dashboard renders it. Breakdown: Available/Staked/Locked/In escrow. Verified in browser.
4. ✅ **StakesWidget** — dashboard renders it. Empty state "Earn 12% APY on idle DOT" when no stakes, 3-card summary when has stakes.
5. ✅ **PageIntent component** — 11 pages updated with contextual "What should I do next?" prompts.
6. ✅ **Ventures tabs** — 5-tab shell (Overview/Team/Milestones/Advisors/Escrow). Overview renders, other tabs show empty state.

## Issues I Fixed (during audit)
- ✅ **Dashboard NetWorthBand double-count** — The Staked line was `nw.staked + nw.activeStakes`. computeNetWorth already avoids double-counting in total, so adding again inflated the breakdown vs total. Fixed to just `nw.staked`. Commit: `543492f`
- ✅ **Logo nested anchor** — Fixed in session 1 (added `asLink` prop to Logo component).

## Issues That Need Fixing (session 3)
**Critical:** Clicking Team/Milestones/Advisors/Escrow tabs on `/ventures` blanks the entire page (runtime error). Only Overview tab works. The other 4 tab content components (`TeamTab`, `MilestonesTab`, `AdvisorsTab`, `EscrowTab`) are erroring on render.

**Task:** Fix the ventures tab rendering issue so all 5 tabs work.

## What To Do
1. Open `src/routes/_authenticated/ventures.tsx`
2. Look at the `TeamTab`, `MilestonesTab`, `AdvisorsTab`, `EscrowTab` components (lines ~620-830)
3. Find why they error when the tab is clicked (check the data fetching, hooks, or rendering logic)
4. Fix the bug so all tabs render without crashing
5. Run `npm run build` — must exit 0
6. Test manually in browser: go to `/ventures`, click each tab, verify no crash

## Hard Rules
- One file, one fix, one build, one commit.
- If something blocks, surface it. Don't invent workarounds.
- Verify in browser after fixing.
- Don't push to remote — just commit locally. I'll audit and push.

## Start
Open `ventures.tsx` and find the tab error. Fix it.