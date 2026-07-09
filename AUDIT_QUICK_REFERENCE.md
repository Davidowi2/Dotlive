# Backend/Frontend Audit - Quick Reference

## TL;DR - Key Findings

| Finding | Count | Severity |
|---------|-------|----------|
| **Path Mismatches** | 3 | 🔴 CRITICAL |
| **Uncovered Endpoints** | 35+ | 🟡 HIGH |
| **Response Format Issues** | 8 | 🟡 MEDIUM |
| **Perfect Coverage** | ~165 | ✅ GOOD |

---

## Path Mismatches (MUST FIX)

### ❌ Problem 1: `/meetings/` vs `/api/meetings/`
**Frontend:** Uses `/meetings/slots`, `/meetings/` (no `/api`)  
**Backend:** Registers as `/api/meetings/`  
**Fix:** Update frontend calls to use `/api/meetings/` prefix

**Affected Functions:**
- `getAvailableSlots()` → Change `/meetings/slots` to `/api/meetings/slots`
- `createSlot()` → Change `/meetings/slots` to `/api/meetings/slots`
- `requestMeeting()` → Change `/meetings` to `/api/meetings`

---

### ❌ Problem 2: `/stakes/` vs `/api/stakes/`
**Frontend:** Uses `/stakes`, `/stakes/:id/unbond`, etc. (no `/api`)  
**Backend:** Registers as `/api/stakes/`  
**Fix:** Update frontend calls to use `/api/stakes/` prefix

**Affected Functions:**
- `getStakes()` → `/api/stakes`
- `createStake()` → `/api/stakes`
- `unstake()` → `/api/stakes/:id/unbond`
- `claimRewards()` → `/api/stakes/:id/claim`
- `completeUnbond()` → `/api/stakes/:id/complete`

**File:** `src/api/stakes.ts`

---

### ⚠️ Problem 3: `/api/challenges/` vs `/api/community/challenges/`
**Frontend:** Uses `/api/community/challenges/`  
**Backend:** File suggests `/api/challenges/` but frontend works  
**Fix:** Verify backend router registration; consider standardizing to one path

**Affected Functions:**
- All functions in `src/api/challenges.ts`

**File:** `src/api/challenges.ts` vs `dotlive-backend/apps/api/src/routes/challenges.ts`

---

## Completely Uncovered Features (NO FRONTEND)

### 🟢 FEED SYSTEM (9 endpoints)
**Backend File:** `feed.ts`  
**Status:** Backend implemented, zero frontend  
**Endpoints Missing:**
- GET `/api/feed` - List posts
- POST `/api/feed` - Create post
- GET `/api/feed/posts/:id` - Get post
- POST `/api/feed/:id/like` - Like post
- POST `/api/feed/:id/bookmark` - Bookmark post
- GET `/api/feed/:id/comments` - Get comments
- POST `/api/feed/:id/comments` - Create comment
- DELETE `/api/feed/:id` - Delete post
- GET `/api/feed/trending-tags` - Trending tags

**Priority:** HIGH - Major feature gap

---

### 🟢 INVESTOR FEATURES (6 endpoints)
**Backend File:** `investor.ts`  
**Status:** Backend implemented, zero frontend  
**Endpoints Missing:**
- GET `/api/investor/saves` - Get saved ventures
- POST `/api/investor/saves` - Save venture
- DELETE `/api/investor/saves/:founderId` - Unsave
- GET `/api/investor/meetings` - Get investor meetings
- POST `/api/investor/meetings` - Create meeting
- PATCH `/api/investor/meetings/:id` - Update meeting

**Priority:** HIGH - Core investor functionality

---

### 🟢 MARKETPLACE ORDER WORKFLOWS (5 endpoints)
**Backend File:** `marketplace.ts`  
**Status:** Basic listing works, order actions missing  
**Endpoints Missing:**
- PATCH `/api/orders/:id/deliver` - Mark delivered
- PATCH `/api/orders/:id/complete` - Complete order
- PATCH `/api/orders/:id/cancel` - Cancel order
- POST `/api/orders/:id/dispute` - Create dispute
- POST `/api/orders/:id/review` - Leave review

**Priority:** HIGH - Critical for marketplace UX

---

### 🟢 DEMO EVENTS & VOTING (10 endpoints)
**Backend File:** `demo-events.ts`  
**Status:** Backend complete, zero frontend  
**Endpoints Missing:**
- GET `/api/demo/events` - List events
- GET `/api/demo/events/:slug` - Get event
- POST `/api/demo/events` - Create event (admin)
- PUT `/api/demo/events/:slug` - Update event (admin)
- POST `/api/votes` - Cast vote
- GET `/api/votes/venture/:id/count` - Vote counts
- GET `/api/votes/:eventSlug/leaderboard` - Vote leaderboard
- GET `/api/votes/me` - My votes
- DELETE `/api/votes/:id` - Delete vote

**Priority:** MEDIUM - Feature not actively used

---

