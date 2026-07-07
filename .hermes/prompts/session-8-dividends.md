# DOT Platform — Dividends Implementation

**Session 8 Prompt — Focus: Dividend Distribution System**

---

## What are Dividends?

Dividends are periodic profit sharing from ventures to their shareholders:
- Ventures can declare dividends (quarterly)
- Dividends distributed proportionally to share ownership
- Investors see dividend income in their portfolio
- History of all dividend payments

---

## Current State

Check these files BEFORE writing any code:

1. **Investments table**: Check schema for existing investment/shares tables
2. **Portfolio page**: `src/routes/_authenticated/portfolio.tsx`
3. **Backend**: Check if dividends-related tables exist

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// dividends table
export const dividends = pgTable("dividends", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  declaredBy: uuid("declared_by").notNull().references(() => users.id),
  amountNaira: integer("amount_naira").notNull(), // Total dividend pool
  perShareAmount: integer("per_share_amount").notNull(), // ₦ per share
  period: text("period").notNull(), // e.g., "Q1 2026", "Q2 2026"
  status: text("status").default("declared"), // declared, paid, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});

// dividend_payments table - tracks who got what
export const dividendPayments = pgTable("dividend_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  dividendId: uuid("dividend_id").notNull().references(() => dividends.id),
  investorId: uuid("investor_id").notNull().references(() => users.id),
  investmentId: uuid("investment_id").notNull().references(() => investments.id),
  sharesOwned: integer("shares_owned").notNull(),
  amountNaira: integer("amount_naira").notNull(),
  status: text("status").default("pending"), // pending, paid, failed
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
});
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/dividends.ts`:

```typescript
// GET /api/dividends - list all dividends (for investors/ventures)
// GET /api/dividends/venture/:id - dividends for a venture
// GET /api/dividends/my - dividends earned by current user
// POST /api/dividends - declare dividend (venture owner only)
// POST /api/dividends/:id/pay - mark as paid (simulate payment)
```

### 3. Frontend Hook

Create `src/hooks/use-dividends.ts`:

```typescript
// useDividends(ventureId?) - list dividends
// useMyDividends() - dividends earned
// useDeclareDividend(ventureId) - declare new dividend
```

### 4. Dividend Declaration (Venture Side)

Add to `src/routes/_authenticated/ventures.tsx`:

```
- "Declare Dividend" button
- Form: Amount (Naira), Period (dropdown: Q1 2026, etc.)
- Preview: shows per-share amount based on total shares
- Confirm -> creates dividend declaration
```

### 5. Portfolio Dividend View

Update `src/routes/_authenticated/portfolio.tsx`:

- Add "Dividends" section showing:
  - Total dividends earned (all time)
  - List of dividend payments:
    - Venture name
    - Period
    - Shares owned
    - Amount received
    - Date

---

## Math

```typescript
// perShareAmount = totalDividendPool / totalSharesOutstanding
// investorShare = sharesOwned × perShareAmount
```

---

## Design Guidelines

- Use existing Card, Table components
- Show dividend history chronologically
- Format currency with ₦ prefix
- Use green for positive amounts

---

## Testing

1. Declare dividend as venture owner
2. View dividend in portfolio
3. Check per-share calculation

---

## IMPORTANT

- DO NOT implement actual payment processing
- Use simple "mark as paid" status
- Build must pass before commit