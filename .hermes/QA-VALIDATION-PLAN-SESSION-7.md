# QA Validation Plan - Session 7: Schema Mismatch Fixes

**Date**: July 9, 2026  
**Phase**: POST-DEPLOYMENT VERIFICATION  
**Status**: 🟡 IN PROGRESS

---

## Overview

This document outlines the comprehensive QA validation plan for the critical schema mismatch fixes deployed in commit `3ad56f1`. 

**5 Critical Bugs Fixed**:
1. ✅ Payments: Missing `createdAt`
2. ✅ Withdrawals: Missing `updatedAt`
3. ✅ Dividends: Missing `createdAt` (2 locations)
4. ✅ Marketplace Orders: Missing `updatedAt`
5. ✅ Feed Comments: Missing `author_dot_id`, `author_role`

---

## Deployment Timeline

| Event | Time | Status |
|-------|------|--------|
| Fixes committed | 21:30 UTC | ✅ Done |
| Pushed to main | 21:35 UTC | ✅ Done |
| Render build starts | 21:36 UTC | ⏳ In progress |
| Expected live | 21:45 UTC | ⏳ Pending |
| QA testing begins | 21:50 UTC | 📋 Ready |

---

## Pre-Testing Checklist

### Environment Verification
- [ ] Render dashboard accessible: https://dashboard.render.com/services/dotlive-api
- [ ] Build status shows green (completed successfully)
- [ ] API is responding to health check
- [ ] Database connection verified
- [ ] logs showing no connection errors

### Code Verification
- [ ] Commit `3ad56f1` visible in Render logs
- [ ] All 5 files changed (payments, withdrawals, dividends, marketplace, feed)
- [ ] No TypeScript compilation errors in logs
- [ ] No database migration errors

---

## Testing Phase 1: API Health & Connectivity

### 1.1 Health Check Endpoint
**Endpoint**: `GET /api/health`  
**Expected Status**: 200 OK

```bash
curl -X GET https://dotlive-api.onrender.com/api/health

# Expected response:
{
  "ok": true,
  "service": "dotlive-api",
  "env": "production",
  "checks": {
    "database": { "ok": true },
    "jwt": { "ok": true },
    ...
  }
}
```

**Pass Criteria**:
- [ ] Response status 200
- [ ] database check returns ok: true
- [ ] All checks pass

### 1.2 Database Connectivity
**Check**: Render logs for database connection messages

```
Expected:
- "Connected to PostgreSQL"
- "Database migrations running" (or "Migrations complete")
- No connection timeout errors
- No "ECONNREFUSED" errors
```

**Pass Criteria**:
- [ ] No database connection errors in logs
- [ ] API responding normally
- [ ] No "Cannot reach database" messages

---

## Testing Phase 2: Payment Mutations (Payments Route)

### 2.1 Create Deposit Payment
**Endpoint**: `POST /api/payments/initiate-deposit`  
**Auth**: Required (JWT token)  
**Payload**:
```json
{
  "amountDot": 100
}
```

**Expected Response**: 200 OK
```json
{
  "ok": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "dot_..."
}
```

**Database Check**: 
- [ ] New row in `payments` table
- [ ] Fields populated:
  - [ ] userId: correct
  - [ ] dotAmount: 100
  - [ ] nairaAmount: calculated (100 * exchange_rate)
  - [ ] status: "pending"
  - [ ] reference: matching response
  - [ ] **createdAt: NOT NULL (FIXED)**

**Test Steps**:
1. Authenticate as user
2. Submit deposit request (100 DOT)
3. Check API response (should NOT be 500)
4. Verify database record exists with all fields
5. Check logs for any "createdAt is required" errors

**Pass Criteria**:
- [ ] HTTP 200 response (not 500)
- [ ] Payment record created in database
- [ ] createdAt field populated
- [ ] No "column does not exist" errors in logs

---

### 2.2 Webhook Processing
**Simulated Event**: Paystack webhook (payment success)  
**Endpoint**: `POST /api/payments/webhook`  
**Expected Behavior**: Transaction created, user balance updated

**Database Checks**:
- [ ] `transactions` table has new record
- [ ] User wallet balance increased
- [ ] Payment status updated to "confirmed"

**Pass Criteria**:
- [ ] Payment successfully processed
- [ ] User balance reflects deposit
- [ ] No errors in processing

---

## Testing Phase 3: Withdrawal Mutations (Withdrawals Route)

### 3.1 Create Withdrawal Request
**Endpoint**: `POST /api/withdrawals`  
**Auth**: Required  
**Payload**:
```json
{
  "amount": 50,
  "bankInfo": { "accountNumber": "1234567890", "bankCode": "001", ... }
}
```

