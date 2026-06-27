import { dotApi } from "@/api/client";
/**
 * Admin API — wraps the Fastify /api/admin/* endpoints.
 * All endpoints require admin or super_admin role.
 * Write operations require an Idempotency-Key header (generated automatically).
 */


/* ── Types ─────────────────────────────────────────── */

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  dotId: string;
  onboardingIntent: string | null;
  createdAt: string;
  roles?: string[];
  balance?: number;
  bannedAt?: string | null;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  isLastSuperAdmin?: boolean;
  walletBalance?: number;
  [key: string]: unknown;
}

export interface AdminUserDetail extends AdminUser {
  wallet: { balance: number } | null;
  roles: string[];
  ban: AdminBan | null;
  recentTransactions: AdminTransaction[];
}

export interface AdminBan {
  id: string;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface AdminTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export interface AdminStats {
  users: number;
  ventures: number;
  dotInCirculation: number;
  isBeta: boolean;
}

function idempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ── Users ─────────────────────────────────────────── */

export async function listAdminUsers(params?: {
  search?: string;
  role?: string;
  banned?: "yes" | "no";
  limit?: number;
}): Promise<{ users: AdminUser[]; nextCursor: string | null }> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.role)   q.set("role",   params.role);
  if (params?.banned) q.set("banned", params.banned);
  if (params?.limit)  q.set("limit",  String(params.limit));
  const qs = q.toString() ? `?${q}` : "";
  return dotApi.get(`/api/admin/users${qs}`);
}

export async function getAdminUser(id: string): Promise<AdminUserDetail> {
  const res = await dotApi.get<AdminUserDetail>(`/api/admin/users/${id}`);
  return res;
}

export async function adjustBalance(
  userId: string,
  amount: number,
  description: string
): Promise<{ ok: boolean; newBalance: number }> {
  return dotApi.post(`/api/admin/users/${userId}/adjust-balance`, {
    amount,
    description,
    reason: description,
  }, {
    headers: { "Idempotency-Key": idempotencyKey() },
  });
}

export async function banUser(
  userId: string,
  reason: string,
  expiresInHours?: number
): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/admin/users/${userId}/ban`, {
    reason,
    expiresInHours,
  }, {
    headers: { "Idempotency-Key": idempotencyKey() },
  });
}

export async function unbanUser(userId: string, reason: string): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/admin/users/${userId}/unban`, { reason }, {
    headers: { "Idempotency-Key": idempotencyKey() },
  });
}

/* ── Stats ─────────────────────────────────────────── */

export async function getAdminStats(): Promise<AdminStats> {
  return dotApi.get("/api/stats");
}

/* ── Audit log ─────────────────────────────────────── */

export async function getAuditLog(limit = 50): Promise<unknown[]> {
  const res = await dotApi.get<{ logs: unknown[] }>(`/api/admin/audit?limit=${limit}`);
  return (res as any).logs ?? [];
}
