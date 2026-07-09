/**
 * Investor API client — saves, meetings, and investor-specific workflows
 */

import { dotApi } from "./client";

export interface InvestorSave {
  id: string;
  investorId: string;
  founderId: string;
  createdAt: string;
  founder?: {
    name: string | null;
    dotId: string;
    email: string;
  };
}

export interface MeetingRequest {
  id: string;
  investorId: string;
  founderId: string;
  topic: string;
  message?: string;
  requestedFor?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
}

/**
 * Get list of founders saved by current investor
 */
export async function getSavedFounders(): Promise<InvestorSave[]> {
  const res = await dotApi.get<{ saves: InvestorSave[] }>("/api/investor/saves");
  return res.saves;
}

/**
 * Save a founder to investor's list
 */
export async function saveFounder(founderId: string): Promise<InvestorSave> {
  const res = await dotApi.post<{ save: InvestorSave }>("/api/investor/saves", { founderId });
  return res.save;
}

/**
 * Remove a founder from investor's saved list
 */
export async function unsaveFounder(founderId: string): Promise<{ ok: boolean }> {
  return dotApi.delete(`/api/investor/saves/${founderId}`);
}

/**
 * Get all meeting requests from investors to current user (founder)
 */
export async function getMeetingRequests(): Promise<MeetingRequest[]> {
  const res = await dotApi.get<{ meetings: MeetingRequest[] }>("/api/investor/meetings");
  return res.meetings;
}

/**
 * Request a meeting with a founder (investor action)
 */
export async function requestMeeting(data: {
  founderId: string;
  topic: string;
  message?: string;
  requestedFor?: string;
}): Promise<MeetingRequest> {
  const res = await dotApi.post<{ meeting: MeetingRequest }>("/api/investor/meetings", data);
  return res.meeting;
}

/**
 * Respond to a meeting request (founder action)
 */
export async function respondToMeeting(
  meetingId: string,
  status: "accepted" | "declined"
): Promise<{ ok: boolean; connectionId?: string }> {
  return dotApi.patch(`/api/investor/meetings/${meetingId}`, { status });
}
