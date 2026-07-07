# Referral System Design

## Architecture Overview

The Referral System enables users to earn rewards for referring others to the DOT platform. It consists of:

- **Backend**: API routes for referral management, status tracking, and reward claiming
- **Database**: Referrals table with foreign keys to users, indexes for performance
- **Frontend**: Dashboard UI for displaying referral code, list, leaderboard, and analytics
- **Notifications**: Integration with existing notification system for milestone events
- **Rewards**: Direct wallet credit system for claiming earned rewards

## Data Model

### referrals Table (Already Exists)

```typescript
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: text("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refereeId: text("referee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: text("referral_code").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "completed" | "rewarded"
  rewardClaimed: boolean("reward_claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
```

### users Table Extensions (Already Exist)

```typescript
export const users = pgTable("users", {
  // ... existing fields ...
  referralCode: text("referral_code").unique(), // Generated per user
  referredBy: text("referred_by"), // Referral code of referrer
  referralCount: integer("referral_count").notNull().default(0),
  referralEarningsDot: numeric("referral_earnings_dot", { precision: 20, scale: 2 }).notNull().default("0"),
});
```

### Referral Status Flow

```
[Sign-up] → pending
  ↓ (when referee reaches Vantage 100)
completed (can claim reward)
  ↓ (when claim button clicked)
rewarded (reward claimed and credited)
```

## API Endpoints

### Referral Stats & List

**GET /api/referrals/my**
- Auth: Authenticated user
- Query: status? (pending|completed|rewarded), limit? (1-100, default 50), offset? (default 0)
- Response: 
  ```json
  {
    "referrer": {
      "id": "uuid",
      "name": "string",
      "code": "ABC123",
      "totalReferrals": 5,
      "completedReferrals": 2,
      "pendingRewards": 10, // DOT from pending completions
      "claimedRewards": 10  // DOT already claimed
    },
    "referrals": [
      {
        "id": "uuid",
        "refereeId": "uuid",
        "refereeName": "string",
        "refereeEmail": "string",
        "vantageScore": 85,
        "status": "pending",
        "rewardClaimed": false,
        "claimedAt": null,
        "createdAt": "2026-07-07T12:00:00Z",
        "completedAt": null
      }
    ],
    "pagination": {
      "total": 5,
      "hasMore": false,
      "limit": 50,
      "offset": 0
    }
  }
  ```

### Leaderboard

**GET /api/referrals/leaderboard**
- Auth: Optional (public data, privacy-filtered)
- Query: limit? (1-100, default 20), offset? (default 0)
- Response:
  ```json
  {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "uuid",
        "userName": "Jane Founder",
        "avatar": "url",
        "totalReferrals": 42,
        "completedReferrals": 35,
        "earnedRewards": 350
      }
    ],
    "userRank": { "rank": 15, "completedReferrals": 8 },
    "pagination": { "total": 200, "hasMore": true, "limit": 20, "offset": 0 }
  }
  ```

### Validate Referral Code

**GET /api/referrals/:code**
- Auth: Public (no auth required)
- Response:
  ```json
  {
    "code": "ABC123",
    "referrerId": "uuid",
    "referrerName": "Jane Founder",
    "isValid": true
  }
  ```
- Returns 404 if code invalid or user deleted

### Claim Reward

**POST /api/referrals/claim/:id**
- Auth: Authenticated user (must be referrer)
- Request body: {}
- Response:
  ```json
  {
    "referralId": "uuid",
    "status": "rewarded",
    "rewardAmount": 10,
    "claimedAt": "2026-07-07T12:00:00Z"
  }
  ```
- Validates:
  - User is referrer of this referral
  - Referral status is "completed"
  - rewardClaimed is false
- Side effects:
  - Update referral: rewardClaimed = true, status = "rewarded", claimedAt = now
  - Add reward to user's wallet.balance (in transactions)
  - Send notification to referrer
  - Return 400 if already claimed
  - Return 403 if not referrer
  - Return 409 if status not "completed"

### Generate Referral Code (Replacement)

**POST /api/referrals/generate**
- Auth: Authenticated user
- Request body: {}
- Response: { "code": "XYZ789", "generatedAt": "2026-07-07T12:00:00Z" }
- Rate limited: max 1 per user per week
- Returns 429 if rate limit exceeded

## Frontend Components

### Routes

**Referral Dashboard** (`src/routes/_authenticated/referrals.tsx`)
- Main entry point
- Tab navigation: My Referrals | Leaderboard

### My Referrals Tab

