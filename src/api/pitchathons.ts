/**
 * Pitchathons API — wraps the Fastify /api/pitchathons/* endpoints.
 */
import { dotApi } from "./client";
import type { Pitchathon } from "@/types/api";

export interface PitchathonApplication {
  id: string;
  pitchathonId: string;
  founderId: string;
  ventureName: string | null;
  pitchDeckUrl: string | null;
  fundingAsk: number | null;
  status: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avg: number;
  count: number;
}

export interface ApplyData {
  ventureName: string;
  pitchDeckUrl?: string | null;
  fundingAsk?: number | null;
}

export async function listPitchathons(): Promise<Pitchathon[]> {
  const res = await dotApi.get<{ pitchathons: Pitchathon[] }>("/api/pitchathons");
  return res.pitchathons ?? [];
}

export async function getPitchathon(id: string): Promise<Pitchathon> {
  const res = await dotApi.get<{ pitchathon: Pitchathon }>(`/api/pitchathons/${id}`);
  return res.pitchathon;
}

export async function applyToPitchathon(id: string, data: ApplyData): Promise<PitchathonApplication> {
  const res = await dotApi.post<{ application: PitchathonApplication }>(
    `/api/pitchathons/${id}/apply`,
    data
  );
  return res.application;
}

export async function getLeaderboard(id: string): Promise<LeaderboardEntry[]> {
  const res = await dotApi.get<{ leaderboard: LeaderboardEntry[] }>(
    `/api/pitchathons/${id}/leaderboard`
  );
  return res.leaderboard ?? [];
}

export async function getMyApplications(): Promise<PitchathonApplication[]> {
  const res = await dotApi.get<{ applications: PitchathonApplication[] }>(
    "/api/pitchathons/applications/me"
  );
  return res.applications ?? [];
}

export async function scoreSubmission(
  pitchathonId: string,
  data: { applicationId: string; score: number; note?: string }
): Promise<any> {
  const res = await dotApi.post<{ score: any }>(`/api/pitchathons/${pitchathonId}/score`, data);
  return res.score;
}
