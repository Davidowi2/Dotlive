# DOT Platform — Loan Panel Implementation

**Session 7 Prompt — Focus: Loan Marketplace with Voting**

---

## What is the Loan Panel?

DOT allows capital partners to offer loans to ventures. The loan panel is a marketplace where:
- Ventures can request loans (3/6/12 month terms)
- Capital partners can offer loan terms
- Loan voting: capital partners vote on loan requests
- 60% quorum required for approval
- 7-day auto-escalation if not voted
- 2%/month interest (24% APR)

---

## Current State

Check these files BEFORE writing any code:

1. **Venture page**: `src/routes/_authenticated/ventures.tsx`
   - Look for existing "Loan" or "Funding" section

2. **Backend schema**: Check for `loans` table in schema.ts
   - Check existing loan-related tables

3. **Capital partner portal**: `src/routes/_authenticated/investor.tsx` or similar

---

## Requirements

### 1. Database Schema

Add to `dotlive-backend/apps/api/src/db/schema.ts`:

```typescript
// loan_requests table
export const loanRequests = pgTable("loan_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  amountNaira: integer("amount_naira").notNull(),
  termMonths: integer("term_months").notNull(), // 3, 6, or 12
  purpose: text("purpose"),
  status: text("status").default("pending"), // pending, voting, approved, rejected, funded
  createdAt: timestamp("created_at").defaultNow(),
  votingEndsAt: timestamp("voting_ends_at"),
});

// loan_votes table
export const loanVotes = pgTable("loan_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanRequestId: uuid("loan_request_id").notNull().references(() => loanRequests.id),
  voterId: uuid("voter_id").notNull().references(() => users.id),
  vote: boolean("vote").notNull(), // true = approve, false = reject
  amountNaira: integer("amount_naira"), // How much they're willing to fund
  votedAt: timestamp("voted_at").defaultNow(),
});

// loans table (disbursed)
export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanRequestId: uuid("loan_request_id").references(() => loanRequests.id),
  ventureId: uuid("venture_id").notNull().references(() => ventures.id),
  amountNaira: integer("amount_naira").notNull(),
  termMonths: integer("term_months").notNull(),
  interestRate: numeric("interest_rate").default("0.02"), // 2% per month
  status: text("status").default("active"), // active, paid_off, default
  fundedBy: uuid("funded_by").notNull().references(() => users.id), // Capital partner
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. API Routes

Create `dotlive-backend/apps/api/src/routes/loans.ts`:

```typescript
// GET /api/loans/requests - list loan requests
// Query: ?status=pending|voting|approved|rejected&limit=20

// GET /api/loans/requests/:id - single request with votes

// POST /api/loans/requests - create loan request
// Body: { ventureId, amountNaira, termMonths, purpose }

// POST /api/loans/requests/:id/vote - vote on loan
// Body: { vote: boolean, amountNaired?: number }

// GET /api/loans/my-loans - loans for current user (as borrower or lender)

// POST /api/loans/:id/pay - record payment
```

### 3. Frontend Hook

Create `src/hooks/use-loans.ts`:

```typescript
// useLoanRequests(status, options)
// useLoanRequest(id)
// useCreateLoanRequest()
// useVoteOnLoan(loanId)
// useMyLoans()
```

### 4. Loan Request Form (Venture Side)

Add to `src/routes/_authenticated/ventures.tsx` or create modal:

```
- Amount input (Naira)
- Term selector: 3 months | 6 months | 12 months
- Purpose textarea
- Submit -> creates loan request
```

### 5. Loan Voting Panel (Capital Partner Side)

Create `src/routes/_authenticated/loans.tsx` or add to investor portal:

```
- List of pending loan requests
- Each shows: venture name, amount, term, purpose
- Voting buttons: Approve / Reject
- Amount willing to fund input
- Progress bar: X% of quorum reached
- Status badge: Voting in progress / Approved / Rejected
```

### 6. Voting Logic

```typescript
// Quorum: 60% of capital partners must vote
// Approval: Plurality of votes (more approve than reject)
// Auto-escalation: If not resolved in 7 days, escalate to admin
// Interest: 2% per month (24% APR)
```

---

## Design Guidelines

- Use existing Card, Button, Progress components
- Show voting progress clearly
- Display loan terms prominently (amount, term, interest)
- Color coding: green (approved), red (rejected), yellow (voting)

---

## Testing

1. Create loan request as founder
2. View pending requests as capital partner
3. Vote on loan request
4. Verify quorum calculation
5. Check loan appears in portfolio

---

## IMPORTANT

- DO NOT implement actual payment disbursement
- DO NOT create complex amortization calculations
- Use simple 2%/month flat interest
- Build must pass before commit
- Test account: browserverify@test.com