**Expected Response**: 201 Created
```json
{
  "withdrawal": {
    "id": "uuid",
    "userId": "user_id",
    "amountDot": "50.00",
    "status": "pending",
    ...
  }
}
```

**Database Check**:
- [ ] New row in `withdrawal_requests` table
- [ ] Fields populated:
  - [ ] userId: correct
  - [ ] amountDot: 50.00
  - [ ] amountNgn: calculated
  - [ ] bankInfo: stored
  - [ ] status: "pending"
  - [ ] **updatedAt: NOT NULL (FIXED)**

**Test Steps**:
1. Authenticate as user
2. Submit withdrawal request
3. Check API response (should NOT be 500)
4. Verify database record with all fields
5. Check logs for any "updatedAt is required" errors

**Pass Criteria**:
- [ ] HTTP 201 response (not 500)
- [ ] Withdrawal record created
- [ ] updatedAt field populated
- [ ] No "column does not exist" errors

---

### 3.2 Withdrawal Status Transitions
**Test**: Status changes over time (pending → approved → completed)

**Database Checks**:
- [ ] Initial status: pending
- [ ] After approval: "approved"
- [ ] After completion: "completed"
- [ ] updatedAt changes with each status update

**Pass Criteria**:
- [ ] Status transitions work
- [ ] updatedAt changes on each update
- [ ] No orphaned withdrawal records

---

## Testing Phase 4: Dividend Mutations (Dividends Route)

### 4.1 Declare Dividend
**Endpoint**: `POST /api/dividends`  
**Auth**: Required (founder)  
**Payload**:
```json
{
  "ventureId": "uuid",
  "amountNaira": 500000,
  "period": "2026-Q1"
}
```

**Expected Response**: 201 Created

**Database Checks**:
- [ ] New row in `dividends` table
- [ ] Fields populated:
  - [ ] ventureId: correct
  - [ ] declaredBy: correct user
  - [ ] amountNaira: 500000
  - [ ] status: "declared"
  - [ ] **createdAt: NOT NULL (FIXED)**

**Test Steps**:
1. Authenticate as founder
2. Submit dividend declaration
3. Check response (should NOT be 500)
4. Verify dividend record created
5. Verify all dividend_payments created for investors

**Pass Criteria**:
- [ ] HTTP 201 response (not 500)
- [ ] Dividend record created with createdAt
- [ ] Multiple dividend_payment records created

---

### 4.2 Dividend Payment Distribution
**Database Checks**:
- [ ] `dividend_payments` table populated for each investor
- [ ] Each payment has:
  - [ ] dividendId: correct
  - [ ] investorId: correct
  - [ ] amount: calculated (shares * perShareAmount)
  - [ ] status: "pending"
  - [ ] **createdAt: NOT NULL (FIXED)**

**Pass Criteria**:
- [ ] One payment per investor with shares
- [ ] All payments have createdAt populated
- [ ] No "createdAt is required" errors in logs
- [ ] All amounts calculated correctly

---

### 4.3 Dividend Payment Status Transitions
**Test**: Track dividend payments through payout cycle

**Expected States**:
- pending → processing → completed
- pending → failed → retry_pending

**Pass Criteria**:
- [ ] All transitions recorded in database
- [ ] Each state change logged with timestamp
- [ ] No stuck payments

---

## Testing Phase 5: Marketplace Mutations (Orders)

### 5.1 Create Service Order
**Endpoint**: `POST /api/marketplace/orders`  
**Auth**: Required  
**Payload**:
```json
{
  "serviceId": "uuid",
  "amount": 2500,
  "requirements": "Description of what I need..."
}
```

**Expected Response**: 201 Created

**Database Checks**:
- [ ] New row in `service_orders` table
- [ ] Fields populated:
  - [ ] serviceId: correct
  - [ ] clientId: correct
  - [ ] builderId: from service
  - [ ] amountDot: correct
  - [ ] status: "in_progress"
  - [ ] **updatedAt: NOT NULL (FIXED)**

**Test Steps**:
1. Authenticate as buyer
2. Create order for service
3. Check response (should NOT be 500)
4. Verify order created in database
5. Check wallet locked/escrowed status

**Pass Criteria**:
- [ ] HTTP 201 response (not 500)
- [ ] Order record created with updatedAt
- [ ] Buyer's wallet shows amount as locked/escrowed
- [ ] No "updatedAt is required" errors

---

### 5.2 Order Status Transitions
**Test**: Order lifecycle (in_progress → delivery_pending → completed)

**Database Checks**:
- [ ] Status transitions recorded
- [ ] updatedAt changes on each transition
- [ ] Timestamps record when/who made transitions

