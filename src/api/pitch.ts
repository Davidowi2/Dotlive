/**
 * Pitch Deck API — wraps the Fastify /api/pitch-decks/* endpoints.
 */

import { dotApi } from "@/api/client";

export interface PitchDeck {
  id: string;
  ventureId: string;
  title: string;
  description: string | null;
  url: string;
  version: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PitchDeckVersion {
  version: number;
  url: string;
  title: string;
  updatedAt: string;
}

export interface CreatePitchDeckInput {
  ventureId: string;
  title: string;
  description?: string;
  url: string;
}

export interface UpdatePitchDeckInput {
  title?: string;
  description?: string;
  url?: string;
  isPublic?: boolean;
}

export interface LeaderboardEntry {
  application: {
    id: string;
    pitchathonId: string;
    founderId: string;
    ventureName: string | null;
    pitchDeckUrl: string | null;
    fundingAsk: number | null;
    status: string;
    createdAt: string;
  };
  scoreCount: number;
  avgScore: number;
  scores: Array<{
    id: string;
    score: number;
    note: string | null;
  }>;
}

/**
 * GET /api/pitch-decks — List all pitch decks for the authenticated user's ventures.
 */
export async function listPitchDecks(): Promise<PitchDeck[]> {
  const res = await dotApi.get<{ pitchDecks: PitchDeck[] }>("/api/pitch-decks");
  return res.pitchDecks ?? [];
}

/**
 * GET /api/pitch-decks/:id — Get a single pitch deck (public or owned).
 */
export async function getPitchDeck(id: string): Promise<PitchDeck> {
  const res = await dotApi.get<{ pitchDeck: PitchDeck }>(`/api/pitch-decks/${id}`);
  return res.pitchDeck;
}

/**
 * POST /api/pitch-decks — Create a new pitch deck.
 */
export async function createPitchDeck(data: CreatePitchDeckInput): Promise<PitchDeck> {
  const res = await dotApi.post<{ pitchDeck: PitchDeck }>("/api/pitch-decks", data);
  return res.pitchDeck;
}

/**
 * PUT /api/pitch-decks/:id — Update a pitch deck.
 */
export async function updatePitchDeck(id: string, data: UpdatePitchDeckInput): Promise<PitchDeck> {
  const res = await dotApi.put<{ pitchDeck: PitchDeck }>(`/api/pitch-decks/${id}`, data);
  return res.pitchDeck;
}

/**
 * DELETE /api/pitch-decks/:id — Delete a pitch deck.
 */
export async function deletePitchDeck(id: string): Promise<void> {
  await dotApi.delete<{ success: boolean }>(`/api/pitch-decks/${id}`);
}

/**
 * GET /api/pitch-decks/:id/versions — Get version history of a pitch deck.
 */
export async function getPitchDeckVersions(id: string): Promise<PitchDeckVersion[]> {
  const res = await dotApi.get<{ versions: PitchDeckVersion[] }>(`/api/pitch-decks/${id}/versions`);
  return res.versions ?? [];
}

/**
 * GET /api/pitchathons/:id/leaderboard-enhanced — Enhanced leaderboard with scores.
 */
export async function getPitchathonLeaderboardEnhanced(pitchathonId: string): Promise<LeaderboardEntry[]> {
  const res = await dotApi.get<{ leaderboard: LeaderboardEntry[] }>(
    `/api/pitchathons/${pitchathonId}/leaderboard-enhanced`
  );
  return res.leaderboard ?? [];
}
