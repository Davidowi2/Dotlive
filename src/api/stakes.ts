import { dotApi } from "@/api/client";

export interface StakePosition {
  id: string;
  amount: string;
  apyPct: number;
  status: "active" | "unstaking" | "unstaked" | "claimed";
  createdAt: string;
  lockEndsAt: string | null;
  claimedAt: string | null;
  rewardAccrued: string;
  rewardClaimed: string;
}

export interface StakeSummary {
  activeStakeCount: number;
  totalStaked: string;
  totalRewarded: string;
  totalUnstaked: string;
}

/** List my stakes */
export async function getStakes(): Promise<StakePosition[]> {
  const res = await dotApi.get<{ stakes: StakePosition[] }>("/api/stakes");
  return res.stakes;
}

/** Stake DOT */
export async function createStake(input: {
  amount: number;
  lockDays?: number;
}): Promise<{ ok: boolean; stake: StakePosition }> {
  return dotApi.post("/api/stakes", input);
}

/** Begin unstaking */
export async function unstake(stakeId: string): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/stakes/${stakeId}/unstake`);
}

/** Claim matured rewards */
export async function claimRewards(stakeId: string): Promise<{ ok: boolean; claimed: string }> {
  return dotApi.post(`/api/stakes/${stakeId}/claim`);
}