**Pass Criteria**:
- [ ] All status changes persist correctly
- [ ] updatedAt reflects latest change
- [ ] No duplicate status entries

---

### 5.3 Order Completion & Payment
**Test**: Complete order and transfer DOT from escrow

**Database Checks**:
- [ ] Order status changes to "completed"
- [ ] Buyer wallet: escrowed amount released
- [ ] Builder wallet: amount credited
- [ ] Transaction record created for builder

**Pass Criteria**:
- [ ] Escrow released successfully
- [ ] Both user balances updated
- [ ] Transaction history reflects transfer

---

## Testing Phase 6: Feed Mutations (Comments)

### 6.1 Create Feed Post Comment
**Endpoint**: `POST /api/feed/:id/comments`  
**Auth**: Required  
**Payload**:
```json
{
  "body": "This is a great opportunity!"
}
```

**Expected Response**: 201 Created

**Database Checks**:
- [ ] New row in `feed_comments` table
- [ ] Fields populated:
  - [ ] id: uuid
  - [ ] postId: correct
  - [ ] authorId: correct user
  - [ ] authorName: user's name
  - [ ] **authorDotId: user's DOT ID (FIXED)**
  - [ ] **authorRole: "builder" or appropriate (FIXED)**
  - [ ] body: comment text
  - [ ] likesCount: 0
  - [ ] createdAt: NOW()

**Test Steps**:
1. Authenticate as user
2. Post comment on feed post
3. Check response (should NOT be 500)
4. Verify comment record with all fields
5. Load feed to verify comment displays correctly

**Pass Criteria**:
- [ ] HTTP 201 response (not 500)
- [ ] Comment record created
- [ ] author_dot_id populated (not null)
- [ ] author_role populated (not null)
- [ ] Comment displays in feed with author info
- [ ] No "column does not exist" errors

---

### 6.2 Comment Display in Feed
**Test**: Fetch feed and verify comment appears with author info

**Check**: GET `/api/feed?tab=latest`

**Expected**:
```json
{
  "posts": [
    {
      "id": "...",
      "comments": [
        {
          "id": "...",
          "body": "This is a great opportunity!",
          "authorName": "John Doe",
          "authorDotId": "john.dot",  // Should not be null
          "authorRole": "builder",     // Should not be null
          ...
        }
      ]
    }
  ]
}
```

**Pass Criteria**:
- [ ] Comments display in feed
- [ ] Author info complete (name, dotId, role)
- [ ] No null values in author fields
- [ ] Comments sorted by date correctly

---

## Testing Phase 7: Regression Testing

### 7.1 Existing Functionality
Test that previous working features still work:

**Authentication**:
- [ ] Login/logout works
- [ ] JWT tokens valid
- [ ] Protected endpoints require auth

**Feed**:
- [ ] Create posts works
- [ ] Like/unlike posts works
- [ ] Bookmark posts works
- [ ] Feed displays correctly

**Ventures**:
- [ ] Create ventures works
- [ ] Edit venture details works
- [ ] Add team members works
- [ ] Add milestones works

**Investments**:
- [ ] Browse available ventures
- [ ] View investment options
- [ ] Buy shares (if fixed)

**Builder Marketplace**:
- [ ] Browse services
- [ ] View builder profiles
- [ ] (Orders creation - tested above)

---

### 7.2 Database Integrity
**Checks**:
- [ ] No orphaned records
- [ ] Foreign key constraints enforced
- [ ] Unique constraints maintained
- [ ] No data corruption

**SQL Queries to Run**:
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM payments WHERE user_id NOT IN (SELECT id FROM users);
SELECT COUNT(*) FROM withdrawal_requests WHERE user_id NOT IN (SELECT id FROM users);
SELECT COUNT(*) FROM dividends WHERE declared_by NOT IN (SELECT id FROM users);
SELECT COUNT(*) FROM service_orders WHERE client_id NOT IN (SELECT id FROM users);
SELECT COUNT(*) FROM feed_comments WHERE author_id NOT IN (SELECT id FROM users);

-- Check for missing timestamps
SELECT COUNT(*) FROM payments WHERE created_at IS NULL;
SELECT COUNT(*) FROM withdrawal_requests WHERE updated_at IS NULL;
SELECT COUNT(*) FROM dividends WHERE created_at IS NULL;
SELECT COUNT(*) FROM dividend_payments WHERE created_at IS NULL;
SELECT COUNT(*) FROM service_orders WHERE updated_at IS NULL;
SELECT COUNT(*) FROM feed_comments WHERE author_dot_id IS NULL AND author_role IS NULL;

