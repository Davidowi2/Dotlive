import { describe, it, expect, vi, beforeEach } from "vitest";

const creditWalletCalls: any[] = [];
const mintDotCalls: any[] = [];

vi.mock("../lib/dot.js", () => ({
  creditWallet: async (opts: any) => {
    creditWalletCalls.push(opts);
    return { balance: 500 };
  },
  mintDot: async (opts: any) => {
    mintDotCalls.push(opts);
  },
}));

const fakeTables: Record<string, any[]> = {
  users: [],
  user_roles: [],
  oauth_accounts: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              limit(_n: number) {
                return Promise.resolve([].slice(0, _n));
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
        const name = typeof _table === "string" ? _table : "users";
        if (Array.isArray(vals)) {
          (fakeTables[name] ??= []).push(...vals);
        } else {
          (fakeTables[name] ??= []).push(vals);
        }
        return {
          onConflictDoNothing() {
            return Promise.resolve([]);
          },
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

describe("Auth signup: 500 DOT starter grant", () => {
  beforeEach(() => {
    creditWalletCalls.length = 0;
    mintDotCalls.length = 0;
    fakeTables.users.length = 0;
    fakeTables.user_roles.length = 0;
    fakeTables.oauth_accounts.length = 0;
  });

  it("credits exactly 500 DOT to the new user", async () => {
    const { createUser } = await import("../lib/auth.js");

    const email = `test-${Date.now()}@example.com`;
    const password = "TestPass123!";

    await createUser({ email, password });

    const creditCalls = creditWalletCalls.filter(
      (c) => typeof c?.amount === "number" && c.amount === 500
    );
    expect(creditCalls.length).toBeGreaterThanOrEqual(1);

    const latest = creditCalls[creditCalls.length - 1];
    expect(latest?.userId).toBeTruthy();
    expect(latest?.amount).toBe(500);
    expect(typeof latest?.description).toBe("string");
  });
});
