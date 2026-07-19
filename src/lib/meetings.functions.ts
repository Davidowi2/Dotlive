import {
  getMyMeetings,
  getAvailableSlots,
  requestMeeting as apiRequestMeeting,
  confirmMeeting as apiConfirmMeeting,
  declineMeeting as apiDeclineMeeting,
  cancelMeeting as apiCancelMeeting,
  createSlot as apiCreateSlot,
  type Meeting,
  type MeetingSlot,
} from "@/api/meetings";

export async function listMeetings(): Promise<Meeting[]> {
  return await getMyMeetings();
}
export async function listMySlots(): Promise<MeetingSlot[]> {
  return await getAvailableSlots();
}
export async function requestMeeting(data: { slotId: string; title: string; description?: string; meetingReason?: string }) {
  return await apiRequestMeeting(data);
}
export async function confirmMeeting({ id }: { id: string }) {
  return await apiConfirmMeeting(id);
}
export async function declineMeeting({ id, reason }: { id: string; reason?: string }) {
  return await apiDeclineMeeting(id, reason);
}
export async function cancelMeeting({ id, reason }: { id: string; reason?: string }) {
  return await apiCancelMeeting(id, reason);
}
export async function createSlot(data: {
  title?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
}): Promise<MeetingSlot> {
  return await apiCreateSlot(data);
}

export async function rescheduleMeeting({ id, reason }: { id: string; reason?: string }) {
  return await (await import("@/api/meetings")).rescheduleMeeting ? (await import("@/api/meetings")).rescheduleMeeting({ id, reason }) : Promise.reject(new Error("rescheduleMeeting missing"));
}

export async function completeMeeting({ id }: { id: string }) {
  return await (await import("@/api/meetings")).completeMeeting({ id });
}

export async function updateMeetingCoordination(id: string, data: { meetingPlatform?: string; meetingLink?: string; coordinationNotes?: string; agenda?: any[] }) {
  return await (await import("@/api/meetings")).updateMeetingCoordination(id, data);
}

export async function getMeetingMessages(id: string) {
  return await (await import("@/api/meetings")).getMeetingMessages(id);
}

export async function sendMeetingMessage(id: string, data: { body: string }) {
  return await (await import("@/api/meetings")).sendMeetingMessage(id, data);
}
