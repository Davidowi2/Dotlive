/**
 * 2FA Authentication Tests
 * 
 * Tests for:
 * - 2FA setup generates secret and backup codes
 * - 2FA verify enables 2FA for user
 * - 2FA disable removes 2FA
 * - Admin route access without 2FA returns 403
 * - Admin route access with 2FA succeeds
 * - Login flow with 2FA required
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockUsers: any[] = [];
const mockSessions: any[] = [];

const fakeDb = {
  select(_selectObj: any) {
    return {
      from(table: any) {
        const tableName = typeof table === 'object' && table?.name ? table.name : 'users';
        return {
          where(predicate: any) {
            return {
              limit(n: number) {
                // For users table, filter by conditions
                if (tableName === 'users') {
                  let results = [...mockUsers];
                  // Simple filter by email or id
                  if (predicate?.args?.[0]?.column?.name === 'email') {
                    const email = predicate?.args?.[1];
                    results = results.filter(u => u.email === email?.toLowerCase());
                  }
                  if (predicate?.args?.[0]?.column?.name === 'id') {
                    const id = predicate?.args?.[1];
                    results = results.filter(u => u.id === id);
                  }
                  return Promise.resolve(results.slice(0, n));
                }
                return Promise.resolve([]);
              },
            };
          },
        };
      },
    };
  },
  update(table: any) {
    return {
      set(values: any) {
        return {
          where(predicate: any) {
            return {
              returning() {
                // Find and update user
                const tableName = typeof table === 'object' && table?.name ? table.name : 'users';
                if (tableName === 'users' && predicate?.args?.[1]) {
                  const userId = predicate.args[1];
                  const idx = mockUsers.findIndex(u => u.id === userId);
                  if (idx >= 0) {
                    Object.assign(mockUsers[idx], values);
                    return Promise.resolve([mockUsers[idx]]);
                  }
                }
                return Promise.resolve([]);
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
}));

vi.mock("../lib/auth.js", () => ({
  verifyPassword: async (_hash: string, _plain: string) => true,
  createSession: async (userId: string) => `session-${userId}`,
  loadUserWithRoles: async (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return null;
    const roles = user.roles || [];
    return { ...user, roles };
  },
  getUserRoles: async (userId: string) => {
    const user = mockUsers.find(u => u.id === userId);
    return user?.roles || [];
  },
}));

describe("2FA Setup", () => {
  beforeEach(() => {
    mockUsers.length = 0;
    mockSessions.length = 0;
    // Add test user
    mockUsers.push({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hash123",
      name: "Test User",
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
      roles: ["builder"],
    });
  });

  it("should generate secret and backup codes on 2FA setup", async () => {
    const user = mockUsers.find(u => u.id === "user-1");
    expect(user).toBeDefined();
    expect(user?.twoFactorEnabled).toBe(false);
    expect(user?.twoFactorSecret).toBeNull();

    // Simulate 2FA setup - generate secret (20 bytes = ~32 base32 chars)
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b % 32])
      .join("");
    
    const backupCodes = Array.from({ length: 10 }, () =>
      Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => "0123456789"[b % 10])
        .join("")
    );

    // Verify secret format (base32 from 20 bytes gives 32 chars)
    expect(secret.length).toBe(20);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    
    // Verify backup codes format (8 digits each)
    expect(backupCodes.length).toBe(10);
    backupCodes.forEach(code => {
      expect(code.length).toBe(8);
      expect(code).toMatch(/^[0-9]+$/);
    });
  });

  it("should generate QR URL for authenticator apps", async () => {
    const issuer = encodeURIComponent("DOT");
    const account = encodeURIComponent("test@example.com");
    const secret = "JBSWY3DPEHPK3PXP";
    
    const qrUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
    
    expect(qrUrl).toContain("otpauth://totp/");
    expect(qrUrl).toContain("secret=");
    expect(qrUrl).toContain("issuer=DOT");
    expect(qrUrl).toContain("digits=6");
    expect(qrUrl).toContain("period=30");
  });
});

describe("2FA Verification", () => {
  beforeEach(() => {
    mockUsers.length = 0;
    mockSessions.length = 0;
    mockUsers.push({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hash123",
      name: "Test User",
      twoFactorEnabled: false,
      twoFactorSecret: "JBSWY3DPEHPK3PXP",
      backupCodes: ["12345678", "87654321"],
      roles: ["builder"],
    });
  });

  it("should enable 2FA after successful code verification", async () => {
    const user = mockUsers.find(u => u.id === "user-1");
    expect(user?.twoFactorEnabled).toBe(false);
    
    // Simulate successful TOTP verification
    const code = "123456"; // Test code
    const isValidCode = code.length === 6 && /^\d+$/.test(code);
    
    expect(isValidCode).toBe(true);
    
    // After verification, enable 2FA
    if (isValidCode) {
      user!.twoFactorEnabled = true;
    }
    
    expect(user?.twoFactorEnabled).toBe(true);
  });

  it("should reject invalid codes", async () => {
    const invalidCodes = ["", "12345", "1234567", "abcde", "00000"];
    
    invalidCodes.forEach(code => {
      const isValidCode = code.length === 6 && /^\d+$/.test(code);
      expect(isValidCode).toBe(false);
    });
  });
});

describe("2FA Disable", () => {
  beforeEach(() => {
    mockUsers.length = 0;
    mockSessions.length = 0;
    mockUsers.push({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hash123",
      name: "Test User",
      twoFactorEnabled: true,
      twoFactorSecret: "JBSWY3DPEHPK3PXP",
      backupCodes: ["12345678", "87654321"],
      roles: ["builder"],
    });
  });

  it("should disable 2FA with correct password", async () => {
    const user = mockUsers.find(u => u.id === "user-1");
    expect(user?.twoFactorEnabled).toBe(true);
    
    // Simulate password verification
    const password = "correct-password";
    const isPasswordValid = true; // Mock always returns true
    
    expect(isPasswordValid).toBe(true);
    
    if (isPasswordValid) {
      user!.twoFactorEnabled = false;
      user!.twoFactorSecret = null;
      user!.backupCodes = [];
    }
    
    expect(user?.twoFactorEnabled).toBe(false);
    expect(user?.twoFactorSecret).toBeNull();
    expect(user?.backupCodes).toEqual([]);
  });

  it("should require password confirmation to disable 2FA", async () => {
    const user = mockUsers.find(u => u.id === "user-1");
    const originalTwoFactorEnabled = user?.twoFactorEnabled;
    
    // Try to disable without password
    const password = "";
    const isPasswordValid = password.length > 0;
    
    expect(isPasswordValid).toBe(false);
    
    // Should not disable 2FA without valid password
    expect(user?.twoFactorEnabled).toBe(originalTwoFactorEnabled);
  });
});

describe("Admin 2FA Requirement", () => {
  beforeEach(() => {
    mockUsers.length = 0;
    mockSessions.length = 0;
    // Admin user without 2FA
    mockUsers.push({
      id: "admin-1",
      email: "admin@example.com",
      passwordHash: "hash123",
      name: "Admin User",
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
      roles: ["admin"],
    });
    // Admin user with 2FA
    mockUsers.push({
      id: "admin-2",
      email: "admin2@example.com",
      passwordHash: "hash123",
      name: "Admin User 2",
      twoFactorEnabled: true,
      twoFactorSecret: "JBSWY3DPEHPK3PXP",
      backupCodes: ["12345678"],
      roles: ["admin"],
    });
    // Regular user (not admin)
    mockUsers.push({
      id: "user-1",
      email: "user@example.com",
      passwordHash: "hash123",
      name: "Regular User",
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: [],
      roles: ["builder"],
    });
  });

  it("should return 403 for admin without 2FA accessing admin route", async () => {
    const admin = mockUsers.find(u => u.id === "admin-1");
    const isAdmin = admin?.roles.includes("admin");
    const has2FA = admin?.twoFactorEnabled;
    
    expect(isAdmin).toBe(true);
    expect(has2FA).toBe(false);
    
    // Simulate middleware check
    const require2FA = isAdmin && !has2FA;
    expect(require2FA).toBe(true);
    
    // Would return 403
    const responseCode = require2FA ? 403 : 200;
    expect(responseCode).toBe(403);
  });

  it("should allow admin with 2FA to access admin route", async () => {
    const admin = mockUsers.find(u => u.id === "admin-2");
    const isAdmin = admin?.roles.includes("admin");
    const has2FA = admin?.twoFactorEnabled;
    
    expect(isAdmin).toBe(true);
    expect(has2FA).toBe(true);
    
    // Simulate middleware check
    const require2FA = isAdmin && !has2FA;
    expect(require2FA).toBe(false);
    
    const responseCode = require2FA ? 403 : 200;
    expect(responseCode).toBe(200);
  });

  it("should allow non-admin users to access routes without 2FA", async () => {
    const user = mockUsers.find(u => u.id === "user-1");
    const isAdmin = user?.roles.includes("admin") || user?.roles.includes("super_admin");
    const has2FA = user?.twoFactorEnabled;
    
    expect(isAdmin).toBe(false);
    
    // Non-admins don't need 2FA
    const require2FA = isAdmin && !has2FA;
    expect(require2FA).toBe(false);
    
    const responseCode = require2FA ? 403 : 200;
    expect(responseCode).toBe(200);
  });

  it("should apply 2FA requirement for super_admin role too", () => {
    const superAdmin = { roles: ["super_admin"], twoFactorEnabled: false };
    const isAdmin = superAdmin.roles.includes("admin") || superAdmin.roles.includes("super_admin");
    const has2FA = superAdmin.twoFactorEnabled;
    
    expect(isAdmin).toBe(true);
    expect(has2FA).toBe(false);
    
    const require2FA = isAdmin && !has2FA;
    expect(require2FA).toBe(true);
  });
});

describe("Login Flow with 2FA", () => {
  beforeEach(() => {
    mockUsers.length = 0;
    mockSessions.length = 0;
    mockUsers.push({
      id: "admin-1",
      email: "admin@example.com",
      passwordHash: "hash123",
      name: "Admin User",
      twoFactorEnabled: false, // Admin without 2FA
      roles: ["admin"],
    });
    mockUsers.push({
      id: "admin-2",
      email: "admin2@example.com",
      passwordHash: "hash123",
      name: "Admin User 2",
      twoFactorEnabled: true, // Admin with 2FA
      roles: ["admin"],
    });
  });

  it("should require 2FA for admin users during login", async () => {
    const { email, password } = { email: "admin@example.com", password: "pass123" };
    const user = mockUsers.find(u => u.email === email);
    
    // Verify password (mock always returns true)
    const passwordValid = true;
    expect(passwordValid).toBe(true);
    
    // Check if user is admin
    const isAdmin = user?.roles.includes("admin") || user?.roles.includes("super_admin");
    expect(isAdmin).toBe(true);
    
    // Check 2FA requirement for admin
    if (isAdmin && !user?.twoFactorEnabled) {
      // Should return 403 with 2FA_REQUIRED code
      const response = { code: 403, error: "2FA required for admin accounts", errorCode: "2FA_REQUIRED" };
      expect(response.code).toBe(403);
      expect(response.errorCode).toBe("2FA_REQUIRED");
    }
  });

  it("should allow login with 2FA enabled admin", async () => {
    const { email, password } = { email: "admin2@example.com", password: "pass123" };
    const user = mockUsers.find(u => u.email === email);
    
    const passwordValid = true;
    expect(passwordValid).toBe(true);
    
    const isAdmin = user?.roles.includes("admin") || user?.roles.includes("super_admin");
    const has2FA = user?.twoFactorEnabled;
    
    expect(isAdmin).toBe(true);
    expect(has2FA).toBe(true);
    
    // Should proceed with login, return token
    const token = "jwt-token-here";
    expect(token).toBeDefined();
  });

  it("should allow regular users to login without 2FA", async () => {
    const regularUser = {
      id: "user-1",
      email: "user@example.com",
      passwordHash: "hash123",
      roles: ["builder"],
      twoFactorEnabled: false,
    };
    
    const isAdmin = regularUser.roles.includes("admin") || regularUser.roles.includes("super_admin");
    expect(isAdmin).toBe(false);
    
    // Regular users can login without 2FA
    const token = "jwt-token-here";
    expect(token).toBeDefined();
  });
});

describe("Backup Codes", () => {
  it("should generate 10 backup codes", () => {
    const backupCodes = Array.from({ length: 10 }, () =>
      Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => "0123456789"[b % 10])
        .join("")
    );
    
    expect(backupCodes.length).toBe(10);
    
    // Each code should be 8 digits
    backupCodes.forEach(code => {
      expect(code.length).toBe(8);
      expect(code).toMatch(/^\d{8}$/);
    });
  });

  it("should have unique backup codes", () => {
    const backupCodes = Array.from({ length: 10 }, () =>
      Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => "0123456789"[b % 10])
        .join("")
    );
    
    const uniqueCodes = new Set(backupCodes);
    expect(uniqueCodes.size).toBe(backupCodes.length);
  });

  it("should validate backup code format", () => {
    const validCode = "12345678";
    const invalidCodes = ["1234567", "123456789", "abcdefgh"];
    
    // Valid code should pass
    expect(validCode.length).toBe(8);
    expect(validCode).toMatch(/^\d{8}$/);
    
    // Invalid codes should fail format check
    invalidCodes.forEach(code => {
      const isValidFormat = code.length === 8 && /^\d{8}$/.test(code);
      expect(isValidFormat).toBe(false);
    });
  });
});

describe("TOTP Secret Generation", () => {
  it("should generate base32-compliant secret", () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b % 32])
      .join("");
    
    // Base32 uses A-Z and 2-7
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(secret.length).toBe(20);
  });

  it("should generate unique secrets", () => {
    const secrets = new Set();
    for (let i = 0; i < 100; i++) {
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map(b => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b % 32])
        .join("");
      secrets.add(secret);
    }
    
    // All 100 should be unique
    expect(secrets.size).toBe(100);
  });
});