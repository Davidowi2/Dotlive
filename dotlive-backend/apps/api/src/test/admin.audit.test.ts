import { describe, it, expect, vi, beforeEach } from "vitest";

const fakeAuditDb: Record<string, any[]> = {
  auditLogs: [],
  users: [],
};

const fakeDb: any = {
  select(_selectObj: any) {
    return {
      from(_table: any) {
        return {
          where(_predicate: any) {
            return {
              orderBy(_column: any) {
                return {
                  limit(_n: number) {
                    const tableName = typeof _table === "string" ? _table : "auditLogs";
                    return Promise.resolve((fakeAuditDb[tableName] ?? []).slice(0, _n));
                  },
                };
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
        const name = typeof _table === "string" ? _table : "auditLogs";
        if (Array.isArray(vals)) {
          (fakeAuditDb[name] ??= []).push(...vals);
        } else {
          (fakeAuditDb[name] ??= []).push(vals);
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

// Audit log types
type AuditAction = 
  | "user_created"
  | "user_updated"
  | "loan_approved"
  | "loan_rejected"
  | "wallet_credited"
  | "wallet_debited"
  | "role_granted"
  | "role_revoked";

interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

function createAuditLog(userId: string, action: AuditAction, details: Record<string, any>, ipAddress?: string): AuditLog {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    action,
    details,
    ipAddress,
    createdAt: new Date(),
  };
  fakeAuditDb.auditLogs.push(log);
  return log;
}

function listAuditLogs(userId?: string, action?: AuditAction, limit = 100): AuditLog[] {
  let logs = [...fakeAuditDb.auditLogs];

  if (userId) {
    logs = logs.filter((l) => l.userId === userId);
  }
  if (action) {
    logs = logs.filter((l) => l.action === action);
  }

  return logs
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

describe("Audit log: tracking admin actions", () => {
  beforeEach(() => {
    fakeAuditDb.auditLogs.length = 0;
    fakeAuditDb.users.length = 0;
  });

  it("logs user creation action", () => {
    const log = createAuditLog("admin-1", "user_created", { newUserId: "user-123", email: "new@example.com" });

    expect(log.action).toBe("user_created");
    expect(log.details.newUserId).toBe("user-123");
  });

  it("logs loan approval action", () => {
    const log = createAuditLog("admin-1", "loan_approved", { loanId: "loan-456", amount: 5000, recipientId: "user-789" });

    expect(log.action).toBe("loan_approved");
    expect(log.details.amount).toBe(5000);
  });

  it("logs wallet debit action", () => {
    const log = createAuditLog("system", "wallet_debited", { userId: "user-111", amount: 100, reason: "fee" });

    expect(log.action).toBe("wallet_debited");
    expect(log.details.amount).toBe(100);
  });

  it("filters audit logs by user", () => {
    createAuditLog("admin-1", "user_created", { userId: "user-1" });
    createAuditLog("admin-1", "user_created", { userId: "user-2" });
    createAuditLog("admin-2", "user_created", { userId: "user-3" });

    const admin1Logs = listAuditLogs("admin-1");
    const admin2Logs = listAuditLogs("admin-2");

    expect(admin1Logs).toHaveLength(2);
    expect(admin2Logs).toHaveLength(1);
  });

  it("filters audit logs by action type", () => {
    createAuditLog("admin-1", "user_created", { userId: "user-1" });
    createAuditLog("admin-1", "loan_approved", { loanId: "loan-1" });
    createAuditLog("admin-1", "loan_rejected", { loanId: "loan-2" });

    const loanLogs = listAuditLogs(undefined, "loan_approved");

    expect(loanLogs).toHaveLength(1);
    expect(loanLogs[0].action).toBe("loan_approved");
  });

  it("returns logs in reverse chronological order", () => {
    // Create logs with different timestamps
    const log1 = { id: "audit-1", userId: "admin-1", action: "user_created" as AuditAction, details: { order: 1 }, createdAt: new Date(Date.now()) };
    const log2 = { id: "audit-2", userId: "admin-1", action: "user_created" as AuditAction, details: { order: 2 }, createdAt: new Date(Date.now() + 1) };
    const log3 = { id: "audit-3", userId: "admin-1", action: "user_created" as AuditAction, details: { order: 3 }, createdAt: new Date(Date.now() + 2) };
    fakeAuditDb.auditLogs.push(log1, log2, log3);

    const logs = listAuditLogs();

    expect(logs[0].details.order).toBe(3);
    expect(logs[1].details.order).toBe(2);
    expect(logs[2].details.order).toBe(1);
  });
});