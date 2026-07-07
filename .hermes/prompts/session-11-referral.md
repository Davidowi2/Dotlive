# DOT Platform — Referral System Implementation

**Session 11 Prompt — Focus: Referral & Earn System**

---

## What is Referral System?

A system to reward users for referring new users to DOT:
- Unique referral codes per user
- Track referrals and their progress
- Reward milestones (when referred user reaches certain Vantage)
- Referral dashboard

---

## Current State

Check these files BEFORE writing any code:

1. **Referral page**: Check `src/routes/_authenticated/referral.tsx` or similar
2. **Backend**: Check for existing referral tables
3. **Current user profile**: Check how referral code is stored

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// referrals table
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: uuid("referrer_id").notNull().references(() => users.id),
  refereeId: uuid("referee_id").notNull().references(() => users.id),
  referralCode: text("referral_code").notNull(),
  status: text("status").default("pending"), // pending, completed, rewarded
  rewardClaimed: boolean("reward_claimed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"), // When referee reached milestone
});

// users table update - add referralCode
// referralCode: text("referral_code").unique()
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/referrals.ts`:

```typescript
// GET /api/referrals/my - user's referral stats
// Returns: { referrer, referrals: [...], totalReferrals, pendingRewards }

// GET /api/referrals/:code - lookup referral by code (for sign up)

// POST /api/referrals/claim/:id - claim referral reward

// GET /api/referrals/leaderboard - top referrers
```

### 3. Frontend Hook

Create `src/hooks/use-referrals.ts`:

```typescript
// useMyReferrals() - referral stats
// useClaimReferral(referralId)
// useReferralLeaderboard()
```

### 4. Referral Dashboard

Update `src/routes/_authenticated/referral.tsx`:

```
- My referral code (big, copyable)
- Total referrals count
- Pending vs completed
- Referral list:
  - Referee name/email
  - Their Vantage score
  - Status (pending/completed)
  - Reward claimed?
- "Copy Link" button - generates referral URL
- Rewards info: what they get when referee reaches milestone
```

### 5. Referral Link Generation

```typescript
// referral URL: https://dotlive.africa/join?ref=CODE
// On sign up, if ref param exists, create referral record
```

---

## Design Guidelines

- Use Card, Badge components
- Show referral code prominently
- Copy button with "Copied!" feedback
- Display rewards clearly

---

## Testing

1. Copy referral code/link
2. New user signs up with ref code
3. See referral in list (pending)
4. Referee reaches milestone
5. See referral marked complete

---

## IMPORTANT

- DO NOT implement automatic reward distribution
- Manual claim for rewards
- Build must pass before commit