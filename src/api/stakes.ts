/**
 * Stakes API client — interact with the staking system.
 *
 * Types and functions for staking DOT tokens to earn 12% APY.
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

/**
 * Get all stakes for the current user.
 */
export async function getStakes(): Promise<StakePosition[]> {
  const response = await dotApi.get<StakePosition[]>("/stakes");
  return response.data ?? [];
}

/**
 * Create a new stake (in DOT cents).
 */
export async function createStake(amount: number): Promise<StakePosition> {
  const response = await dotApi.post<StakePosition>("/stakes", { amount });
  return response.data;
}

/**
 * Start the 14-day unbonding cooldown.
 */
export async function unstake(stakeId: string): Promise<StakePosition> {
  const response = await dotApi.post<StakePosition>(`/stakes/${stakeId}/unbond`, {});
  return response.data;
}

/**
 * Claim pending rewards for a stake.
 */
export async function claimRewards(
  stakeId: string
): Promise<{ claimed: number; stake: StakePosition }> {
  const response = await dotApi.post<{ claimed: number; stake: StakePosition }>(
    `/stakes/${stakeId}/claim`,
    {}
  );
  return response.data;
}

/**
 * Complete unbond after 14-day cooldown has elapsed.
 * Withdraws the staked amount back to wallet.
 */
export async function completeUnbond(stakeId: string): Promise<StakePosition> {
  const response = await dotApi.post<StakePosition>(`/stakes/${stakeId}/complete`, {});
  return response.data;
}
