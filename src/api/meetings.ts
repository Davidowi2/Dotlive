/**
 * Meetings API client — interact with the meeting scheduler.
 */

import { dotApi } from "./client";

export interface MeetingSlot {
  id: string;
  hostId: string;
  hostName: string | null;
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
  createdAt: string;
  hostName?: string | null;
  hostEmail?: string | null;
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

  const response = await dotApi.get<MeetingSlot[]>(
    `/meetings/slots${params.toString() ? "?" + params.toString() : ""}`
  );
  return response.data ?? [];
}

/**
 * Create a new meeting slot (host only)
 */
export async function createSlot(data: {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
}): Promise<MeetingSlot> {
  const response = await dotApi.post<MeetingSlot>("/meetings/slots", data);
  return response.data;
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
  const response = await dotApi.post<Meeting>("/meetings", data);
  return response.data;
}

/**
 * Get my meetings (as host or guest)
 */
export async function getMyMeetings(status?: "upcoming" | "past"): Promise<Meeting[]> {
  const params = status ? `?status=${status}` : "";
  const response = await dotApi.get<Meeting[]>(`/meetings${params}`);
  return response.data ?? [];
}

/**
 * Confirm a meeting (host only)
 */
export async function confirmMeeting(id: string): Promise<Meeting> {
  const response = await dotApi.post<Meeting>(`/meetings/${id}/confirm`);
  return response.data;
}

/**
 * Decline a meeting (host only)
 */
export async function declineMeeting(id: string, reason?: string): Promise<Meeting> {
  const response = await dotApi.post<Meeting>(`/meetings/${id}/decline`, { reason });
  return response.data;
}

/**
 * Cancel a meeting (host or guest)
 */
export async function cancelMeeting(id: string, reason?: string): Promise<Meeting & { warning?: string }> {
  const response = await dotApi.post<Meeting & { warning?: string }>(`/meetings/${id}/cancel`, { reason });
  return response.data;
}
