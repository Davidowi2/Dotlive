import { dotApi } from "@/api/client";
/**
 * Admin tools API — replaces the old Supabase-backed server functions.
 * All calls go through the Fastify backend at /api/admin/*.
 */


export interface RoleHierarchy {
  hierarchy: Record<string, {
    label: string;
    description?: string;
    grantableBy: string[];
    removableBy: string[];
  }>;
  rules: {
    lastSuperAdminProtection: boolean;
    superAdminSelfBan: boolean;
    superAdminSelfRemoval: string;
    nonSuperAdminCannotGrantAdmin: boolean;
    adminRoleChangesAudited: boolean;
  };
  stats: {
    totalSuperAdmins: number;
  };
}

export interface UserRolesInfo {
  user: {
    id: string;
    email: string;
    name: string | null;
    dotId: string;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isLastSuperAdmin: boolean;
  };
  roles: string[];
}

export interface TokenStats {
  maxSupplyDot: number;
  totalMintedDot: number;
  totalBurnedDot: number;
  circulatingSupplyDot: number;
  remainingDot: number;
  capReachedPercent: number;
  display: {
    maxSupply: string;
    circulating: string;
    remaining: string;
    capReachedPercent: string;
  };
}

export interface TokenOperation {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  operation: string;
  fromUserId: string | null;
  toUserId: string | null;
  amountDot: string;
  reason: string;
  relatedId: string | null;
  metadata: any;
  createdAt: string;
}

/* ── Roles ───────────────────────────────────────────── */

export async function getRoleHierarchy(): Promise<RoleHierarchy> {
  const res = await dotApi.get<RoleHierarchy>("/api/admin/roles/hierarchy");
  return res;
}

export async function getUserRolesInfo(userId: string): Promise<UserRolesInfo> {
  const res = await dotApi.get<UserRolesInfo>(`/api/admin/users/${userId}/roles`);
  return res;
}

export async function promoteUser(userId: string, opts: {
  role?: "admin" | "super_admin";
  reason?: string;
}): Promise<{ ok: boolean; before: string[]; after: string[] }> {
  return await dotApi.post(`/api/admin/users/${userId}/promote`, {
    role: opts.role ?? "admin",
    reason: opts.reason ?? "Promoted via admin console",
  });
}

export async function demoteUser(userId: string, opts: {
  role?: "admin" | "super_admin";
  reason?: string;
}): Promise<{ ok: boolean; before: string[]; after: string[] }> {
  return await dotApi.post(`/api/admin/users/${userId}/demote`, {
    role: opts.role ?? "admin",
    reason: opts.reason ?? "Demoted via admin console",
  });
}

/* ── Token supply ───────────────────────────────────── */

export async function getTokenStats(): Promise<TokenStats> {
  return await dotApi.get<TokenStats>("/api/admin/token-stats");
}

export async function getTokenOps(opts?: { op?: string; userId?: string; limit?: number }): Promise<{ operations: TokenOperation[] }> {
  const params = new URLSearchParams();
  if (opts?.op) params.set("op", opts.op);
  if (opts?.userId) params.set("userId", opts.userId);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return await dotApi.get<{ operations: TokenOperation[] }>(`/api/admin/token-ops${qs ? `?${qs}` : ""}`);
}

export async function mintTokens(opts: {
  toDotId?: string;
  toUserId?: string;
  amountDot: number;
  reason: string;
}): Promise<{ ok: boolean; minted: number; to: { userId: string; newBalance: number }; capStats: any }> {
  return await dotApi.post("/api/admin/mint", opts);
}

/* ── Admin transfer ─────────────────────────────────── */

export async function adminTransfer(opts: {
  fromDotId?: string;
  fromUserId?: string;
  toDotId?: string;
  toUserId?: string;
  amountDot: number;
  reason: string;
}): Promise<{ ok: boolean; transferred: number; from: { userId: string; newBalance: number }; to: { userId: string; newBalance: number } }> {
  return await dotApi.post("/api/admin/wallet/transfer", opts);
}
