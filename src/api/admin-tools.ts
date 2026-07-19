import { dotApi } from "@/api/client";

/* ── Types ─────────────────────────────────────────── */

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

export interface AdminAuditEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  before: any;
  after: any;
  reason: string;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: any;
  createdAt: string;
}

export interface PlatformConfigEntry {
  key: string;
  value: number | string | boolean | null;
  label: string;
  description: string;
  group: string;
  impact: "high" | "low";
}

export interface TokenStats {
  circulatingSupplyDot: number;
  totalMintedDot: number;
  totalBurnedDot: number;
  circulating?: number;
  remainingDot?: number;
  display: {
    maxSupply: number;
    capReachedPercent: number;
    remaining: string;
  };
}

export interface TokenOperation {
  id: string;
  operation: "mint" | "burn" | "transfer" | "admin_transfer";
  amountDot: number;
  fromUserId: string | null;
  toUserId: string | null;
  actorEmail: string;
  reason: string;
  createdAt: string;
}

export interface TokenOpsResponse {
  operations: TokenOperation[];
}

export async function getPlatformConfig(): Promise<{ config: PlatformConfigEntry[] }> {
  return await dotApi.get<{ config: PlatformConfigEntry[] }>("/api/admin/platform-config");
}

export async function updatePlatformConfig(opts: {
  key: string;
  value: number | string | boolean | null;
  reason: string;
}): Promise<{ ok: boolean }> {
  return await dotApi.put(`/api/admin/platform-config/${opts.key}`, {
    value: opts.value,
    reason: opts.reason,
  });
}

/**
 * Get token statistics for the admin dashboard
 */
export async function getTokenStats(): Promise<TokenStats> {
  return await dotApi.get<TokenStats>("/api/admin/token-stats");
}

/**
 * Get recent token operations (mint/transfer)
 */
export async function getTokenOps(opts?: { limit?: number }): Promise<TokenOpsResponse> {
  const params = opts?.limit ? `?limit=${opts.limit}` : "";
  return await dotApi.get<TokenOpsResponse>(`/api/admin/token-ops${params}`);
}

/**
 * Mint new DOT tokens to a user's wallet
 */
export async function mintTokens(opts: {
  toDotId: string;
  amountDot: number;
  reason: string;
}): Promise<{ ok: boolean; to: { userId: string } }> {
  return await dotApi.post<{ ok: boolean; to: { userId: string } }>("/api/admin/token-mint", {
    toDotId: opts.toDotId,
    amountDot: opts.amountDot,
    reason: opts.reason,
  });
}

/**
 * Transfer DOT tokens between wallets (admin operation)
 */
export async function adminTransfer(opts: {
  fromDotId: string;
  toDotId: string;
  amountDot: number;
  reason: string;
}): Promise<{ ok: boolean }> {
  return await dotApi.post<{ ok: boolean }>("/api/admin/token-transfer", {
    fromDotId: opts.fromDotId,
    toDotId: opts.toDotId,
    amountDot: opts.amountDot,
    reason: opts.reason,
  });
}

/* ── Role hierarchy ────────────────────────────────── */

export async function getRoleHierarchy(): Promise<RoleHierarchy> {
  const res = await dotApi.get<RoleHierarchy>("/api/admin/roles/hierarchy");
  return res;
}

/* ── Audit log ─────────────────────────────────────── */

export async function getAuditLog(opts?: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
}): Promise<{ entries: AdminAuditEntry[] }> {
  const q = new URLSearchParams();
  if (opts?.limit) q.set("limit", String(opts.limit));
  if (opts?.offset) q.set("offset", String(opts.offset));
  if (opts?.userId) q.set("userId", opts.userId);
  if (opts?.action) q.set("action", opts.action);
  const qs = q.toString();
  return await dotApi.get<{ entries: AdminAuditEntry[] }>(`/api/admin/audit${qs ? `?${qs}` : ""}`);
}
