// Referral system — user-facing client helpers.
// Mirrors `backend/src/routes/referrals.ts`.

import { dotApi } from "./client";

/* ── Type Definitions ─────────────────────────────────────── */

export type ReferralStatus = "pending" | "completed" | "rewarded";

export interface Referral {
  id: string;
  refereeId: string;
  refereeName: string;
  refereeEmail: string;
  vantageScore: number;
  status: ReferralStatus;
  rewardClaimed: boolean;
  claimedAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ReferrerInfo {
  id: string;
  name: string;
  code: string;
  totalReferrals: number;
  completedReferrals: number;
  pendingRewards: number;
  claimedRewards: number;
}

export interface Pagination {
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

export interface GetMyReferralsResponse {
  referrer: ReferrerInfo;
  referrals: Referral[];
  pagination: Pagination;
}

export interface ReferralLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  avatar: string | null;
  totalReferrals: number;
  completedReferrals: number;
  earnedRewards: number;
}

export interface UserRank {
  rank: number;
  completedReferrals: number;
}

export interface GetReferralLeaderboardResponse {
  leaderboard: ReferralLeaderboardEntry[];
  userRank: UserRank | null;
  pagination: Pagination;
}

export interface ValidateReferralCodeResponse {
  code: string;
  referrerId: string;
  referrerName: string;
  isValid: boolean;
}

export interface ClaimReferralResponse {
  referralId: string;
  status: ReferralStatus;
  rewardAmount: number;
  claimedAt: string;
}

export interface GenerateReferralCodeResponse {
  code: string;
  generatedAt: string;
}

/* ── API Functions ────────────────────────────────────────── */

/**
 * GET /api/referrals/my — Get current user's referrals with stats
 * @param status - Filter by referral status (pending, completed, rewarded)
 * @param limit - Number of results per page (default: 50)
 * @param offset - Pagination offset (default: 0)
 */
export async function getMyReferrals(
  status?: ReferralStatus,
  limit: number = 50,
  offset: number = 0,
): Promise<GetMyReferralsResponse> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("limit", Math.min(limit, 100).toString());
  params.append("offset", offset.toString());

  const queryString = params.toString();
  const path = `/api/referrals/my${queryString ? `?${queryString}` : ""}`;

  return dotApi.get<GetMyReferralsResponse>(path);
}

/**
 * GET /api/referrals/leaderboard — Get top referrers leaderboard
 * @param limit - Number of results per page (default: 20)
 * @param offset - Pagination offset (default: 0)
 */
export async function getReferralLeaderboard(
  limit: number = 20,
  offset: number = 0,
): Promise<GetReferralLeaderboardResponse> {
  const params = new URLSearchParams();
  params.append("limit", Math.min(limit, 100).toString());
  params.append("offset", offset.toString());

  return dotApi.get<GetReferralLeaderboardResponse>(
    `/api/referrals/leaderboard?${params.toString()}`,
  );
}

/**
 * GET /api/referrals/:code — Validate referral code (public endpoint)
 * @param code - Referral code to validate
 * @throws ApiError with 404 status if code not found
 */
export async function validateReferralCode(
  code: string,
): Promise<ValidateReferralCodeResponse> {
  if (!code || typeof code !== "string") {
    throw new Error("Invalid referral code format");
  }

  try {
    return await dotApi.get<ValidateReferralCodeResponse>(
      `/api/referrals/${encodeURIComponent(code)}`,
    );
  } catch (error: any) {
    // 404 means code not found - treat as invalid but not an error
    if (error.status === 404) {
      throw new Error(`Referral code "${code}" not found`);
    }
    throw error;
  }
}

/**
 * POST /api/referrals/claim/:id — Claim reward for completed referral
 * @param referralId - ID of the referral to claim reward for
 * @throws ApiError with appropriate status (403, 409) for validation errors
 */
export async function claimReferral(
  referralId: string,
): Promise<ClaimReferralResponse> {
  if (!referralId) {
    throw new Error("Referral ID is required");
  }

  try {
    return await dotApi.post<ClaimReferralResponse>(
      `/api/referrals/claim/${encodeURIComponent(referralId)}`,
      {},
    );
  } catch (error: any) {
    // Provide user-friendly error messages
    if (error.status === 403) {
      throw new Error("You don't have permission to claim this referral");
    }
    if (error.status === 409) {
      throw new Error("This referral is not eligible for claiming yet");
    }
    throw error;
  }
}

/**
 * POST /api/referrals/generate — Generate new referral code
 * @throws ApiError with 429 if rate limited (max 1 per week)
 */
export async function generateReferralCode(): Promise<GenerateReferralCodeResponse> {
  try {
    return await dotApi.post<GenerateReferralCodeResponse>(
      "/api/referrals/generate",
      {},
    );
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error("You can only generate a new code once per week");
    }
    throw error;
  }
}