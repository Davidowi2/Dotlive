/**
 * Vouches API client — trust & reputation through peer vouching
 */

import { dotApi } from "./client";

export type VouchScope = "founder" | "builder" | "capital";

export interface Vouch {
  id: string;
  voucherId: string;
  voucheeId: string;
  scope: VouchScope;
  score: number;
  createdAt: string;
  voucher?: {
    name: string | null;
    dotId: string;
    avatarUrl: string | null;
  };
}

export interface VouchStats {
  userId: string;
  receivedCount: number;
  givenCount: number;
  totalScore: number;
  decayedScore: number; // Applied on client (1% / 30 days)
  byScope: Record<VouchScope, { count: number; score: number }>;
}

/**
 * Create a vouch for a user
 */
export async function createVouch(voucheeId: string, scope: VouchScope): Promise<Vouch> {
  const res = await dotApi.post<{ vouch: Vouch }>("/api/vouches", {
    voucheeId,
    scope,
  });
  return res.vouch;
}

/**
 * Get vouches received by a user (public)
 */
export async function getVouchesReceived(userId: string): Promise<Vouch[]> {
  const res = await dotApi.get<{ vouches: Vouch[] }>(`/api/vouches/received/${userId}`);
  return res.vouches;
}

/**
 * Get vouches given by a user (public)
 */
export async function getVouchesGiven(userId: string): Promise<Vouch[]> {
  const res = await dotApi.get<{ vouches: Vouch[] }>(`/api/vouches/given/${userId}`);
  return res.vouches;
}

/**
 * Revoke a vouch (only vouch creator can revoke)
 */
export async function revokeVouch(vouchId: string): Promise<{ ok: boolean }> {
  return dotApi.delete(`/api/vouches/${vouchId}`);
}

/**
 * Get aggregated vouch statistics for a user (public)
 */
export async function getVouchStats(userId: string): Promise<VouchStats> {
  const res = await dotApi.get<{ stats: VouchStats }>(`/api/vouches/stats/${userId}`);
  return res.stats;
}
