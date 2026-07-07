/**
 * useMeetings hook — manage meeting state and operations.
 */

import { useCallback, useEffect, useState } from "react";
import type { Meeting, MeetingSlot } from "@/api/meetings";
import * as meetingsApi from "@/api/meetings";

export interface UseMeetingsReturn {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSlot: (data: Parameters<typeof meetingsApi.createSlot>[0]) => Promise<MeetingSlot>;
  requestMeeting: (data: Parameters<typeof meetingsApi.requestMeeting>[0]) => Promise<Meeting>;
  confirmMeeting: (id: string) => Promise<Meeting>;
  declineMeeting: (id: string, reason?: string) => Promise<Meeting>;
  cancelMeeting: (id: string, reason?: string) => Promise<Meeting>;
}

export function useMyMeetings(status?: "upcoming" | "past"): UseMeetingsReturn {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await meetingsApi.getMyMeetings(status);
      setMeetings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const createSlot = useCallback(async (data: Parameters<typeof meetingsApi.createSlot>[0]) => {
    const slot = await meetingsApi.createSlot(data);
    await fetchMeetings();
    return slot;
  }, [fetchMeetings]);

  const requestMeeting = useCallback(async (data: Parameters<typeof meetingsApi.requestMeeting>[0]) => {
    const meeting = await meetingsApi.requestMeeting(data);
    await fetchMeetings();
    return meeting;
  }, [fetchMeetings]);

  const confirmMeeting = useCallback(async (id: string) => {
    const meeting = await meetingsApi.confirmMeeting(id);
    await fetchMeetings();
    return meeting;
  }, [fetchMeetings]);

  const declineMeeting = useCallback(async (id: string, reason?: string) => {
    const meeting = await meetingsApi.declineMeeting(id, reason);
    await fetchMeetings();
    return meeting;
  }, [fetchMeetings]);

  const cancelMeeting = useCallback(async (id: string, reason?: string) => {
    const meeting = await meetingsApi.cancelMeeting(id, reason);
    await fetchMeetings();
    return meeting;
  }, [fetchMeetings]);

  return {
    meetings,
    loading,
    error,
    refetch: fetchMeetings,
    createSlot,
    requestMeeting,
    confirmMeeting,
    declineMeeting,
    cancelMeeting,
  };
}

export function useAvailableSlots(options?: {
  hostId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}) {
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await meetingsApi.getAvailableSlots(options);
      setSlots(data);
    } catch (err: any) {
      setError(err.message || "Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [options?.hostId, options?.date, options?.startDate, options?.endDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return {
    slots,
    loading,
    error,
    refetch: fetchSlots,
  };
}
