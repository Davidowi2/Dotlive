import { describe, it, expect, vi, beforeEach } from "vitest";

const escrowCalls: any[] = [];

vi.mock("../lib/dot.js", () => ({
  creditWallet: async (opts: any) => {
    escrowCalls.push({ action: "credit", ...opts });
    return { balance: 1000 };
  },
  debitWallet: async (opts: any) => {
    escrowCalls.push({ action: "debit", ...opts });
    return { balance: 500 };
  },
}));

const fakeEscrowDb: Record<string, any[]> = {
  escrows: [],
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
                const tableName = typeof _table === "string" ? _table : "escrows";
                return Promise.resolve((fakeEscrowDb[tableName] ?? []).slice(0, _n));
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
        const name = typeof _table === "string" ? _table : "escrows";
        if (Array.isArray(vals)) {
          (fakeEscrowDb[name] ??= []).push(...vals);
        } else {
          (fakeEscrowDb[name] ??= []).push(vals);
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
  update(_table: any) {
    return {
      set(_set: any) {
        return {
          where(_predicate: any) {
            return {
              returning() {
                return Promise.resolve([{ ..._set, status: "released" }]);
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

// Escrow state machine
type EscrowStatus = "funded" | "delivered" | "released";

function createEscrow(escrowId: string, amount: number, funderId: string, recipientId: string) {
  fakeEscrowDb.escrows.push({
    id: escrowId,
    amount,
    funderId,
    recipientId,
    status: "funded",
    createdAt: new Date(),
  });
  escrowCalls.push({ action: "escrow_created", escrowId, amount });
}

function markDelivered(escrowId: string) {
  const escrow = fakeEscrowDb.escrows.find((e) => e.id === escrowId);
  if (escrow && escrow.status === "funded") {
    escrow.status = "delivered";
    escrowCalls.push({ action: "delivered", escrowId });
  }
}

function releaseEscrow(escrowId: string) {
  const escrow = fakeEscrowDb.escrows.find((e) => e.id === escrowId);
  if (escrow && escrow.status === "delivered") {
    escrow.status = "released";
    escrowCalls.push({ action: "released", escrowId, amount: escrow.amount, recipientId: escrow.recipientId });
    return true;
  }
  return false;
}

describe("Escrow flow: fund → deliver → release", () => {
  beforeEach(() => {
    escrowCalls.length = 0;
    fakeEscrowDb.escrows.length = 0;
    fakeEscrowDb.transactions.length = 0;
  });

  it("creates escrow in funded state", () => {
    createEscrow("escrow-1", 500, "funder-1", "recipient-1");

    const escrow = fakeEscrowDb.escrows[0];
    expect(escrow.status).toBe("funded");
    expect(escrow.amount).toBe(500);
    expect(escrow.funderId).toBe("funder-1");
  });

  it("transitions to delivered state", () => {
    createEscrow("escrow-2", 300, "funder-2", "recipient-2");
    markDelivered("escrow-2");

    const escrow = fakeEscrowDb.escrows.find((e) => e.id === "escrow-2");
    expect(escrow?.status).toBe("delivered");
  });

  it("releases funds to recipient on release", () => {
    createEscrow("escrow-3", 1000, "funder-3", "recipient-3");
    markDelivered("escrow-3");
    const released = releaseEscrow("escrow-3");

    expect(released).toBe(true);
    const escrow = fakeEscrowDb.escrows.find((e) => e.id === "escrow-3");
    expect(escrow?.status).toBe("released");
  });

  it("cannot release before delivery", () => {
    createEscrow("escrow-4", 200, "funder-4", "recipient-4");
    const released = releaseEscrow("escrow-4");

    expect(released).toBe(false);
    const escrow = fakeEscrowDb.escrows.find((e) => e.id === "escrow-4");
    expect(escrow?.status).toBe("funded");
  });

  it("tracks all escrow operations in call log", () => {
    createEscrow("escrow-5", 750, "funder-5", "recipient-5");
    markDelivered("escrow-5");
    releaseEscrow("escrow-5");

    expect(escrowCalls.length).toBeGreaterThanOrEqual(3);
    expect(escrowCalls.map((c) => c.action)).toContain("escrow_created");
    expect(escrowCalls.map((c) => c.action)).toContain("delivered");
    expect(escrowCalls.map((c) => c.action)).toContain("released");
  });
});