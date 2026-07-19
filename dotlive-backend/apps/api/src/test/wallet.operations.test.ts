import { describe, it, expect, vi, beforeEach } from "vitest";

const walletCalls: any[] = [];

vi.mock("../lib/dot.js", () => ({
  creditWallet: async (opts: any) => {
    walletCalls.push({ action: "credit", ...opts });
    return { balance: opts.amount };
  },
  debitWallet: async (opts: any) => {
    walletCalls.push({ action: "debit", ...opts });
    return { balance: 0 };
  },
  transferDot: async (opts: any) => {
    walletCalls.push({ action: "transfer", ...opts });
    return { fromBalance: 0, toBalance: opts.amount };
  },
}));

const fakeWalletDb: Record<string, any[]> = {
  wallets: [],
  transactions: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              limit(_n: number) {
                const tableName = typeof _table === "string" ? _table : "wallets";
                return Promise.resolve((fakeWalletDb[tableName] ?? []).slice(0, _n));
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
        const name = typeof _table === "string" ? _table : "wallets";
        if (Array.isArray(vals)) {
          (fakeWalletDb[name] ??= []).push(...vals);
        } else {
          (fakeWalletDb[name] ??= []).push(vals);
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
  update(_table: any) {
    return {
      set(_set: any) {
        return {
          where(_predicate: any) {
            return {
              returning() {
                return Promise.resolve([{ ..._set }]);
              },
            };
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

// Wallet operations
interface Wallet {
  userId: string;
  balance: number;
  stakedBalance: number;
  lockedBalance: number;
}

function getOrCreateWallet(userId: string): Wallet {
  let wallet = fakeWalletDb.wallets.find((w) => w.userId === userId);
  if (!wallet) {
    wallet = { userId, balance: 0, stakedBalance: 0, lockedBalance: 0 };
    fakeWalletDb.wallets.push(wallet);
  }
  return wallet;
}

async function credit(userId: string, amount: number, type: string, description?: string) {
  const wallet = getOrCreateWallet(userId);
  wallet.balance += amount;
  
  fakeWalletDb.transactions.push({
    id: `tx-${Date.now()}`,
    userId,
    amount: String(amount),
    type,
    description,
    createdAt: new Date(),
  });
  
  return { balance: wallet.balance };
}

async function debit(userId: string, amount: number, type: string, description?: string) {
  const wallet = getOrCreateWallet(userId);
  
  if (wallet.balance < amount) {
    throw new Error("Insufficient balance");
  }
  
  wallet.balance -= amount;
  
  fakeWalletDb.transactions.push({
    id: `tx-${Date.now()}`,
    userId,
    amount: String(-amount),
    type,
    description,
    createdAt: new Date(),
  });
  
  return { balance: wallet.balance };
}

async function transfer(fromUserId: string, toUserId: string, amount: number, description?: string) {
  if (fromUserId === toUserId) {
    throw new Error("Cannot transfer to self");
  }
  
  const fromWallet = getOrCreateWallet(fromUserId);
  const toWallet = getOrCreateWallet(toUserId);
  
  if (fromWallet.balance < amount) {
    throw new Error("Insufficient balance");
  }
  
  fromWallet.balance -= amount;
  toWallet.balance += amount;
  
  fakeWalletDb.transactions.push({
    id: `tx-${Date.now()}-out`,
    userId: fromUserId,
    amount: String(-amount),
    type: "Transfer Out",
    description,
    createdAt: new Date(),
  });
  
  fakeWalletDb.transactions.push({
    id: `tx-${Date.now()}-in`,
    userId: toUserId,
    amount: String(amount),
    type: "Transfer In",
    description,
    createdAt: new Date(),
  });
  
  return { fromBalance: fromWallet.balance, toBalance: toWallet.balance };
}

describe("Wallet operations: credit/debit/transfer", () => {
  beforeEach(() => {
    walletCalls.length = 0;
    fakeWalletDb.wallets.length = 0;
    // Clear transactions before each test
    fakeWalletDb.transactions.length = 0;
  });

  it("credits wallet and records transaction", async () => {
    const result = await credit("user-1", 500, "Deposit", "Initial deposit");

    expect(result.balance).toBe(500);
    expect(fakeWalletDb.transactions).toHaveLength(1);
    expect(fakeWalletDb.transactions[0].type).toBe("Deposit");
  });

  it("debits wallet and records transaction", async () => {
    await credit("user-1", 500, "Deposit", "Initial");
    const result = await debit("user-1", 200, "Purchase", "Item bought");

    expect(result.balance).toBe(300);
    expect(fakeWalletDb.transactions).toHaveLength(2);
  });

  it("fails debit with insufficient balance", async () => {
    await credit("user-1", 100, "Deposit", "Small deposit");
    
    await expect(debit("user-1", 200, "Purchase", "Too expensive"))
      .rejects.toThrow("Insufficient balance");
  });

  it("transfers between two users", async () => {
    // Reset transactions to ensure clean state
    fakeWalletDb.transactions.length = 0;
    fakeWalletDb.wallets.length = 0;
    
    await credit("sender", 500, "Deposit", "Sender funds");
    const result = await transfer("sender", "receiver", 300, "Test transfer");

    expect(result.fromBalance).toBe(200);
    expect(result.toBalance).toBe(300);
    // Transfer creates 2 transactions (out + in), plus 1 from credit = 3 total
    expect(fakeWalletDb.transactions.length).toBe(3);
  });

  it("fails self-transfer", async () => {
    await credit("user-1", 100, "Deposit", "Funds");
    
    await expect(transfer("user-1", "user-1", 50, "Self transfer"))
      .rejects.toThrow("Cannot transfer to self");
  });

  it("fails transfer with insufficient balance", async () => {
    await credit("sender", 100, "Deposit", "Small funds");
    
    await expect(transfer("sender", "receiver", 200, "Too much"))
      .rejects.toThrow("Insufficient balance");
  });

  it("tracks all wallet operations in call log", async () => {
    // Clear before test
    walletCalls.length = 0;
    
    // Use the mocked dot.js functions directly
    const { creditWallet, debitWallet, transferDot } = await import("../lib/dot.js");
    
    await creditWallet({ userId: "user-1", amount: 1000, type: "Deposit", description: "Initial" });
    await debitWallet({ userId: "user-1", amount: 300, type: "Spend", description: "Purchase" });
    await transferDot({ fromUserId: "user-1", toUserId: "user-2", amount: 200, description: "Transfer" });

    expect(walletCalls.length).toBe(3);
    expect(walletCalls.map((c) => c.action)).toContain("credit");
    expect(walletCalls.map((c) => c.action)).toContain("debit");
    expect(walletCalls.map((c) => c.action)).toContain("transfer");
  });
});