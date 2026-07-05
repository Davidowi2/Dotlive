# VENTURE PARTNER MVP — IMPLEMENTATION AUDIT
**Spec Source:** `DOT — Product Update.pdf` (Venture Partner MVP / Pilot Phase)
**Codebase:** dotlive-main @ main (commit 34da227)
**Date:** 2025-07-04

---

## EXECUTIVE SUMMARY
The PDF describes a **brand-new Tinder-style venture discovery system** (Venture Partner MVP) with Demo DOT allocation, community scoring, and gamification. The current codebase is a **different product** — a builder/founder/investor platform with Vantage scoring, DOT Work, Academy, and basic Discover feed.

**Verdict:** <15% of the Venture Partner MVP is implemented. This is not "adding features" — it's building a new core loop.

---

## ROLE-BY-ROLE AUDIT

| Spec Role | In Constants? | Backend Auth? | Frontend Routes? | Notes |
|-----------|---------------|---------------|------------------|-------|
| **Founder** | ✅ `founder` | ✅ | ✅ Dashboard, profile, venture creation | Has venture creation but missing pitch video/deck upload |
| **Venture Partner** | ❌ MISSING | ❌ | ❌ | **CORE ROLE MISSING** — entire MVP centers on this |
| **Builder** | ✅ `builder` | ✅ | ✅ /work, profile, /builder | Different from spec's "completes jobs" (Phase 2) |
| **Capital Partner** | ✅ `capital_partner` | ✅ | ❌ | Spec: Phase 3; Current: badge only |

**Action Required:** Add `venture_partner` to `AppRole`, `ROLE_LABELS`, auth middleware, role gates.

---

## FEATURE-BY-FEATURE AUDIT

### 1. FOUNDER DASHBOARD — Venture Creation
| Spec Field | Implemented? | Location |
|------------|--------------|----------|
| Create Venture | ✅ | `/onboarding` + ventureDetails |
| Upload Logo | ✅ | `logoUrl` in ventureDetails |
| Upload Cover Image | ❌ | No `coverImageUrl` field |
| **Upload 60-90s Pitch Video** | ❌ | No `pitchVideoUrl` field |
| **Upload Pitch Deck (PDF)** | ⚠️ URL only | `pitchDeckUrl` text field exists but no upload |
| Industry | ✅ | ventureDetails.industry |
| Problem | ✅ | ventureDetails.problem |
| Solution | ✅ | ventureDetails.solution |
| Business Model | ❌ | No field |
| Stage | ✅ | ventures.stage + ventureDetails.stageRationale |
| Team Members | ✅ | ventureTeamMembers table |
| Revenue (Optional) | ✅ | ventureDetails.tractionMrr |
| Website (Optional) | ✅ | ventures.website |
| Social Links | ❌ | No field |
| Country | ✅ | ventures.country |
| State | ❌ | No field |
| Community/University | ❌ | `communityId` in founderProfiles only |
| Status (Draft/Submitted/Under Review/Live) | ❌ | Only `stage` enum, no workflow status |

**Gap:** Missing pitch video upload, deck upload (not just URL), cover image, business model, social links, state, community/university, workflow status.

---

### 2. VENTURE DISCOVERY — Tinder-Style Card Swipe
| Spec Feature | Implemented? | Current State |
|--------------|--------------|---------------|
| **Venture Card (Logo, Name, Founder, Industry, Community, Stage, Problem, Solution, Pitch Video, Deck Button)** | ❌ | Current: Grid/list with Vantage/Fundability stats |
| **One card at a time, swipe/decision flow** | ❌ | Current: Infinite scroll grid |
| **Venture Partner never sees spreadsheets** | N/A | No Venture Partner role |
| **5 Questions per venture (Yes/Maybe/No, Potential 1-5, Usage 1-5, Founder confidence 1-5, Demo DOT allocation 1K-10K)** | ❌ | No review/allocation flow |

**Gap:** Entire core discovery loop missing. Current Discover is a social feed + venture grid, not a review engine.

---

