import {
  getMyMeetings,
  getAvailableSlots,
  requestMeeting as apiRequestMeeting,
  confirmMeeting as apiConfirmMeeting,
  declineMeeting as apiDeclineMeeting,
  cancelMeeting as apiCancelMeeting,
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
