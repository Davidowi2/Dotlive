// Referral system — user-facing client helpers.
// Mirrors `backend/src/routes/referrals.ts`.

import { dotApi } from "./client";

export interface ReferralMe {
  code: string;
  link: string;
  count: number;
  earningsDot: string;
  referredBy: string | null;
}

export interface ReferralLeaderboardRow {
  name: string;
  dotId: string;
  referralCode: string;
  referralCount: number;
  earningsDot: string;
}

/** GET /api/referrals/me — current user's referral code + stats */
export async function getMyReferrals(): Promise<ReferralMe> {
  return dotApi.get<ReferralMe>("/api/referrals/me");
}

/** GET /api/referrals/leaderboard — top 20 referrers */
export async function getReferralLeaderboard(): Promise<{
  leaderboard: ReferralLeaderboardRow[];
}> {
  return dotApi.get<{ leaderboard: ReferralLeaderboardRow[] }>(
    "/api/referrals/leaderboard",
  );
}

/** POST /api/referrals/validate — check if a code exists (for signup pre-flight) */
export async function validateReferralCode(code: string): Promise<{
  valid: boolean;
  referrerName?: string;
  error?: string;
}> {
  return dotApi.post<{
    valid: boolean;
    referrerName?: string;
    error?: string;
  }>("/api/referrals/validate", { code });
}