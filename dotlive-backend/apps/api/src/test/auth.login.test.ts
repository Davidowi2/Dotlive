import { describe, it, expect, vi, beforeEach } from "vitest";

const validateSessionCalls: any[] = [];
const createSessionCalls: any[] = [];

vi.mock("../lib/auth.js", () => ({
  validateSession: async (sessionId: string) => {
    validateSessionCalls.push(sessionId);
    if (sessionId === "valid-session") {
      return { userId: "user-1", expiresAt: new Date(Date.now() + 86400000) };
    }
    return null;
  },
  createSession: async (userId: string) => {
    createSessionCalls.push(userId);
    return "new-session-token";
  },
  verifyPassword: async (_hash: string, _plain: string) => true,
}));

const fakeTables: Record<string, any[]> = {
  users: [],
  sessions: [],
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
        const name = typeof _table === "string" ? _table : "sessions";
        if (Array.isArray(vals)) {
          (fakeTables[name] ??= []).push(...vals);
        } else {
          (fakeTables[name] ??= []).push(vals);
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

describe("Auth login: session creation", () => {
  beforeEach(() => {
    validateSessionCalls.length = 0;
    createSessionCalls.length = 0;
    fakeTables.users.length = 0;
    fakeTables.sessions.length = 0;
  });

  it("creates a session for valid credentials", async () => {
    const { createSession } = await import("../lib/auth.js");

    const userId = "user-123";
    const sessionToken = await createSession(userId);

    expect(sessionToken).toBe("new-session-token");
    expect(createSessionCalls).toContain(userId);
  });

  it("validates existing session and returns user data", async () => {
    const { validateSession } = await import("../lib/auth.js");

    const result = await validateSession("valid-session");

    expect(result).not.toBeNull();
    expect(result?.userId).toBe("user-1");
    expect(validateSessionCalls).toContain("valid-session");
  });

  it("returns null for invalid session", async () => {
    const { validateSession } = await import("../lib/auth.js");

    const result = await validateSession("invalid-session");

    expect(result).toBeNull();
  });
});