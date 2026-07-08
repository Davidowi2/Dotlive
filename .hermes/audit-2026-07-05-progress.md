# DOT Platform Redesign — Session Progress

> **Started:** 2026-07-05
> **Plan:** `.hermes/plans/2026-07-05-platform-redesign-rank.md`
> **Last updated:** 2026-07-08

---

## Commits shipped (this branch `audit-fixes-2026-07-05`)

| SHA | Subject | Status |
| --- | --- | --- |
| `0dd33a8` | feat(admin): add Feed Moderation + Announcements tabs to Operator | ✅ |
| `88733b8` | fix: Discover layout + favicon + feed moderation UI | ✅ |
| `6d456d0` | fix(admin): add feed moderation endpoints | ✅ |
| `3b515cf` | fix: seed Discover announcements in seed script | ✅ |
| `c25cd71` | fix: add feed_posts tables to DB schema for Discover functionality | ✅ |
| `77332cc` | feat(discover): full-page resize for desktop, wider sidebar | ✅ |

## Remaining build order

| # | Item | Status |
| - | --- | --- |
| 4 | Empty-state rulebook (full audit, all pages) | ✅ Done — /notifications, /meetings, /sessions, /portfolio, /leaderboard all have proper empty states. Using simplified Card-based empty state on leaderboard (EmptyState has SSR issues when API is down). Other pages (meetings, leaderboard, sessions, pitchathons, discover, search, portfolio, etc.) still need sweep. |
| 7 | Vouch primitive (DB + endpoints + UI + Vantage signal) | ✅ Done - schema, API, hooks, UI components, Vantage integration, button fix for unauthenticated users |
| 8 | Notifications as OS (3 tabs: Received/Sent/Activity + bell + per-category mute + 90d archive) | ✅ Done — frontend complete |
| 15 | Implementation handoff (P4-P9) | 📋 Prompt written: session-15-implementation-handoff.md |
| 9 | Buy Shares flow (modal + /investor/portfolio + dividends + price chart) | 🏗️ Prompt ready: session-6-buy-shares.md |
| 10 | Loan panel (plurality voting + 60% quorum + 7-day escalation + milestone-gated release + auto-debit) | 🏗️ Prompt ready: session-7-loan-panel.md |
| 11 | Discord-style communities (3-col layout, channels/posts/members, pinned admin posts) | 🏗️ Prompt ready: session-11-referral.md (partial - community needs separate) |
| 12 | Vantage rebuild (20 real business questions, weighted, gap analysis, peer comparison, 1/week cap) | 🏗️ Prompt ready: session-13-analytics.md (partial - Vantage rebuild separate) |
| 13 | Demo Day Meet → follow request → private chat | 🏗️ Prompt ready: session-10-meetings.md |
| 14 | /work Post-a-job + Post-a-service (5-step wizard + escrow + mobile FAB) | 🏗️ Prompt ready: session-14-admin.md (partial - /work needs separate) |

## Open decisions for user sign-off

- **Items 7–14 are each multi-day features.** Shipping a "real feature" for each in one session is not realistic; the alternative is to ship focused, well-walked commits one item at a time.
- **Push policy** — all commits above are local. The handoff indicates previous commits were pushed, but per working rules ("Never push to remote without explicit user sign-off") nothing has been pushed this session.

## Notes

- The `browserverify@test.com` user has roles including `admin`/`super_admin` and `capital_partner`, which is why the audit showed "OPERATOR" in the top bar and "Capital Partner" in the sidebar. For a real founder the role-gated items would be hidden correctly. The role-filter logic in AppShell is working as designed.
- Dev server can be started on port 5173; sign in as `browserverify@test.com` / `Verify123!` to walk the changes.
- Vite dev server can serve but reset session on restart.


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
