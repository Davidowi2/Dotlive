# DOT Platform Redesign — Session Progress

> **Started:** 2026-07-05
> **Plan:** `.hermes/plans/2026-07-05-platform-redesign-rank.md`

---

## Commits shipped

_(none yet — all changes are staged or uncommitted, awaiting user review before commit/push)_

## Staged changes (verified in browser, ready for user commit review)

- **AppShell.tsx** — removed duplicate `Meetings` nav entry (line 77 of original). The duplicate was a `Meetings` link in the `capital` section pointing to `/demo` with a `Bell` icon. **Fixes audit D-04.** Build green, walked on /dashboard, confirmed sidebar shows only one Meetings link.

## Pending work (ranked)

- P0-5: label/value split bugs on dashboard hero cards (D-01, D-02, D-03, D-13)
- P0-3: PageIntent component
- P0-4: empty-state rulebook
- P1: shared stake/escrow widgets, /wallet tabs, /ventures tabs
- P2-P9: in plan markdown

## Audit additions (walked 2026-07-05)

### Wallet (/wallet)
- **W-01** Quick action "Stake DOT" doesn't open anything — needs a working CTA to /stakes
- **W-02** Available balance shows but the "X DOT" number is missing in the hero
- **W-03** Lifetime counters all show 0 — verify real or hide
- **W-04** No Stakes tab in /wallet
- **W-05** No Escrow tab in /wallet
- **W-06** Transaction history empty, no empty state

### Ventures (/ventures)
- **V-01** No Milestones, Team, Advisors, Escrow tabs
- **V-02** VANTAGE POINT heading has no value
- **V-03** STAGE heading has no value
- **V-04** "Your venture name" has no name
- **V-05** Profile completeness bar has no percent
- **V-06** "Investors need 7 more fields" — no way to see the list

### Vantage (/vantage)
- **VG-01** Page is empty — likely render error
- **VG-02** Console: `<a>` inside `<a>` hydration error from Logo component

### Console
- **C-01** Logo renders nested `<a>` (hydration error)
- **C-02** `/demo` route has duplicate React keys
- **C-03** `work.tsx` exports `WorkPage` from route file, blocks code-split

## To audit (not yet visited)
- /discover, /search, /meetings, /notifications, /portfolio, /referrals, /leaderboard, /work, /academy, /sessions, /pitchathons, /profile, /settings, /help, /kyc, /investor, /capital, /demo, /community, /stakes

## Notes

- The `browserverify@test.com` user has roles including `admin`/`super_admin` and `capital_partner`, which is why the audit showed "OPERATOR" in the top bar and "Capital Partner" in the sidebar. For a real founder the role-gated items would be hidden correctly. The role-filter logic in AppShell is working as designed.
- Dev server running on port 5173, signed in as `browserverify@test.com`.