### 3. VENTURE PARTNER EXPERIENCE — Demo DOT Allocation
| Spec Feature | Implemented? |
|--------------|--------------|
| 1,000,000 Demo DOT per Venture Partner | ❌ |
| Demo DOT NOT withdrawable, ONLY for allocation | ❌ |
| Min 100 ventures reviewed | ❌ |
| Min 100 different ventures allocated to | ❌ |
| Min allocation 1,000 DOT / venture | ❌ |
| Max allocation 10,000 DOT / venture | ❌ |
| Total allocation ≤ available Demo DOT | ❌ |
| Remaining balance display | ❌ |
| "Next Venture" immediately after submit | ❌ |

**Gap:** Entire Demo DOT economy missing. Current DOT is real (15 NGN), withdrawable, earned via work.

---

### 4. COMMUNITY SCORE
| Spec Component | Implemented? |
|----------------|--------------|
| Total Demo DOT allocated | ❌ |
| Number of Venture Partners | ❌ |
| Average Rating (1-5 stars) | ❌ |
| Yes/Maybe/No ratio | ❌ |
| Display: Community Score %, VP count, DOT allocated, Avg rating | ❌ |

**Gap:** Scoring algorithm and display missing.

---

### 5. LEADERBOARDS
| Spec Leaderboard | Implemented? | Current |
|------------------|--------------|---------|
| Top Ventures | ❌ | DOT Work leaderboard only |
| Top Founders | ❌ | — |
| Top Communities | ❌ | — |
| Top Universities | ❌ | — |
| Top States | ❌ | — |
| Top Countries | ❌ | — |
| **Top Venture Partners** | ❌ | — |

**Gap:** All 7 leaderboards missing.

---

### 6. VENTURE PARTNER PROFILE & GAMIFICATION
| Spec Feature | Implemented? |
|--------------|--------------|
| Ventures Reviewed count | ❌ |
| DOT Allocated total | ❌ |
| Average Review Time | ❌ |
| Community Rank | ❌ |
| Accuracy Score (future) | ❌ |
| **Badges** (First Review, 10/100/250/500/1000 Ventures, Founding VP, Top 100 VP, Top Community VP, Weekly/Monthly Champion) | ❌ |

**Gap:** Entire gamification layer missing.

---

### 7. NOTIFICATIONS (Spec §10)
| Trigger | Implemented? |
|---------|--------------|
| Founder submits venture | ❌ (has notifications but not this event) |
| Venture reaches Top 100 | ❌ |
| VP earns badge | ❌ |
| VP reaches 100 reviews | ❌ |
| Founder enters Trending | ❌ |
| Comment on venture | ❌ |
| Follow | ❌ |

**Gap:** Notification types don't match spec events.

---

### 8. FOUNDER DASHBOARD UPDATES (Spec §11)
| Metric | Implemented? |
|--------|--------------|
| Community Score | ❌ |
| Community Rank | ❌ |
| University Rank | ❌ |
| State Rank | ❌ |
| Country Rank | ❌ |
| Africa Rank | ❌ |
| Total DOT Allocated | ❌ |
| Total Venture Partners | ❌ |
| Comments | ❌ |
| Reviews | ❌ |
| Follower Count | ❌ |

**Gap:** All rank/score metrics missing.

---

### 9. COMMENTS (Spec §12)
| Spec | Current |
|------|---------|
| Short constructive comments on ventures | Comments exist on **feed posts**, not ventures |
| Max 300 characters | No limit enforced |
| Founder can reply | ❌ |

**Gap:** Comment system attached to wrong entity (feed vs venture).

---

### 10. FOLLOW FEATURE (Spec §13)
| Spec | Current |
|------|---------|
| VP follows founders | ❌ |
| Founders follow ventures | ❌ |

**Gap:** Missing entirely.

---

### 11. TRENDING (Spec §14)
| Spec Category | Current |
|---------------|---------|
| Trending Today | TrendingSidebar shows **tags**, not ventures |
| Trending This Week | ❌ |
| Most Funded | ❌ |
| Most Reviewed | ❌ |
| Fastest Rising | ❌ |
| Editor's Picks (Admin) | ❌ |

**Gap:** Trending is for feed tags, not venture discovery.

---

### 12. SEARCH (Spec §15)
| Spec Filter | Current |
|-------------|---------|
| Founder | ✅ (in venture browse) |
| Industry | ✅ |
| Country | ✅ |
| University | ❌ (no university field) |
| Community | ❌ (communityId exists but not searchable) |
| Stage | ✅ |
| Problem | ❌ (problem in ventureDetails but not indexed for search) |
| Technology | ❌ |

