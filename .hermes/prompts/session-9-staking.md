# DOT Platform — Staking APY Implementation

**Session 9 Prompt — Focus: Staking System with APY**

---

## What is Staking?

DOT's staking system allows users to stake DOT tokens for yield:
- 12% APY (annual percentage yield)
- 14-day cooldown period after unstaking
- Manual claim of staking rewards
- Staking increases Vantage score

---

## Current State

Check these files BEFORE writing any code:

1. **Wallet page**: `src/routes/_authenticated/wallet.tsx` or `src/routes/_authenticated/stakes.tsx`
2. **Stakes hook**: `src/hooks/use-stakes.ts` (may already exist)
3. **Backend schema**: Check for `stakes` or `staking` table

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// stakes table
export const stakes = pgTable("stakes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // DOT staked (store as cents/kobo)
  rewardClaimed: integer("reward_claimed").default(0), // Total rewards claimed
  rewardPending: integer("reward_pending").default(0), // Accumulated but not claimed
  status: text("status").default("active"), // active, unbonding, claimed
  stakedAt: timestamp("staked_at").defaultNow(),
  unbondedAt: timestamp("unbonded_at"), // When cooldown started
  claimedAt: timestamp("claimed_at"),
});

// Optional: stake_history for APY calculation audit
export const stakeHistory = pgTable("stake_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  stakeId: uuid("stake_id").notNull().references(() => stakes.id),
  action: text("action").notNull(), // stake, reward_claimed, unbond, complete_unbond
  amount: integer("amount"),
  rewardAmount: integer("reward_amount"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/stakes.ts`:

```typescript
// GET /api/stakes - user's stakes
// Returns: { stakes: [...], totalStaked, pendingRewards }

// POST /api/stakes - stake DOT
// Body: { amount }
// Returns: { stake }

// POST /api/stakes/:id/unbond - start 14-day cooldown
// Returns: { stake, unbondedAt }

// POST /api/stakes/:id/claim - claim pending rewards
// Returns: { claimedAmount, stake }

// POST /api/stakes/:id/withdraw - withdraw after cooldown
// Only allowed after 14 days from unbondedAt
// Returns: { stake }
```

### 3. Frontend Hook

Create or update `src/hooks/use-stakes.ts`:

```typescript
// useStakes() - user's stakes
// useStake(amount) - stake DOT
// useUnbond(stakeId) - start cooldown
// useClaim(stakeId) - claim rewards
// useWithdraw(stakeId) - withdraw after cooldown

// Helper: calculatePendingRewards(stake) -> based on 12% APY
```

### 4. Staking UI

Update `src/routes/_authenticated/stakes.tsx` (or wallet):

```
- Current staked amount display
- 12% APY badge
- "Stake More" button -> opens stake modal
- Active stakes list:
  - Amount staked
  - Pending rewards (12% APY calculated)
  - "Claim" button (if rewards > 0)
  - "Unstake" button -> starts 14-day cooldown
- Unbonding stakes list (with countdown)
- Total pending rewards
- Total claimed rewards
```

### 5. APY Calculation

```typescript
// 12% APY = 1% per month (approximately)
// Simple: pendingReward = stakedAmount * 0.12 * (daysStaked / 365)
// Compound daily for accuracy

// Cooldown: 14 days after unbond
// During cooldown: no more APY accruing
```

---

## Design Guidelines

- Use Card, Button components
- Show clear countdown for unbonding period
- Display APY prominently (12%)
- Use green for rewards
- Format DOT amounts with proper decimals

---

## Testing

1. Stake DOT -> see in active stakes
2. Wait/calculate -> see pending rewards accruing
3. Claim rewards -> see balance increase
4. Unbond -> see 14-day countdown
5. Withdraw after cooldown -> see DOT returned

---

## IMPORTANT

- DO NOT implement actual token staking on-chain
- Use database to track stake (simulation)
- 14-day cooldown is fixed, not configurable
- Build must pass before commit