/**
 * Community Challenges API client.
 * Routes are prefixed /api/challenges on the backend.
 */
import { dotApi } from "./client";

const BASE = "/api/challenges";

export interface Challenge {
  id: string;
  communityId: string;
  postedByUserId: string;
  title: string;
  description: string;
  prizeDot: string;
  prizeTotalDot: string;
  deadline: string;
  maxWinners: number;
  status: "draft" | "open" | "judging" | "awarded" | "cancelled";
  escrowReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  body: string;
  attachmentUrl?: string | null;
  status: "submitted" | "winner" | "refused";
  winningRank?: number | null;
  payoutDot?: string | null;
  submittedAt: string;
  decidedAt?: string | null;
}

export async function listChallenges(communityId: string, status?: string) {
  const res = await dotApi.get<{ challenges: Challenge[] }>(
    `${BASE}?communityId=${encodeURIComponent(communityId)}${status ? `&status=${status}` : ""}`,
  );
  return res.challenges ?? [];
}

export async function getChallenge(id: string) {
  return dotApi.get<{ challenge: Challenge; submissions: ChallengeSubmission[] }>(`${BASE}/${id}`);
}

export async function createChallenge(input: {
  communityId: string;
  title: string;
  description: string;
  prizeDot: number;
  maxWinners: number;
  deadline: string;
}) {
  const res = await dotApi.post<{ challenge: Challenge }>(BASE, input);
  return res.challenge;
}

export async function cancelChallenge(challengeId: string) {
  await dotApi.post(`${BASE}/${challengeId}/cancel`);
}

export async function submitToChallenge(
  challengeId: string,
  input: { body: string; attachmentUrl?: string },
) {
  const res = await dotApi.post<{ submission: ChallengeSubmission }>(`${BASE}/${challengeId}/submit`, input);
  return res.submission;
}

export async function awardChallenge(challengeId: string, winnerUserIds: string[]) {
  await dotApi.post(`${BASE}/${challengeId}/award`, { winnerUserIds });
}