**Gap:** Partial — missing university, community, problem, technology search.

---

### 13. CERTIFICATES (Spec §16-17)
| Spec Certificate | Current |
|------------------|---------|
| Founding Venture Partner | ❌ |
| Pioneer Venture Partner | ❌ |
| Top 100 Venture Partner | ❌ |
| Pioneer Founder | ❌ |
| Top 100 Founder | ❌ |
| Off-chain, NFT-ready design | Has certificates.tsx but different types |

**Gap:** Certificate types don't match spec.

---

### 14. ADMIN DASHBOARD (Spec §17)
| Spec Admin Action | Current |
|-------------------|---------|
| Approve Ventures | ❌ (ventures go live on submit) |
| Reject Ventures | ❌ |
| Feature Ventures | ❌ |
| Award Badges | ❌ |
| Issue Certificates | ❌ |
| Suspend Accounts | ❌ |
| View Analytics | Basic only |
| Export Rankings | ❌ |
| Manage Communities | ✅ |
| Manage Universities | ❌ |
| Manage Challenges | ✅ (community challenges) |

**Gap:** Venture moderation workflow missing.

---

### 15. ANALYTICS (Spec §18)
| Spec Metric | Current |
|-------------|---------|
| Total Founders | ❌ |
| Total Venture Partners | ❌ |
| Ventures Submitted | ❌ |
| Ventures Reviewed | ❌ |
| Demo DOT Allocated | ❌ |
| Average Rating | ❌ |
| Most Active VP | ❌ |
| Most Active Founder | ❌ |
| Community Rankings | ❌ |
| Daily Active Users | ❌ |

**Gap:** Analytics dashboard missing for VP metrics.

---

## DATABASE SCHEMA GAPS

| Spec Table/Field | Current Status |
|------------------|----------------|
| `venture_partner` role in users | ❌ |
| `demo_dot_balance` on users | ❌ (real DOT only) |
| `venture_reviews` (VP → venture, 5 questions + allocation) | ❌ |
| `community_scores` (venture_id, score, vp_count, dot_allocated, avg_rating, yes/maybe/no) | ❌ |
| `leaderboards` (ventures, founders, communities, universities, states, countries, VPs) | ❌ |
| `badges` + `user_badges` | ❌ |
| `venture_comments` (300 char, founder reply) | ❌ (feed comments only) |
| `follows` (user→founder, user→venture) | ❌ |
| `trending_ventures` (daily/weekly/most_funded/most_reviewed/fastest_rising/editors_picks) | ❌ |
| `certificates` (founding_vp, pioneer_vp, top100_vp, pioneer_founder, top100_founder) | Types differ |
| `venture_status` workflow (draft/submitted/under_review/live) | ❌ |

---

## BACKEND ROUTE GAPS

| Spec Endpoint | Current |
|---------------|---------|
| `POST /api/ventures` (full spec fields) | `/api/ventures` basic + `/api/ventures/:id/details` |
| `GET /api/ventures/discover` (one card for VP) | `/api/ventures` list with filters |
| `POST /api/ventures/:id/review` (5 questions + allocation) | ❌ |
| `GET /api/ventures/:id/community-score` | ❌ |
| `GET /api/leaderboards/ventures` | `/api/leaderboard` (DOT Work only) |
| `GET /api/leaderboards/founders` | ❌ |
| `GET /api/leaderboards/communities` | ❌ |
| `GET /api/leaderboards/venture-partners` | ❌ |
| `GET /api/users/:id/vp-profile` | ❌ |
| `POST /api/ventures/:id/comments` (300 char) | Feed comments only |
| `POST /api/founders/:id/follow` | ❌ |
| `GET /api/trending/ventures` | Trending tags only |
| `GET /api/search/ventures` (full spec filters) | Basic filters |
| `POST /api/admin/ventures/:id/approve` | ❌ |
| `POST /api/admin/ventures/:id/reject` | ❌ |
| `GET /api/admin/analytics` (spec §18) | ❌ |

---

## FRONTEND PAGE GAPS

