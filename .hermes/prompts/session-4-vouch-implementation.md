# DOT Platform — Vouch Primitive Implementation

**Session 4 Prompt — Focus: Vouch System**

---

## What is the Vouch Primitive?

Vouching is how builders and founders prove each other's credibility. It's a core trust signal on DOT:

- **Who can vouch:** Any user (Builder, Founder, Capital Partner)
- **Who gets vouched:** Other users in the system
- **Vouch value:** `min(voucher_vantage_score, 200) × scope_multiplier`
  - Founder voucher: 1.0x
  - Builder voucher: 0.8x
  - Capital Partner voucher: 0.6x
- **Vouch decay:** 1% every 30 days (so a 100-point vouch is worth 99 after 30 days, 98 after 60 days, etc.)
- **Vouch affects Vantage:** Vouch score is a component in the Vantage calculation

---

## Technical Scope

You need to implement:

### 1. Database Schema (drizzle)

**New table: `user_vouches`**
```typescript
// src/lib/db/schema.ts — ADD THIS TABLE
export const userVouches = pgTable('user_vouches', {
  id: uuid('id').primaryKey().defaultRandom(),
  voucherId: uuid('voucher_id').notNull().references(() => users.id),
  voucheeId: uuid('vouchee_id').notNull().references(() => users.id),
  scope: text('scope').notNull(), // 'builder' | 'founder' | 'capital'
  score: integer('score').notNull(), // The vouch score (post-multiplier)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type for insert/select
export type UserVouch = typeof userVouches.$inferSelect;
export type NewUserVouch = typeof userVouches.$inferInsert;
```

**Indexes needed:**
- `idx_user_vouches_voucher` on `voucher_id`
- `idx_user_vouches_vouchee` on `vouchee_id`
- Unique constraint: one vouch per (voucher, vouchee) pair — a user can only vouch another once

---

### 2. Backend API Routes

**POST /api/vouches**
- Create a new vouch
- Body: `{ voucheeId: string, scope: "builder" | "founder" | "capital" }`
- Validation:
  - Cannot vouch yourself
  - Cannot vouch the same user twice (return 409 Conflict if exists)
  - Voucher must have a Vantage score to vouch
- Response: `{ id, voucheeId, scope, score, createdAt }`

**GET /api/vouches/received/:userId**
- Get all vouches received by a user
- Response: `{ vouches: Array<{ id, voucherId, scope, score, createdAt }> }`

**GET /api/vouches/given/:userId**
- Get all vouches given by a user
- Response: `{ vouches: Array<{ id, voucheeId, scope, score, createdAt }> }`

**DELETE /api/vouches/:id**
- Revoke a vouch (soft delete or hard delete - pick one and be consistent)

---

### 3. Frontend Hook

**New hook: `useVouches(userId)`**
```typescript
// src/hooks/use-vouches.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useVouches(userId: string) {
  return useQuery({
    queryKey: ['vouches', 'received', userId],
    queryFn: () => api.get(`/api/vouches/received/${userId}`).then(r => r.vouches),
    enabled: !!userId,
  });
}

export function useGivenVouches(userId: string) {
  return useQuery({
    queryKey: ['vouches', 'given', userId],
    queryFn: () => api.get(`/api/vouches/given/${userId}`).then(r => r.vouches),
    enabled: !!userId,
  });
}
```

---

### 4. UI Components

**VouchButton** — A button to vouch a user
- Shows on profile pages, team member cards, founder profiles
- States: "Vouch" (not vouched), "Vouched ✓" (already vouched), disabled (cannot vouch self)
- On click: opens a dialog to select scope (Builder/Founder/Capital) and confirm
- After vouch: optimistically updates UI, shows success toast

**VouchDisplay** — Shows vouch count and score
- Format: "12 vouches · 2,340 points"
- Located on: Profile page, Venture team section
- Breakdown tooltip: shows individual vouchers and their scores

**VouchList** — Shows who vouched whom
- Used on: Profile page "Vouched by" section
- Shows: avatar, name, scope badge, score, date

---

### 5. Vantage Integration

The Vouch score must flow into the Vantage calculation. Update `computeVantage` in `src/lib/vantage.ts`:

```typescript
// Vouch component: sum of (vouch_score × decay_factor)
// decay_factor = Math.pow(0.99, days_since_created / 30)
function computeVouchComponent(vouches: UserVouch[]): number {
  const now = new Date();
  let total = 0;
  for (const vouch of vouches) {
    const days = (now.getTime() - new Date(vouch.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const decayFactor = Math.pow(0.99, days / 30);
    total += vouch.score * decayFactor;
  }
  return Math.min(total, 500); // Cap at 500 points from vouches
}
```

Add this to the overall Vantage score (alongside assessment, stakes, etc.)

---

## Key Constraints & Rules

1. **One vouch per pair:** A user can only vouch another user once. Attempting to vouch twice returns 409.
2. **No self-vouch:** Cannot vouch yourself.
3. **Scope matters:** The vouch score is multiplied by scope (1.0 founder, 0.8 builder, 0.6 capital).
4. **Decay:** Vouch value decreases 1% every 30 days.
5. **Vantage cap:** Vouch component maxes at 500 points in the Vantage calculation.
6. **Real queries only:** All Vantage calculations must query real data from the database, not hardcoded values.
7. **Empty state:** If a user has no vouches, show honest empty state like "No vouches yet. Build credibility by collaborating on ventures."

---

## Files You May Need to Modify

- `dotlive-backend/apps/api/src/routes/vouches.ts` — NEW API routes
- `src/lib/db/schema.ts` — ADD userVouches table
- `src/hooks/use-vouches.ts` — NEW hook
- `src/lib/vantage.ts` — UPDATE computeVantage
- `src/routes/_authenticated/profile.$id.tsx` — ADD VouchButton, VouchDisplay
- `src/components/vouch/` — NEW components directory

---

## Verification Steps

After implementing, verify in browser:

1. **Create a vouch:**
   - Go to a user's profile page
   - Click "Vouch" button
   - Select scope (Founder/Builder/Capital)
   - Confirm
   - Should see success toast and "Vouched ✓" state

2. **View received vouches:**
   - Go to your profile
   - See VouchDisplay showing count and score
   - Hover tooltip shows breakdown

3. **Check Vantage update:**
   - After receiving a vouch, your Vantage score should increase
   - The increase should reflect: `min(voucher_vantage, 200) × scope_multiplier × decay_factor`

4. **Edge cases:**
   - Try to vouch yourself → should be disabled
   - Try to vouch same user twice → should show error
   - View user with no vouches → should show empty state

---

## Build & Commit

1. Run `npm run build` — must pass
2. Run `npm run db:push` or `npm run db:migrate` — must apply schema
3. Commit with message: `feat(vouch): implement vouch primitive with decay and scope multipliers`

---

## What NOT to Do

- Do NOT hardcode vouch scores
- Do NOT skip the decay calculation
- Do NOT forget the scope multipliers
- Do NOT allow duplicate vouches (same voucher + vouchee)
- Do NOT use fake data for Vantage calculations
- Do NOT skip empty states

---

Start by checking the existing schema and Vantage code to understand the current structure. Then build incrementally: schema → API → hook → UI → Vantage integration.