/**
 * Meetings API client — interact with the meeting scheduler.
 */

import { dotApi } from "./client";
import { asArray } from "@/lib/utils";

export interface MeetingSlot {
  id: string;
  hostId: string;
  hostName: string | null;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  status: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  slotId: string;
  hostId: string;
  guestId: string;
  title: string;
  description: string | null;
  meetingReason: string | null;
  status: string;
  scheduledAt: string;
  confirmedAt: string | null;
  declinedAt: string | null;
  declinedReason: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hostName?: string | null;
  hostEmail?: string | null;
  meetingPlatform?: string | null;
  meetingLink?: string | null;
  coordinationNotes?: string | null;
  agenda?: any[] | null;
  reminderSentAt?: string | null;
}

/**
 * Get available meeting slots
 */
export async function getAvailableSlots(options?: {
  hostId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}): Promise<MeetingSlot[]> {
  const params = new URLSearchParams();
  if (options?.hostId) params.append("hostId", options.hostId);
  if (options?.date) params.append("date", options.date);
  if (options?.startDate) params.append("startDate", options.startDate);
  if (options?.endDate) params.append("endDate", options.endDate);

  // Normalize at the API boundary — the backend used to return
  // `{ slots: [...] }` and then switched to a flat array. The page calls
  // `.filter()` directly, so it must always receive an array even if the
  // backend shape regresses or returns an error payload.
  const data = await dotApi.get<unknown>(
    `/api/meetings/slots${params.toString() ? "?" + params.toString() : ""}`
  );
  return asArray<MeetingSlot>(data);
}

/**
 * Create a new meeting slot (host only)
 */
export async function createSlot(data: {
  title?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
}): Promise<MeetingSlot> {
  return dotApi.post<MeetingSlot>("/api/meetings/slots", data);
}

/**
 * Edit a meeting slot (host only, only if available)
 */
export async function editSlot(
  id: string,
  data: {
    title?: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
  }
): Promise<MeetingSlot> {
  return dotApi.put<MeetingSlot>(`/api/meetings/slots/${id}`, data);
}

/**
 * Delete a meeting slot (host only, only if available)
 */
export async function deleteSlot(id: string): Promise<void> {
  return dotApi.delete(`/api/meetings/slots/${id}`);
}

/**
 * Request a meeting (guest only)
 */
export async function requestMeeting(data: {
  slotId: string;
  title: string;
  description?: string;
  meetingReason?: string;
}): Promise<Meeting> {
  return dotApi.post<Meeting>("/api/meetings", data);
}

/**
 * Get my meetings (as host or guest)
 */
export async function getMyMeetings(status?: "upcoming" | "past"): Promise<Meeting[]> {
  const params = status ? `?status=${status}` : "";
  // Normalize at the API boundary — see getAvailableSlots() above.
  const data = await dotApi.get<unknown>(`/api/meetings${params}`);
  return asArray<Meeting>(data);
}

/**
 * Confirm a meeting (host only)
 */
export async function confirmMeeting(id: string): Promise<Meeting> {
  return dotApi.post<Meeting>(`/api/meetings/${id}/confirm`);
}

/**
 * Decline a meeting (host only)
 */
export async function declineMeeting(id: string, reason?: string): Promise<Meeting> {
  return dotApi.post<Meeting>(`/api/meetings/${id}/decline`, { reason });
}

/**
 * Cancel a meeting (host or guest)
 */
export async function cancelMeeting(id: string, reason?: string): Promise<Meeting & { warning?: string }> {
  return dotApi.post<Meeting & { warning?: string }>(`/api/meetings/${id}/cancel`, { reason });
}

/**
 * Update meeting coordination details (host or guest)
 */
export async function updateMeetingCoordination(
  id: string, 
  data: {
    meetingPlatform?: string;
    meetingLink?: string;
    coordinationNotes?: string;
    agenda?: any[];
  }
): Promise<Meeting> {
  return dotApi.put<Meeting>(`/api/meetings/${id}/coordination`, data);
}

/**
 * Get chat messages for a meeting
 */
export async function getMeetingMessages(
  id: string
): Promise<Array<{ id: string; meetingId: string; authorId: string; body: string; createdAt: string; authorName: string | null }>> {
  return dotApi.get(`/api/meetings/${id}/chat`);
}

/**
 * Send a chat message to a meeting
 */
export async function sendMeetingMessage(
  id: string, 
  data: { body: string }
): Promise<{ id: string; meetingId: string; authorId: string; body: string; createdAt: string }> {
  return dotApi.post(`/api/meetings/${id}/chat`, data);
}
