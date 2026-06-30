import { dotApi } from "./client";

export interface Leader {
  id: string;
  name: string | null;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  dot_balance: string | number;
  dot_earned: string | number;
  contracts_completed: number;
  reputation: number;
}

export async function getLeaderboard(
  sort: "earnings" | "contracts" | "reputation" = "earnings",
  window: "all" | "monthly" | "weekly" | "daily" = "all",
) {
  const qs = new URLSearchParams({ sort, window });
  const res = await dotApi.get<{ sort: string; window: string; leaders: Leader[] }>(
    `/api/leaderboard?${qs.toString()}`,
  );
  return res;
}
