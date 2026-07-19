/**
 * Stakes API client — interact with the staking system.
 *
 * 12% APY was removed in B1.10. Stakes now unlock tier benefits.
 */

import { dotApi } from "./client";

export interface StakePosition {
  id: string;
  userId: string;
  amount: number; // DOT in cents/kobo
  rewardClaimed: number;
  rewardAccrued: number;
  status: "active" | "unstaking" | "withdrawn";
  stakedAt: string;
  unbondedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StakerTier = {
  name: string;
  level: number;
  benefits: string[];
};

export interface StakesResponse {
  stakes: StakePosition[];
  tier: StakerTier;
}

/** Get all stakes for the current user. */
export async function getStakes(): Promise<StakesResponse> {
  return dotApi.get<StakesResponse>("/api/stakes");
}

/** Create a new stake (in whole DOT). */
export async function createStake(data: { amount: number }): Promise<StakePosition> {
  return dotApi.post<StakePosition>("/api/stakes", data);
}

/** Start the 14-day unbonding cooldown. */
export async function unstake(stakeId: string): Promise<StakePosition> {
  return dotApi.post<StakePosition>(`/api/stakes/${stakeId}/unbond`, {});
}

/** Claim pending rewards for a stake. */
export async function claimRewards(
  stakeId: string
): Promise<{ claimed: number; stake: StakePosition }> {
  return dotApi.post<{ claimed: number; stake: StakePosition }>(
    `/api/stakes/${stakeId}/claim`,
    {}
  );
}

/** Complete unbond after 14-day cooldown has elapsed. */
export async function completeUnbond(stakeId: string): Promise<StakePosition> {
  return dotApi.post<StakePosition>(`/api/stakes/${stakeId}/complete`, {});
}
