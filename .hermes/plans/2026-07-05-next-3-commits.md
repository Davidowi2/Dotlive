# DOT — Next 3 Commits Execution Plan

> **Status:** 2026-07-05, ~12:45
> **Branch:** `audit-fixes-2026-07-05`
> **Goal:** Ship 3 more commits before the next push, no overscope, no broken builds.

---

## Why this plan exists

The last few hours had three failure modes:
1. **Auditing every page before fixing anything** — burns time on a list, no shipped work.
2. **Over-scoping a single change** (e.g. "add 4 tabs to /ventures" in one shot) — risks breaking the build.
3. **Patching without verifying in the browser** — false confidence.

This plan fixes all three. **One commit, one feature, one build check, one browser walk. No exceptions.**

---

## The 3 commits

### Commit 3 — `/wallet` Stakes + Escrow tabs
**Why first:** the data is already there (`getStakes` API client exists, escrow endpoint exists), the user is on this page already, and it's the most "visible" win.

**Scope:**
- Add a `<Tabs>` shell to `/wallet` (or a simple segmented control) with: Activity (current) / Stakes / Escrow / Settings.
- Stakes tab: read from `getStakes()`, show position list using the same `<StakeRow>` pattern as `/stakes` (extract a small shared component OR just duplicate the table — 1-2 hours is too short for component extraction, duplicate for now).
- Escrow tab: read from `/api/ventures/$id/escrow`. Same shape as the ventures EscrowTab.
- Settings tab: keep the existing KYC + Withdraw block.

**File changes:** `src/routes/_authenticated/wallet.tsx` only.
**Build check:** `npm run build` exits 0.
**Browser walk:** click through all 4 tabs as `browserverify@test.com`. Each must render real data or honest empty state.
**Time budget:** 30 min. If over, ship whatever tab is done and move the others to commit 6.

### Commit 4 — `<PageIntent>` component + apply to `/wallet`
**Why next:** it's the smallest new abstraction, and applying it to one page proves the pattern. We can roll it out to other pages in commit 7+.

**Scope:**
- New file: `src/components/app/PageIntent.tsx`. One-line component: "This is your wallet. Here's your balance and what you can do with it."
- Apply to `/wallet` only. Other pages get it later.
- Below the PageIntent, content stays the same.

**File changes:** `PageIntent.tsx` (new) + `wallet.tsx` (import + insert).
**Build check + browser walk:** same protocol.
**Time budget:** 15 min.

### Commit 5 — `/ventures` Escrow tab
**Why last:** bigger change, want fresh eyes after the other two are landed. And escrow is the highest-value tab (it's where the money lives). Skip Milestones/Team/Advisors — those can be commit 6 and 7.

**Scope:**
- Wrap existing `/ventures` content in a `<Tabs>` shell: Overview (current) / Escrow.
- Escrow tab: read from `/api/ventures/$id/escrow`, show 4 summary cards (total, available, pending, released) + recent activity list. Same component shape as `/wallet` Escrow.
- Team/Milestones/Advisors tabs added in commit 6+, not now.

**File changes:** `ventures.tsx` only.
**Build check + browser walk.**
**Time budget:** 30 min.

---

## After commit 5: stop and push

3 small commits, each one verified, each one reviewable. Then I push the branch, you walk the preview, and we decide what's next.

---

## What I will NOT do this batch

- ❌ Add Milestones/Team/Advisors tabs to /ventures (commit 6+)
- ❌ Refactor shared components (extract `<StakeRow>`, etc.) — that's a separate, longer task
- ❌ Touch the backend
- ❌ Push without your approval
- ❌ Touch more than 2 files per commit
- ❌ Run the dev server unless I'm verifying a build

## Hard stops (call out, don't fix)

If I hit any of these, I stop and tell you, I don't invent:
- A backend endpoint doesn't exist
- A schema column doesn't match what I'm reading
- The build fails for a reason I can't immediately diagnose
- I need to modify a file I didn't plan to touch

---

## Verification protocol (every commit)

1. `npm run build` exits 0
2. Walk the page in a real browser as `browserverify@test.com`:
   - Page renders (no blank screen, no "something went wrong")
   - The new feature works (tab switches, data loads, button clicks)
   - The existing features still work (other tabs, navigation, CTAs)
3. `git status` shows only the planned files changed
4. Commit with clean message, no `git add .`