### 🟢 AUTHENTICATION - Magic Links & Resets (5 endpoints)
**Backend File:** `magic-link.ts`, `extras.ts`  
**Status:** Backend implemented, zero frontend  
**Endpoints Missing:**
- POST `/api/auth/send-magic-link` - Send link
- POST `/api/auth/verify-magic-link` - Verify link
- POST `/api/auth/forgot-password` - Request reset
- POST `/api/auth/reset-password` - Complete reset
- GET `/api/auth/google` - Google OAuth (handled by redirect)

**Priority:** MEDIUM - Alternative auth methods

---

### 🟢 ADMIN FEATURES (4 endpoints)
**Backend File:** `admin.ts`, `admin-tools.ts`  
**Status:** Most admin covered, some gaps  
**Endpoints Missing:**
- GET `/api/admin/token-ops` - Token operation log
- POST `/api/admin/wallet/transfer` - Admin wallet transfer
- POST `/api/admin/run-migration` - Run migrations
- POST `/api/admin/users/:id/impersonate` - Impersonate user

**Priority:** LOW - Admin-only, non-critical

---

### 🟢 VOUCHING SYSTEM (10+ endpoints)
**Backend File:** `vouches.ts`  
**Status:** Backend complete, zero frontend  
**Note:** No API client exists at all for this feature

**Priority:** MEDIUM - Feature exists but not exposed

---

### 🟢 COMMUNITY FEATURES (3 endpoints)
**Backend File:** `community.ts`  
**Status:** Basic features work, advanced features missing  
**Endpoints Missing:**
- GET `/api/communities/:id` - Get single community
- GET `/api/communities/:id/dashboard` - Community dashboard
- GET `/api/communities/:id/hub` - Community hub view

**Priority:** MEDIUM - Nice-to-have features

---

## Response Format Inconsistencies (Standards Issues)

### Standard Pattern (MOST endpoints) ✅
```javascript
// Request
GET /api/users/me

// Response (CORRECT)
{
  user: { id: "123", name: "John", ... }
}
```

### Deviation Pattern (8 endpoints) ⚠️
These endpoints return direct objects instead of wrapped:
- `GET /api/wallet` → Returns `{ balance, stakedBalance, ... }` directly
- `GET /api/wizard` → Returns `{ completed, lastStep, ... }` directly
- `GET /api/loans/requests/:id` → Returns `{ ...loanRequest }` directly
- `GET /api/wallet/transactions` → Returns direct object
- `GET /api/wallet/withdrawals` → Returns array directly
- `GET /api/meetings/slots` → Returns array directly
- `GET /api/meetings` → Sometimes returns object, sometimes array
- Some marketplace endpoints return direct objects

**Impact:** Frontend inconsistently handles responses  
**Fix:** Standardize all to wrapped format: `{ key: value }`

---

## Files to Update (Priority Order)

### CRITICAL (Fix Now)
```
1. src/api/stakes.ts
   - Change all /stakes → /api/stakes
   - Update getStakes(), createStake(), unstake(), etc.

2. src/api/meetings.ts
   - Change all /meetings → /api/meetings
   - Update getAvailableSlots(), createSlot(), requestMeeting()

3. src/api/challenges.ts
   - Verify paths are consistent
   - May need path rename in backend
```

### HIGH PRIORITY (Implement)
```
4. NEW FILE: src/api/feed.ts
   - Implement 9 feed endpoints

5. NEW FILE: src/api/investor.ts
   - Implement 6 investor endpoints

6. Update src/api/marketplace.ts
   - Add order workflow endpoints (5 functions)

7. NEW FILE: src/api/voting.ts
   - Implement 10 demo voting endpoints
```

### MEDIUM PRIORITY (Backend-only features)
```
8. NEW FILE: src/api/vouches.ts
   - Implement vouching system (10+ endpoints)

9. Update src/api/auth.ts
   - Add magic link support (2 endpoints)
   - Add password reset support (2 endpoints)

10. Update src/api/admin-tools.ts
    - Add missing admin endpoints (4 functions)
```

---

## Testing Checklist

Before deploying each fix, verify:

- [ ] Path is correct (includes `/api/` prefix where needed)
- [ ] Response wrapping is consistent
- [ ] Authentication requirement is correct
- [ ] Error responses (401, 403, 404) are handled
- [ ] Idempotency headers are sent for write operations
- [ ] Rate limits are respected
- [ ] Frontend type definitions match backend response
- [ ] Integration tests pass

---

## Quick Stats

```
Total Endpoints: 200+
├── Fully Covered: 165 ✅
├── Path Issues: 15 🔴 (3 distinct issues)
├── Missing: 35+ 🟡
└── Admin-only: 10 🟡

Frontend API Files: 29
├── Working: 26 ✅
├── Needs Fix: 1 (challenges.ts) 🟡
└── Needs Update: 2 (stakes.ts, meetings.ts) 🔴

Response Format:
├── Wrapped { key: value }: ~192 ✅
├── Direct object: 8 ⚠️
└── Array only: 2 ⚠️
```

---

**Last Updated:** 2026-01-14  
**Next Review:** After implementing critical fixes
