# Validation Steps for Critical Bootstrap Migrations Fix

**Status**: Ready for QA Testing  
**Date**: July 9, 2026  
**Issue**: All mutations (POST/PUT/DELETE) returning HTTP 500 due to duplicate/conflicting table schemas

---

## Phase 1: Static Verification ✅ DONE

### TypeScript Compilation
```bash
cd dotlive-backend/apps/api
npx tsc --noEmit
# Expected: Exit Code 0 (no errors)
```

**Result**: ✅ PASS - 0 errors

### Schema Consistency
Verified in `server.ts`:
- ✅ Health check endpoint: No table creation (read-only now)
- ✅ Bootstrap migrations: Single set of tables, no duplicates
- ✅ No conflicting schemas for pitch_decks, dividends, loans, feed_*

---

## Phase 2: Dynamic Verification (To Run)

### Option A: Run Database Schema Tests

```bash
# From workspace root
npm run test -- dotlive-backend/apps/api/src/routes/__tests__/critical-mutations.test.ts
```

**Tests verify:**
- ✅ Pitch decks has correct columns (venture_id, url, NOT user_id/slides)
- ✅ Dividends has correct columns (declared_by, per_share_amount, NOT recipient_id)
- ✅ Loans has correct columns (loan_request_id, venture_id, funded_by)
- ✅ Feed posts has correct schema
- ✅ No duplicate primary keys
- ✅ Required indexes exist

---

## Phase 3: Functional Testing (Manual or E2E)

### Test: Create Pitch Deck
**Endpoint**: `POST /api/pitch-decks`  
**Body**:
```json
{
  "ventureId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My Test Deck",
  "description": "Test pitch deck",
  "url": "https://example.com/deck.pdf"
}
```

**Expected Response**: 
```json
{
  "pitchDeck": {
    "id": "...",
    "ventureId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "My Test Deck",
    "url": "https://example.com/deck.pdf",
    "version": 1,
    "isPublic": false,
    "createdAt": "2026-07-09T...",
    "updatedAt": "2026-07-09T..."
  }
}
```

**Status Code**: 200 (NOT 500)

---

### Test: Update Pitch Deck
**Endpoint**: `PUT /api/pitch-decks/{id}`  
**Body**:
```json
{
  "title": "Updated Title",
  "isPublic": true
}
```

**Expected**: HTTP 200 with updated object

---

### Test: Create Dividend
**Endpoint**: `POST /api/dividends`  
**Body**:
```json
{
  "ventureId": "550e8400-e29b-41d4-a716-446655440000",
  "amountNaira": 100000,
  "period": "Q2 2026"
}
```

**Expected**: HTTP 200 (NOT 500)

---

### Test: Create Feed Post
**Endpoint**: `POST /api/feed` (or similar)  
**Body**:
```json
{
  "type": "general",
  "title": "Test Post",
  "body": "This is a test post",
  "tags": ["test"]
}
```

**Expected**: HTTP 200 with post object

---

### Test: Health Check (No Side Effects)
**Endpoint**: `GET /api/health`  
**Expected**:
```json
{
  "ok": true,
  "service": "dotlive-api",
  "env": "production|development",
  "checks": {
    "database": { "ok": true },
    "jwt": { "ok": true },
    "googleOAuth": { "ok": ... },
    "paystack": { "ok": ... }
  }
}
```

**Verification**: Call this endpoint 100 times - should not affect database

---

## Phase 4: Regression Testing

### Test All Create Operations Still Work
- [ ] POST /api/ventures - Create venture
- [ ] POST /api/auth/signup - User registration
- [ ] POST /api/wallet/spend - Wallet transaction
- [ ] POST /api/vantage/submit - Vantage submission
- [ ] POST /api/academy/enroll - Course enrollment
- [ ] POST /api/communities - Create community
- [ ] POST /api/marketplace/services - Create service
- [ ] POST /api/orders - Create order
- [ ] POST /api/connections - Make connection
- [ ] POST /api/builder-profiles - Create builder profile

**Expected**: No HTTP 500 errors on any create operation

---

## Phase 5: Edge Case Testing

### Test: Database Connection Lost
```bash
# Kill Neon connection or disconnect network
curl https://dotlive-api.onrender.com/api/health
# Expected: HTTP 200 with ok: false, database error message
```

### Test: Rapid Concurrent Mutations
```bash
# Send 10 pitch deck creates simultaneously
for i in {1..10}; do
  curl -X POST https://dotlive-api.onrender.com/api/pitch-decks \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d '{"ventureId":"...", "title":"Deck $i", "url":"https://..."}' &
done
wait
# Expected: All return HTTP 200, no 500 errors
```

---

## Phase 6: Browser Console Validation

### Clear Console Errors
1. Deploy backend to Render
2. Open https://dotlive-web.vercel.app in browser
3. Sign in to account
4. Open DevTools Console (F12)
5. Clear console
6. Try operations:
   - [ ] Create venture
   - [ ] Create pitch deck
   - [ ] Create feed post
   - [ ] Create loan request
   - [ ] Create dividend

**Expected**: 
- ❌ NO "Internal Server Error" messages
- ❌ NO "500" status codes
- ✅ Normal network requests with 200/201 status codes

---

## Phase 7: Performance Check

### Monitor Startup Time
```bash
# Before fix (on main branch)
time curl https://dotlive-api.onrender.com/api/health

# After fix (on audit-fixes-2026-07-09 branch)
time curl https://dotlive-api.onrender.com/api/health

# Expected: No significant difference in startup time
```

### Monitor Health Check Response
Before fix: Health check might slow down due to table creation on every call  
After fix: Health check should be ~100ms (just SELECT 1)

---

## Automated Test Checklist

Run this before each deployment:

```bash
#!/bin/bash
set -e

echo "🔍 Static Analysis..."
cd dotlive-backend/apps/api
npx tsc --noEmit
echo "✅ TypeScript: PASS"

echo ""
echo "🧪 Database Schema Tests..."
npm run test -- src/routes/__tests__/critical-mutations.test.ts
echo "✅ Schema Tests: PASS"

echo ""
echo "🚀 Ready to deploy!"
```

---

## Deployment Checklist

- [ ] All static analysis passes (TypeScript)
- [ ] All schema tests pass
- [ ] All functional tests pass (manual or E2E)
- [ ] No console errors in browser
- [ ] Health check endpoint works and is read-only
- [ ] At least 3 create/update/delete operations tested and working
- [ ] No regression in other API endpoints

**Status**: Ready for production deployment

---

## Rollback Plan

If issues occur after deployment:

1. **Rollback to previous commit**:
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Manually clean database** (if corrupted):
   ```sql
   DROP TABLE IF EXISTS pitch_decks CASCADE;
   DROP TABLE IF EXISTS dividends CASCADE;
   DROP TABLE IF EXISTS loans CASCADE;
   -- Restart server to recreate with correct schema
   ```

3. **Monitor error rates**:
   - Render logs: https://dashboard.render.com/services/dotlive-api
   - Check `/api/health` endpoint
   - Check console errors in browser

---

## Success Criteria

✅ All mutations work without HTTP 500 errors  
✅ Schema is consistent and idempotent  
✅ No regression in other features  
✅ Database connections stable  
✅ Performance unaffected  

**Timeline to Complete**: ~1-2 hours for full verification

---

## Sign-Off

**Verified by**: QA Engineer  
**Date**: [Date of verification]  
**Result**: ✅ PASS / ❌ FAIL  
**Notes**: [Any additional findings or issues]