-- Check for recent records
SELECT COUNT(*) FROM payments WHERE created_at > NOW() - INTERVAL '1 hour';
SELECT COUNT(*) FROM withdrawal_requests WHERE updated_at > NOW() - INTERVAL '1 hour';
```

**Pass Criteria**:
- [ ] 0 orphaned records
- [ ] 0 missing timestamps
- [ ] No constraint violations

---

## Testing Phase 8: Error Scenarios

### 8.1 Missing Required Fields in Request
**Test**: Send incomplete requests

**Payment with missing amount**:
```json
{}
```

**Expected**: 400 Bad Request with validation error  
**Pass**: HTTP 400, not 500

---

### 8.2 Invalid IDs
**Test**: Use non-existent IDs

**Withdraw with invalid user**:  
**Expected**: 401 Unauthorized or 403 Forbidden  
**Pass**: Not 500

---

### 8.3 Database Constraint Violations
**Test**: Try to violate unique constraints

**Duplicate payment references** (shouldn't be possible if ref is unique):  
**Expected**: 409 Conflict or handled gracefully  
**Pass**: Not 500

---

## Testing Phase 9: Performance & Load

### 9.1 Query Performance
**Test**: Measure database query times for fixed operations

**Baseline**: Each operation should complete in < 500ms

**Operations to Check**:
- [ ] POST /api/payments: < 500ms
- [ ] POST /api/withdrawals: < 500ms
- [ ] POST /api/dividends: < 500ms
- [ ] POST /api/marketplace/orders: < 500ms
- [ ] POST /api/feed/:id/comments: < 500ms

---

### 9.2 Database Connection Pool
**Check**: Monitor Render dashboard for connection issues

**Pass Criteria**:
- [ ] No connection pool exhaustion warnings
- [ ] Database responding normally to all requests
- [ ] No timeout errors

---

## Testing Phase 10: Monitoring & Logs

### 10.1 Error Log Review
**Check**: Render logs for past hour

**Search for**:
- [ ] "column...does not exist" errors → 0
- [ ] "NOT NULL constraint violation" → 0
- [ ] "createdAt" errors → 0
- [ ] "updatedAt" errors → 0
- [ ] "author_dot_id" errors → 0
- [ ] "author_role" errors → 0

**Pass Criteria**:
- [ ] No schema mismatch errors
- [ ] No unhandled database errors
- [ ] All errors have proper error messages

---

### 10.2 Success Metrics
**Dashboard Checks**:
- [ ] API response time: < 200ms (avg)
- [ ] Error rate: < 1%
- [ ] Request volume: normal
- [ ] Database query time: < 100ms (avg)

---

## Rollback Criteria

**ROLLBACK if**:
- [ ] Persistent 500 errors on deposits
- [ ] Persistent 500 errors on withdrawals
- [ ] Persistent 500 errors on dividend declarations
- [ ] Persistent 500 errors on order creation
- [ ] Persistent 500 errors on feed comments
- [ ] Database corruption detected
- [ ] Data loss in user wallets
- [ ] Widespread constraint violations

**Rollback Command**:
```bash
git revert 3ad56f1
git push origin main
# Render auto-deploys within 5-8 minutes
```

---

## Sign-Off

**QA Lead Verification**:
- [ ] All phases completed
- [ ] No critical issues found
- [ ] Regressions verified
- [ ] Performance acceptable
- [ ] Ready for production

**Date**: _______________  
**Tester**: _______________  
**Result**: ⬜ PASS / ⬜ FAIL / ⬜ CONDITIONAL

---

## Notes & Observations

```
[Space for tester notes]
```

---

## Appendix: Quick Reference

### Affected Endpoints
| Endpoint | Method | Table | Fix |
|----------|--------|-------|-----|
| /api/payments/initiate-deposit | POST | payments | createdAt |
| /api/withdrawals | POST | withdrawal_requests | updatedAt |
| /api/dividends | POST | dividends | createdAt |
| /api/dividends (payments) | - | dividend_payments | createdAt |
| /api/marketplace/orders | POST | service_orders | updatedAt |
| /api/feed/:id/comments | POST | feed_comments | author_dot_id, author_role |

### Test Users (if available)
- Founder account: [email]
- Investor account: [email]
- Builder account: [email]

### Important URLs
- API Health: https://dotlive-api.onrender.com/api/health
- Render Dashboard: https://dashboard.render.com/services/dotlive-api
- GitHub Commit: https://github.com/Davidowi2/Dotlive/commit/3ad56f1

---

**Document Version**: 1.0  
**Last Updated**: 2026-07-09  
**Status**: 🟡 IN PROGRESS - Awaiting deployment completion

