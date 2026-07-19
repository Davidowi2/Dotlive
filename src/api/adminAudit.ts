import { dotApi } from "@/api/client";

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

export async function getAuditLog(opts: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
}): Promise<{ entries: AdminAuditEntry[] }> {
  const q = new URLSearchParams();
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  if (opts.userId) q.set("userId", opts.userId);
  if (opts.action) q.set("action", opts.action);
  const qs = q.toString();
  return await dotApi.get<{ entries: AdminAuditEntry[] }>(`/api/admin/audit${qs ? `?${qs}` : ""}`);
}
