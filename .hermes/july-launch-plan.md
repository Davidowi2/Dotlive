
# DOT FOUNDRY — July Launch Build Plan
# Filtered client message through "what actually blocks July launch"
# Method: gap-fill with best default, ship, downgrade later

## SPRINT A — Money flow + Events (Days 1-2)
**Why first**: Without withdrawal + KYC, we can't legally let builders cash out.
Without events, no July 26 launch demo.

1. Withdrawal flow:
   - New table: `withdrawal_requests` (id, user_id, amount_dot, bank_info jsonb, kyc_tier, status, createdAt, processedAt)
   - New table: `kyc_submissions` (user_id PK, bvn, nin, gov_id_url, tier, status, reviewed_by, reviewed_at)
   - Endpoint: POST /api/wallet/withdraw (debit DOT, create withdrawal_request, status=pending_review)
   - Endpoint: GET /api/kyc/me (current status)
   - Endpoint: POST /api/kyc/submit (BVN/NIN/ID)
   - Wallet page: "Withdraw" button next to "Transfer"
   - Default: KYC tier 1 = email only, tier 2 = BVN, tier 3 = NIN + gov ID

2. Community subscription tiers:
   - Update `communities` table: tier column (free/verified/campus/enterprise), annual_renewal_at, subscription_status
   - Endpoint: POST /api/communities/$id/upgrade (debits 200,000 DOT, sets tier + 365-day renewal)
   - Endpoint: POST /api/communities/$id/renew (recurring annual)
   - Community dashboard: show tier badge + renewal countdown
   - Default pricing: Free=0, Verified=200k DOT, Campus=200k, Enterprise=500k (configurable)

3. Per-event DOT Demo pages:
   - New table: `demo_events` (slug, name, description, start_date, end_date, track_types jsonb, sponsors jsonb, judges jsonb, registration_open, voting_open)
   - Seed: DOT Demo July 2026 (open + invitational tracks)
   - New route: /demo/$slug (public, no auth)
   - Components: countdown, sponsors logos, judge grid, registered ventures, voting widget
   - Public voting: anonymous via signed token, anti-fraud = 1 vote per user per event

4. Multi-poster challenges:
   - Update challenges table: poster_type (founder/community/capital_partner/university/company/admin)
   - Allow communities + capital_partners + admins to POST /api/challenges
   - Filter on /api/challenges by poster_type

## SPRINT B — Roles + Discovery + Founder profile (Days 3-4)

1. Split Investor vs Capital Partner:
   - Capital Partner gets NEW routes: /capital (pipeline), /capital/deals, /capital/commit
   - Investor keeps: /investor (browse, save, meetings)
   - Both can access: /deals/$id (Deal Room)
   - AppShell: shows "Capital Portal" link only for capital_partner role

2. Voting engine (one table, reused):
   - Table: `votes` (id, voter_id, target_type [venture/challenge/builder], target_id, event_slug, weight, createdAt)
   - Endpoint: POST /api/votes (cast vote)
   - Endpoint: GET /api/votes/$eventSlug/leaderboard (ranked by total weight)
   - Reused for: DOT Demo, ARISE Lists, Campus Challenge, People's Choice
   - Anti-fraud: 1 vote per user per target per event; 1 weight; trust score = reputation

3. Public founder profile /founders/$id:
   - Shows: founder name, venture, Vantage score, Builder level, reputation, funding stage, team, demo history, challenges won, votes received
   - "Share this profile" button with copy URL
   - Edit-own only for the founder

4. Discover filters:
   - Country, University, Industry, Funding stage, Vantage range, Revenue range, Team size
   - Endpoint: GET /api/discover/ventures?...filters
   - Discover page: filter sidebar + result grid + saved searches

## SPRINT C — Campus + Notifications + Capital Portal (Days 5-6)

1. Campus Challenge module:
   - Tables: universities (id, name, country, ambassador_id), campus_teams (id, university_id, name, founder_id)
   - Leaderboards: /campus/$slug/university, /campus/$slug/faculty, /campus/$slug/national
   - Ambassador dashboard: manage teams, approve ventures, post challenges
   - Qualification logic: vantage + challenges + voting → demo eligibility

2. Notifications (4 trigger types):
   - Table: notifications (id, user_id, type, title, body, link, read, createdAt)
   - Triggers: vote_received, challenge_match, demo_qualified, meeting_request
   - Bell icon + dropdown in AppShell header (already there, needs wiring)
   - Polling every 30s + realtime push later

3. Builder Arena as live leaderboard:
   - Currently a personal page. Refactor to show TOP 100 builders
   - Rank by: Vantage × 0.4 + Reputation × 0.3 + Challenges_won × 0.2 + Followers × 0.1
   - Filter: by country, by skill, by level
   - Personal view: still shows my stats + my rank

4. Capital Partner dashboard:
   - Pipeline view: ventures matching criteria
   - Watchlist: saved ventures
   - Active commitments: funding deployed + scheduled
   - Filter by Vantage, stage, industry

## SPRINT D — Admin extension + ARISE polish (Day 7)

1. Admin tabs: extend /admin to add:
   - Communities (already have members; add tier management)
   - Universities (CRUD)
   - Demo Events (CRUD + manage registrations)
   - Capital Partners (role grant + tier)
   - Voting Events (CRUD + view live leaderboard)
   - Withdrawals (review queue)

2. Campaign shell (NOT a generic engine):
   - One config object: { slug, name, type, dates, rules, rewards }
   - Seed 3 campaigns: DOT Demo July 2026, Campus Challenge 2026, ARISE Top 10 Builders Aug 2026
   - Each campaign = same data shape; UI renders per type
   - When 2nd campaign of same type exists, extract to a table — for now, config-as-data

3. ARISE featured badges:
   - Add `arise_featured_at`, `arise_badges` columns to ventures
   - Admin can toggle featured + add badges (e.g. "Top 10 Africa", "Founder of the Month")
   - Public profile: badge display + timeline

## What we're DELIBERATELY NOT building (yet)

- ❌ Generic Campaign Engine with full UI configurator → config-as-data for now, refactor when needed
- ❌ Scholarship auto-evaluation engine → manual grant + admin override
- ❌ 6 separate leaderboard systems → 1 component, 1 ranking function, reused
- ❌ Full KYC integration with Smile ID / QoreID → store BVN/NIN, manual review, integrate when needed
- ❌ Live streaming for DOT Demo → countdown + registration only for July; live streaming = later
- ❌ Mentorship module → out of scope for July launch
- ❌ Multi-language (i18n) → English only for July
- ❌ Mobile app → web-responsive only

## What I'll do BEFORE building

1. Push back on the client about which features are ACTUALLY blockers for July (not "nice to have")
2. Ask them what "July launch" means specifically (date? audience? what works?)
3. Confirm pricing tiers (200k DOT vs 500k DOT for Enterprise)
4. Get the first 3 demo events seeded (DOT Demo July 2026, Campus Challenge 2026, ARISE Top 10)
