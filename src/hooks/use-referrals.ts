/**
 * use-referrals.ts — Custom hooks for referral system data fetching.
 * Uses React Query for caching, invalidation, and refetch support.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimReferral,
  getMyReferrals,
  getReferralLeaderboard,
  validateReferralCode,
  type ClaimReferralResponse,
  type GetMyReferralsResponse,
  type GetReferralLeaderboardResponse,
  type ReferralStatus,
  type ValidateReferralCodeResponse,
} from "@/api/referrals";

/* ── Query Key Factories ────────────────────────────────── */

const referralKeys = {
  all: () => ["referrals"],
  myReferrals: () => [...referralKeys.all(), "my"],
  myReferralsWithFilter: (status?: ReferralStatus, limit?: number, offset?: number) => [
    ...referralKeys.myReferrals(),
    { status, limit, offset },
  ],
  leaderboard: () => [...referralKeys.all(), "leaderboard"],
  leaderboardWithPagination: (limit?: number, offset?: number) => [
    ...referralKeys.leaderboard(),
    { limit, offset },
  ],
  validate: (code: string) => [...referralKeys.all(), "validate", code],
  claim: () => [...referralKeys.all(), "claim"],
};

/* ── useMyReferrals Hook ────────────────────────────────── */

export interface UseMyReferralsOptions {
  status?: ReferralStatus;
  limit?: number;
  offset?: number;
}

export interface UseMyReferralsReturn extends GetMyReferralsResponse {
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Fetch current user's referrals with optional filtering.
 * Caches for 30 seconds and supports status/limit/offset filters.
 */
export function useMyReferrals(
  options?: UseMyReferralsOptions,
): UseMyReferralsReturn {
  const { status, limit = 50, offset = 0 } = options ?? {};

  const query = useQuery({
    queryKey: referralKeys.myReferralsWithFilter(status, limit, offset),
    queryFn: async () => {
      return getMyReferrals(status, limit, offset);
    },
    staleTime: 30_000, // Cache for 30 seconds
    gcTime: 60_000, // Keep in memory for 60 seconds
    retry: 1,
  });

  return {
    referrer: query.data?.referrer ?? {
      id: "",
      name: "",
      code: "",
      totalReferrals: 0,
      completedReferrals: 0,
      pendingRewards: 0,
      claimedRewards: 0,
    },
    referrals: query.data?.referrals ?? [],
    pagination: query.data?.pagination ?? {
      total: 0,
      hasMore: false,
      limit,
      offset,
    },
    isLoading: query.isLoading,
    isValidating: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
}

/* ── useReferralLeaderboard Hook ────────────────────────── */

export interface UseReferralLeaderboardOptions {
  limit?: number;
  offset?: number;
}

export interface UseReferralLeaderboardReturn
  extends GetReferralLeaderboardResponse {
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Fetch referral leaderboard with pagination support.
 * Cached for performance, supports limit/offset pagination.
 */
export function useReferralLeaderboard(
  options?: UseReferralLeaderboardOptions,
): UseReferralLeaderboardReturn {
  const { limit = 20, offset = 0 } = options ?? {};

  const query = useQuery({
    queryKey: referralKeys.leaderboardWithPagination(limit, offset),
    queryFn: async () => {
      return getReferralLeaderboard(limit, offset);
    },
    staleTime: 60_000, // Cache for 60 seconds (leaderboard less volatile)
    gcTime: 120_000, // Keep in memory for 2 minutes
    retry: 1,
  });

  return {
    leaderboard: query.data?.leaderboard ?? [],
    userRank: query.data?.userRank ?? null,
    pagination: query.data?.pagination ?? {
      total: 0,
      hasMore: false,
      limit,
      offset,
    },
    isLoading: query.isLoading,
    isValidating: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
}

/* ── useClaimReferral Hook ──────────────────────────────── */

export interface UseClaimReferralReturn {
  claim: ClaimReferralResponse | null;
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
  mutate: (referralId: string) => Promise<ClaimReferralResponse>;
}

/**
 * Claim reward for a completed referral.
 * Invalidates useMyReferrals cache on success.
 */
export function useClaimReferral(): UseClaimReferralReturn {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (referralId: string) => {
      return claimReferral(referralId);
    },
    onSuccess: () => {
      // Invalidate all myReferrals queries to refresh data
      qc.invalidateQueries({ queryKey: referralKeys.myReferrals() });
    },
    retry: 1,
  });

  return {
    claim: mutation.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
    isSuccess: mutation.isSuccess,
    mutate: mutation.mutateAsync,
  };
}

/* ── useValidateReferralCode Hook ───────────────────────── */

export interface UseValidateReferralCodeReturn {
  isValid: boolean;
  referrerName: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Validate a referral code during sign-up flow.
 * Used to check if code exists and get referrer info.
 * Does not throw on invalid codes - returns isValid: false.
 */
export function useValidateReferralCode(
  code: string | null | undefined,
): UseValidateReferralCodeReturn {
  const query = useQuery({
    queryKey: referralKeys.validate(code ?? ""),
    queryFn: async () => {
      if (!code) throw new Error("Code is required");
      return validateReferralCode(code);
    },
    enabled: !!code && code.length > 0,
    staleTime: Infinity, // Code validation doesn't change
    retry: false, // Don't retry on 404
  });

  // Handle 404 as "invalid code" not an error
  const isInvalidCodeError =
    query.error instanceof Error &&
    (query.error.message.includes("not found") ||
      query.error.message.includes("404"));

  return {
    isValid: !isInvalidCodeError && !!query.data,
    referrerName: query.data?.referrerName ?? null,
    isLoading: query.isLoading,
    error: !isInvalidCodeError && query.error ? query.error : null,
  };
}
