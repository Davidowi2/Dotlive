/**
 * Demo Events & Voting API client — events, voting, and leaderboards
 */

import { dotApi } from "./client";

export interface DemoEvent {
  id: string;
  slug: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  votingOpensAt?: string;
  votingClosesAt?: string;
  tracks: ("open" | "invitational")[];
  status: "upcoming" | "registration_open" | "voting_open" | "live" | "completed";
  prizePoolDot?: number;
  livestreamUrl?: string;
  registrationFeeDot: number;
  featuredVentures: string[];
  createdAt: string;
}

export interface Vote {
  id: string;
  voterId: string;
  eventSlug: string;
  targetType: "venture" | "challenge" | "builder" | "community";
  targetId: string;
  weight: string;
  reputationAtVote: string;
  createdAt: string;
}

export interface VoteLeaderboardEntry {
  rank: number;
  targetId: string;
  targetType: string;
  totalVotes: number;
  totalWeight: number;
  targetName?: string;
}

export interface VoteResult {
  targetId: string;
  targetType: string;
  totalVotes: number;
  totalWeight: number;
  targetName?: string;
  fraudScore?: number;
}

/**
 * List all demo events (paginated)
 */
export async function listEvents(): Promise<DemoEvent[]> {
  const res = await dotApi.get<{ events: DemoEvent[] }>("/api/demo/events");
  return res.events;
}

/**
 * Get a single demo event by slug
 */
export async function getEventBySlug(slug: string): Promise<DemoEvent> {
  const res = await dotApi.get<{ event: DemoEvent; voteCounts?: any }>(
    `/api/demo/events/${slug}`
  );
  return res.event;
}

/**
 * Create a demo event (admin only)
 */
export async function createEvent(data: Partial<DemoEvent>): Promise<DemoEvent> {
  const res = await dotApi.post<{ event: DemoEvent }>("/api/demo/events", data);
  return res.event;
}

/**
 * Update a demo event (admin only)
 */
export async function updateEvent(slug: string, data: Partial<DemoEvent>): Promise<DemoEvent> {
  const res = await dotApi.put<{ event: DemoEvent }>(`/api/demo/events/${slug}`, data);
  return res.event;
}

/**
 * Cast a vote in an event (auth required)
 */
export async function castVote(
  eventSlug: string,
  targetType: "venture" | "challenge" | "builder" | "community",
  targetId: string
): Promise<Vote> {
  const res = await dotApi.post<{ vote: Vote }>("/api/votes", {
    eventSlug,
    targetType,
    targetId,
  });
  return res.vote;
}

/**
 * Get leaderboard for an event (ranked by votes and reputation weight)
 */
export async function getLeaderboard(eventSlug: string): Promise<VoteLeaderboardEntry[]> {
  const res = await dotApi.get<{ leaderboard: VoteLeaderboardEntry[] }>(
    `/api/votes/${eventSlug}/leaderboard`
  );
  return res.leaderboard;
}

/**
 * Get my votes in an event
 */
export async function getMyVotes(): Promise<Vote[]> {
  const res = await dotApi.get<{ votes: Vote[] }>("/api/votes/me");
  return res.votes;
}

/**
 * Get vote results for an event (with fraud detection)
 */
export async function getVoteResults(eventSlug: string): Promise<VoteResult[]> {
  const res = await dotApi.get<{ results: VoteResult[] }>(`/api/votes/${eventSlug}/results`);
  return res.results;
}
