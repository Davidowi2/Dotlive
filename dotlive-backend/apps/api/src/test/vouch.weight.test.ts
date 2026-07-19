import { describe, it, expect, vi, beforeEach } from "vitest";

const fakeVouchDb: Record<string, any[]> = {
  vouches: [],
  users: [],
  stakes: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              limit(_n: number) {
                const tableName = typeof _table === "string" ? _table : "vouches";
                return Promise.resolve((fakeVouchDb[tableName] ?? []).slice(0, _n));
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
        const name = typeof _table === "string" ? _table : "vouches";
        if (Array.isArray(vals)) {
          (fakeVouchDb[name] ??= []).push(...vals);
        } else {
          (fakeVouchDb[name] ??= []).push(vals);
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

// Vouch weight calculation based on voucher's tier
const TIER_WEIGHTS = {
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 5,
};

function getVoucherTier(voucherId: string): string {
  const stake = fakeVouchDb.stakes.find((s) => s.userId === voucherId);
  if (!stake) return "Bronze";
  
  const amount = stake.amount;
  if (amount >= 1000) return "Platinum";
  if (amount >= 500) return "Gold";
  if (amount >= 100) return "Silver";
  return "Bronze";
}

function calculateVouchWeight(voucherId: string): number {
  const tier = getVoucherTier(voucherId);
  return TIER_WEIGHTS[tier as keyof typeof TIER_WEIGHTS] ?? 1;
}

function calculateTotalVouchWeight(beneficiaryId: string): number {
  const vouches = fakeVouchDb.vouches.filter((v) => v.beneficiaryId === beneficiaryId);
  return vouches.reduce((total, vouch) => total + calculateVouchWeight(vouch.voucherId), 0);
}

describe("Vouch weight calculation", () => {
  beforeEach(() => {
    fakeVouchDb.vouches.length = 0;
    fakeVouchDb.users.length = 0;
    fakeVouchDb.stakes.length = 0;
  });

  it("Bronze tier voucher has weight 1", () => {
    // No stake = Bronze
    expect(calculateVouchWeight("user-no-stake")).toBe(1);
  });

  it("Silver tier voucher has weight 2", () => {
    fakeVouchDb.stakes.push({ userId: "voucher-1", amount: 150 });

    expect(calculateVouchWeight("voucher-1")).toBe(2);
  });

  it("Gold tier voucher has weight 3", () => {
    fakeVouchDb.stakes.push({ userId: "voucher-2", amount: 600 });

    expect(calculateVouchWeight("voucher-2")).toBe(3);
  });

  it("Platinum tier voucher has weight 5", () => {
    fakeVouchDb.stakes.push({ userId: "voucher-3", amount: 1500 });

    expect(calculateVouchWeight("voucher-3")).toBe(5);
  });

  it("calculates total vouch weight for beneficiary", () => {
    // Set up vouches
    fakeVouchDb.vouches.push({ id: "v1", voucherId: "voucher-silver", beneficiaryId: "user-1" });
    fakeVouchDb.vouches.push({ id: "v2", voucherId: "voucher-gold", beneficiaryId: "user-1" });
    fakeVouchDb.vouches.push({ id: "v3", voucherId: "voucher-platinum", beneficiaryId: "user-1" });

    // Set up stakes for vouched users
    fakeVouchDb.stakes.push({ userId: "voucher-silver", amount: 150 }); // Silver = 2
    fakeVouchDb.stakes.push({ userId: "voucher-gold", amount: 600 }); // Gold = 3
    fakeVouchDb.stakes.push({ userId: "voucher-platinum", amount: 1200 }); // Platinum = 5

    const totalWeight = calculateTotalVouchWeight("user-1");

    expect(totalWeight).toBe(10); // 2 + 3 + 5
  });

  it("multiple vouches from same tier accumulate weight", () => {
    fakeVouchDb.stakes.push({ userId: "voucher-bronze", amount: 50 });
    fakeVouchDb.stakes.push({ userId: "voucher-bronze-2", amount: 80 });

    fakeVouchDb.vouches.push({ voucherId: "voucher-bronze", beneficiaryId: "user-2" });
    fakeVouchDb.vouches.push({ voucherId: "voucher-bronze-2", beneficiaryId: "user-2" });

    const totalWeight = calculateTotalVouchWeight("user-2");

    expect(totalWeight).toBe(2); // 1 + 1
  });
});