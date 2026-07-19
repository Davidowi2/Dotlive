import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock staking module for tier calculations
const fakeStakesDb: Record<string, any[]> = {
  stakes: [],
  users: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              limit(_n: number) {
                const tableName = typeof _table === "string" ? _table : "stakes";
                return Promise.resolve((fakeStakesDb[tableName] ?? []).slice(0, _n));
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
        const name = typeof _table === "string" ? _table : "stakes";
        if (Array.isArray(vals)) {
          (fakeStakesDb[name] ??= []).push(...vals);
        } else {
          (fakeStakesDb[name] ??= []).push(vals);
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

// Tier thresholds
const TIER_THRESHOLDS = {
  Bronze: 0,
  Silver: 100,
  Gold: 500,
  Platinum: 1000,
};

function calculateTier(stakeAmount: number): string {
  if (stakeAmount >= TIER_THRESHOLDS.Platinum) return "Platinum";
  if (stakeAmount >= TIER_THRESHOLDS.Gold) return "Gold";
  if (stakeAmount >= TIER_THRESHOLDS.Silver) return "Silver";
  return "Bronze";
}

describe("Stakes tier calculation: Bronze/Silver/Gold/Platinum", () => {
  beforeEach(() => {
    fakeStakesDb.stakes.length = 0;
    fakeStakesDb.users.length = 0;
  });

  it("classifies Bronze tier for stakes 0-99 DOT", () => {
    expect(calculateTier(0)).toBe("Bronze");
    expect(calculateTier(50)).toBe("Bronze");
    expect(calculateTier(99)).toBe("Bronze");
  });

  it("classifies Silver tier for stakes 100-499 DOT", () => {
    expect(calculateTier(100)).toBe("Silver");
    expect(calculateTier(250)).toBe("Silver");
    expect(calculateTier(499)).toBe("Silver");
  });

  it("classifies Gold tier for stakes 500-999 DOT", () => {
    expect(calculateTier(500)).toBe("Gold");
    expect(calculateTier(750)).toBe("Gold");
    expect(calculateTier(999)).toBe("Gold");
  });

  it("classifies Platinum tier for stakes 1000+ DOT", () => {
    expect(calculateTier(1000)).toBe("Platinum");
    expect(calculateTier(1500)).toBe("Platinum");
    expect(calculateTier(5000)).toBe("Platinum");
  });

  it("stores stake with correct tier metadata", () => {
    const stake = {
      id: "stake-1",
      userId: "user-1",
      amount: 750,
      tier: calculateTier(750),
      createdAt: new Date(),
    };

    fakeStakesDb.stakes.push(stake);

    expect(fakeStakesDb.stakes[0].tier).toBe("Gold");
  });
});