| Spec Page | Current |
|-----------|---------|
| **Venture Partner Discover** (Tinder card swipe) | `/discover` → feed/ventures/communities tabs |
| **Venture Partner Dashboard** (Demo DOT balance, reviews done, allocations) | ❌ |
| **Venture Partner Profile** (badges, rank, stats) | ❌ |
| **Founder Venture Creation** (pitch video/deck upload, cover, business model) | `/onboarding` partial |
| **Founder Venture Dashboard** (Community Score, all ranks, comments, reviews, followers) | Profile has Vantage only |
| **Venture Detail Page** (for VP review + founder view) | `/demo/:id` basic |
| **Leaderboards Hub** (7 tabs) | `/leaderboard` (DOT Work only) |
| **Trending Ventures** | TrendingSidebar (tags) |
| **Admin Venture Moderation** | ❌ |

---

## ESTIMATED IMPLEMENTATION EFFORT

| Epic | Est. Days | Dependencies |
|------|-----------|--------------|
| 1. Add `venture_partner` role + Demo DOT wallet | 2 | Auth, DB schema |
| 2. Venture creation full spec (video/deck upload, cover, workflow) | 3 | Storage, ventureDetails expansion |
| 3. Tinder-style Discover (card component, swipe logic, 5-question review) | 5 | New route, card component, state machine |
| 4. Demo DOT allocation engine (1M grant, 100 min, 1K-10K bounds) | 3 | Wallet separation (real vs demo) |
| 5. Community Score calculation + display | 2 | venture_reviews aggregation |
| 6. 7 Leaderboards (API + UI) | 3 | New tables, scheduled jobs |
| 7. VP Profile + Gamification (badges, 10 achievements) | 3 | Badges system, triggers |
| 8. Notifications for spec events | 2 | Notification types expansion |
| 9. Founder Dashboard rank/score widgets | 2 | Depends on #5 |
| 10. Venture Comments (300 char, founder reply) | 1 | New table |
| 11. Follow feature | 1 | New table |
| 12. Trending Ventures (5 categories + Editor's Picks) | 2 | Scheduled computation |
| 13. Search (university, community, problem, technology) | 1 | Indexes, ventureDetails fields |
| 14. Certificates (5 VP + 2 Founder types, off-chain) | 1 | Extend certificates.tsx |
| 15. Admin Venture Moderation (approve/reject/feature) | 2 | Status workflow, admin UI |
| 16. Analytics Dashboard (11 metrics) | 2 | New queries, admin page |

**Total: ~38 days** for full MVP (single dev, no parallelization).

---

## RECOMMENDATIONS

### If building the Venture Partner MVP:
1. **This is a new product**, not a feature set. Treat it as such.
2. **Add `venture_partner` role first** — everything depends on it.
3. **Separate Demo DOT from real DOT** — different wallet, non-withdrawable, 1M grant on role grant.
4. **Build the Tinder card loop** as the core — everything else (scores, leaderboards, badges) feeds off review data.
5. **Defer:** Certificates, Editor's Picks, Accuracy Score, Follow feature — nice to have, not MVP blockers.

### If continuing current product (builder/founder/investor platform):
- The PDF spec is **not aligned** with current architecture.
- Current platform = Vantage + DOT Work + Academy + Pitchathons + Capital raising.
- PDF platform = Demo DOT + Community scoring + Gamified discovery.
- **Pick one.** Mixing them creates confusion (two DOT economies, two discovery flows, two "investor" roles).

---

## VERIFICATION CHECKLIST FOR NEXT SESSION

- [ ] Add `venture_partner` to `AppRole` and `ROLE_LABELS`
- [ ] Create `demo_dot_balance` column + grant 1M on role assign
- [ ] Create `venture_reviews` table with 5 questions + allocation
- [ ] Build `/venture-partner/discover` route with Tinder card
- [ ] Build `/api/ventures/:id/review` endpoint
- [ ] Build Community Score aggregation job
- [ ] Build 7 leaderboard endpoints
- [ ] Add badge system + 10 VP achievements
- [ ] Extend venture creation with video/deck upload + status workflow

---

**Bottom line:** The codebase has excellent foundations (auth, wallet, Vantage, feed, Discover grid, ventureDetails) but the **Venture Partner MVP is a different core loop**. Either pivot the platform to the PDF spec, or treat the PDF as a separate product to build alongside.