**Referral Code Section**
- Display referral code in large, monospace font
- "Copy Code" button with clipboard feedback
- "Copy Link" button generates https://dotlive.africa/join?ref=CODE
- "Tooltip" explaining how to share

**Referral Stats Cards**
- Total Referrals
- Pending Referrals (yellow badge)
- Completed Referrals (green badge)
- Pending Rewards (DOT amount)
- Claimed Rewards (DOT amount)

**Referral List**
- Desktop: Table with columns - Name, Email, Vantage, Status, Action
- Mobile: Card layout with stacked information
- Status badges with colors: Pending (yellow), Completed (green), Rewarded (blue)
- "Claim Reward" button for completed unclaimed referrals
- Pagination: 50 per page, with prev/next buttons
- Filter: Status dropdown, Sort by: Date (newest first) / Vantage / Name
- Empty state: "You haven't referred anyone yet. Share your code to start earning."

### Leaderboard Tab

**Leaderboard Table**
- Columns: Rank, Name, Total Referrals, Completed, Earned Rewards
- Desktop: Table layout with sortable headers
- Mobile: Card layout with rank badge
- Current user highlighted with background color/badge
- Search/filter by name (optional)
- Pagination: 20 per page
- Cached/refreshable: "Last updated X minutes ago" with Refresh button

### Dialogs

**Claim Reward Dialog**
- Title: "Claim Reward"
- Message: "Claim 10 DOT from [Referee Name]'s referral?"
- Buttons: Cancel, Confirm
- On confirm: Show loading state, then success message, then update UI

## State Management

### Hooks

**useMyReferrals()**
- Fetches GET /api/referrals/my
- Returns: { referrer, referrals, pagination, isLoading, error, refetch }
- Supports filter params: status, limit, offset
- Caches results for 30 seconds

**useReferralLeaderboard()**
- Fetches GET /api/referrals/leaderboard
- Returns: { leaderboard, userRank, pagination, isLoading, error, refetch }
- Supports pagination params: limit, offset

**useClaimReferral(referralId)**
- Calls POST /api/referrals/claim/:id
- Returns: { isLoading, error, claim, isSuccess }
- On success: Invalidates useMyReferrals cache

**useValidateReferralCode(code)**
- Calls GET /api/referrals/:code
- Returns: { isValid, referrerName, isLoading, error }
- Used during sign-up flow

## Sign-Up Integration

### `/join?ref=CODE` Flow

1. User visits sign-up page with ref parameter
2. Frontend calls `useValidateReferralCode(code)`
3. If valid, display: "Signing up with [Referrer Name]'s code. You'll both earn rewards!"
4. User completes sign-up form
5. On submit, include `referredBy: referralCode` in registration payload
6. Backend creates referral record in referrals table
7. After registration completes, show confirmation: "Great! You're set up with a referral."

## Notification Integration

Notifications sent via existing in-app notification system:

1. **New Referral**: Host receives "Jane joined DOT using your referral code!"
2. **Milestone Reached**: Referrer receives "Jane reached Vantage 100! You earned 10 DOT."
3. **Reward Claimed**: Referrer receives "You claimed 10 DOT from Jane's referral!"

Each notification includes link to /referrals dashboard.

## Performance Considerations

- Referral list queries: <= 500ms (with pagination, 50 per page)
- Leaderboard queries: <= 500ms (cached/indexed)
- Reward claim: <= 1 second (includes wallet transaction)
- Notification send: <= 2 seconds (or queued for retry)
- Code validation: <= 100ms
- Dashboard load: <= 1 second total

## Security Considerations

- Authorization checks: Only referrer can view/claim their referrals
- Self-referral prevention: referrerId != refereeId
- Duplicate referral prevention: Unique constraint on (referrerId, refereeId, referralCode)
- Rate limiting: Max 10 referral sign-ups per day per referrer
- Idempotency: Reward claim checked via rewardClaimed flag
- Input validation: Code format validation, reward amount validation
- Transaction safety: Wallet credit only on successful referral update

## Database Indexes

```sql
CREATE INDEX referrals_referrer_idx ON referrals(referrer_id);
CREATE INDEX referrals_referee_idx ON referrals(referee_id);
CREATE INDEX referrals_code_idx ON referrals(referral_code);
CREATE INDEX referrals_status_idx ON referrals(status);
```

## Future Enhancements

1. Tiered referral rewards (more referrals = higher per-referral bonus)
2. Team referrals (referral groups/organizations)
3. Referral expiration (referral codes expire after X days without completion)
4. Referral campaigns (seasonal bonuses)
5. Email invitations (send referral link directly via email)
6. Mobile app share integration
7. Webhook notifications for referral events
