import { describe, it, expect, vi, beforeEach } from "vitest";

const fakeLoansDb: Record<string, any[]> = {
  users: [],
  wallets: [],
  loanApplications: [],
  vouches: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              limit(_n: number) {
                const tableName = typeof _table === "string" ? _table : "users";
                return Promise.resolve((fakeLoansDb[tableName] ?? []).slice(0, _n));
              },
            };
          },
        };
      },
    };
  },
  insert(_table: any) {
    return {
      values(vals: any) {
        const name = typeof _table === "string" ? _table : "loanApplications";
        if (Array.isArray(vals)) {
          (fakeLoansDb[name] ??= []).push(...vals);
        } else {
          (fakeLoansDb[name] ??= []).push(vals);
        }
        return {
          returning() {
            if (Array.isArray(vals)) {
              return Promise.resolve(vals);
            }
            return Promise.resolve([vals]);
          },
        };
      },
    };
  },
  execute() {
    return Promise.resolve({ rows: [] });
  },
};

vi.mock("../db/client.js", () => ({
  db: fakeDb,
  sql: { raw: (_s: string) => _s },
  pool: { release() {}, connect() {}, end() {} },
}));

// Loan eligibility rules
interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

function checkLoanEligibility(userId: string, requestedAmount: number): EligibilityResult {
  const reasons: string[] = [];
  
  // Check wallet balance (must have 20% of requested amount)
  const wallet = fakeLoansDb.wallets.find((w) => w.userId === userId);
  const balance = wallet?.balance ?? 0;
  const requiredCollateral = requestedAmount * 0.2;
  
  if (balance < requiredCollateral) {
    reasons.push(`Insufficient collateral: need ${requiredCollateral} DOT, have ${balance} DOT`);
  }
  
  // Check for existing active loans
  const activeLoans = fakeLoansDb.loanApplications.filter(
    (l) => l.userId === userId && l.status === "active"
  );
  if (activeLoans.length > 0) {
    reasons.push("User has an active loan");
  }
  
  // Check minimum vouches required (2 vouches needed)
  const vouches = fakeLoansDb.vouches.filter((v) => v.beneficiaryId === userId);
  if (vouches.length < 2) {
    reasons.push(`Insufficient vouches: need 2, have ${vouches.length}`);
  }
  
  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

describe("Loan eligibility check", () => {
  beforeEach(() => {
    fakeLoansDb.users.length = 0;
    fakeLoansDb.wallets.length = 0;
    fakeLoansDb.loanApplications.length = 0;
    fakeLoansDb.vouches.length = 0;
  });

  it("approves eligibility with sufficient collateral and vouches", () => {
    fakeLoansDb.wallets.push({ userId: "user-1", balance: 200 });
    fakeLoansDb.vouches.push({ id: "v1", beneficiaryId: "user-1" });
    fakeLoansDb.vouches.push({ id: "v2", beneficiaryId: "user-1" });

    const result = checkLoanEligibility("user-1", 1000);

    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("rejects due to insufficient collateral", () => {
    fakeLoansDb.wallets.push({ userId: "user-2", balance: 50 }); // Only 50 DOT, needs 200 for 1000 loan

    const result = checkLoanEligibility("user-2", 1000);

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Insufficient collateral: need 200 DOT, have 50 DOT");
  });

  it("rejects due to active existing loan", () => {
    fakeLoansDb.wallets.push({ userId: "user-3", balance: 500 });
    fakeLoansDb.vouches.push({ id: "v3", beneficiaryId: "user-3" });
    fakeLoansDb.vouches.push({ id: "v4", beneficiaryId: "user-3" });
    fakeLoansDb.loanApplications.push({
      id: "loan-1",
      userId: "user-3",
      status: "active",
      amount: 500,
    });

    const result = checkLoanEligibility("user-3", 1000);

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("User has an active loan");
  });

  it("rejects due to insufficient vouches", () => {
    fakeLoansDb.wallets.push({ userId: "user-4", balance: 500 });
    fakeLoansDb.vouches.push({ id: "v5", beneficiaryId: "user-4" }); // Only 1 vouch

    const result = checkLoanEligibility("user-4", 1000);

    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Insufficient vouches: need 2, have 1");
  });
});