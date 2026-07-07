# DOT Platform — Buy Shares Flow Implementation

**Session 6 Prompt — Focus: Buy Shares / Investment Flow**

---

## What is Buy Shares?

This is the investment flow where investors buy shares in ventures on DOT:
- Investor views a venture's public profile
- Clicks "Buy Shares" to open investment modal
- Enters amount in Naira
- System calculates shares based on current valuation
- Investor confirms and pays
- Shares appear in investor's portfolio
- Venture sees updated cap table

---

## Current State

Check these files BEFORE writing any code:

1. **Venture profile**: `src/routes/founder.$id.tsx`
   - Look for existing "Buy Shares" or "Invest" button
   - Check if ShareOfferStrip component exists

2. **Portfolio page**: `src/routes/_authenticated/portfolio.tsx`
   - Check how investments are displayed

3. **Backend schema**: Check for `investments` or `shares` table in schema.ts
   - Check for `ventures` table (for valuation)

4. **API routes**: Look for existing investment/share endpoints

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// investments table
export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  investorId: uuid("investor_id").notNull().references(() => users.id),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  amountNaira: integer("amount_naira").notNull(), // Investment amount
  sharesBought: integer("shares_bought").notNull(), // Calculated shares
  pricePerShare: integer("price_per_share").notNull(), // At time of investment
  status: text("status").default("completed"), // "completed", "pending", "failed"
  createdAt: timestamp("created_at").defaultNow(),
});

// ventures table update - add share price
// Add: currentSharePrice: integer("current_share_price")
// Add: totalShares: integer("total_shares")
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/investments.ts`:

```typescript
// GET /api/investments - list user's investments
// Returns: { investments: [...] }

// GET /api/investments/:ventureId/calculate?amountNaira=50000
// Returns: { sharesBought, pricePerShare, totalValue }

// POST /api/investments - create investment
// Body: { ventureId, amountNaira }
// Returns: { investment, sharesBought }

// GET /api/ventures/:id/cap-table - who owns what
```

### 3. Frontend Hook

Create `src/hooks/use-investments.ts`:

```typescript
// useInvestments() - list user's investments
// useCalculateShares(ventureId, amountNaira)
// useCreateInvestment(ventureId, amountNaira)
```

### 4. Investment Modal

Create `src/components/invest/InvestmentModal.tsx`:

```
- Opens from venture profile "Buy Shares" button
- Shows venture name and current share price
- Input: Amount in Naira (min ₦10,000)
- Shows calculated shares in real-time as user types
- "Buy Shares" CTA button
- Success state: "You now own X shares in [Venture]"
```

### 5. Portfolio Update

Update `src/routes/_authenticated/portfolio.tsx`:

- Add "Investments" section showing:
  - Venture name
  - Shares owned
  - Current value (shares × current price)
  - ROI percentage (if price changed)

### 6. Venture Profile Update

Update `src/routes/founder.$id.tsx`:

- Add "Buy Shares" button if not present
- Link opens InvestmentModal
- Show current share price if venture has raised

---

## Share Price Math

```typescript
// Simple model: valuation / totalShares = pricePerShare
// Example: ₦10M valuation / 1M shares = ₦10 per share
// ₦50,000 investment / ₦10 = 5,000 shares

// Store price at time of investment for ROI calculation
```

---

## Design Guidelines

- Use existing Modal/Dialog component
- Input should be number with Naira formatting (₦ prefix)
- Show loading state during calculation
- Success should link to portfolio
- Error handling for insufficient funds, venture not found

---

## Testing

1. Go to a venture profile - click "Buy Shares"
2. Enter amount - see shares calculated
3. Submit - see success
4. Go to portfolio - see investment listed

---

## IMPORTANT

- DO NOT implement actual payment processing (Stripe, etc.)
- DO NOT create complex cap table calculations
- Use simple share price model (valuation/shares)
- Build must pass before commit
- Test with test account: browserverify@test.com