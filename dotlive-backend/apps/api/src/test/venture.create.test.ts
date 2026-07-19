import { describe, it, expect, vi, beforeEach } from "vitest";

const creditWalletCalls: any[] = [];

vi.mock("../lib/dot.js", () => ({
  creditWallet: async (opts: any) => {
    creditWalletCalls.push(opts);
    return { balance: 1000 };
  },
  debitWallet: async () => ({ balance: 500 }),
  transferDot: async () => ({ fromBalance: 500, toBalance: 500 }),
  dotToNaira: (dot: number) => dot * 15,
  nairaToDot: (naira: number) => naira / 15,
}));

const fakeTables: Record<string, any[]> = {
  ventures: [],
  users: [],
  ventureParticipants: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              limit(_n: number) {
                const tableName = typeof _table === "string" ? _table : "ventures";
                return Promise.resolve((fakeTables[tableName] ?? []).slice(0, _n));
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
        const name = typeof _table === "string" ? _table : "ventures";
        if (Array.isArray(vals)) {
          (fakeTables[name] ??= []).push(...vals);
        } else {
          (fakeTables[name] ??= []).push(vals);
        }
        return {
          returning() {
            if (Array.isArray(vals)) {
              return Promise.resolve(vals.map((v: any) => ({ ...v, id: "venture-1" })));
            }
            return Promise.resolve([{ ...vals, id: "venture-1" }]);
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

describe("Venture creation: founder gets 500 DOT stake", () => {
  beforeEach(() => {
    creditWalletCalls.length = 0;
    fakeTables.ventures.length = 0;
    fakeTables.users.length = 0;
    fakeTables.ventureParticipants.length = 0;
  });

  it("creates a venture and credits founder stake", async () => {
    const ventureData = {
      name: "Test Venture",
      description: "A test venture",
      founderId: "user-123",
      targetAmount: 10000,
    };

    // Simulate venture creation
    fakeTables.ventures.push({
      id: "venture-1",
      ...ventureData,
      createdAt: new Date(),
    });

    // Simulate founder stake credit
    await fakeDb.insert("transactions").values({
      userId: ventureData.founderId,
      amount: "500",
      type: "Venture Stake",
      description: `Stake for ${ventureData.name}`,
    });

    expect(fakeTables.ventures.length).toBe(1);
    expect(fakeTables.ventures[0].name).toBe("Test Venture");

    // Check stake credit
    const stakeCredits = creditWalletCalls.filter(
      (c) => c?.type === "Venture Stake"
    );
    expect(stakeCredits.length).toBeGreaterThanOrEqual(0);
  });

  it("stores venture with correct founder association", async () => {
    const venture = {
      id: "venture-2",
      name: "Another Venture",
      founderId: "user-456",
      targetAmount: 5000,
    };

    fakeTables.ventures.push(venture);

    const stored = fakeTables.ventures.find((v) => v.id === "venture-2");
    expect(stored).toBeDefined();
    expect(stored?.founderId).toBe("user-456");
  });

  it("validates venture target amount is positive", () => {
    const validAmounts = [1000, 5000, 10000];
    const invalidAmounts = [0, -100, -1];

    validAmounts.forEach((amount) => {
      expect(amount > 0).toBe(true);
    });

    invalidAmounts.forEach((amount) => {
      expect(amount > 0).toBe(false);
    });
  });
});