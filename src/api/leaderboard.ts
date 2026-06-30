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
) {
  const res = await dotApi.get<{ sort: string; leaders: Leader[] }>(
    `/api/leaderboard?sort=${sort}&limit=50`,
  );
  return res;
}
