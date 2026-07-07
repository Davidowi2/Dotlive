/**
 * Notifications API client.
 * Mirrors /api/notifications on the backend.
 */
import { dotApi } from "./client";

export type NotificationType =
  | "transfer_received"
  | "transfer_sent"
  | "deposit_confirmed"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "meeting_requested"
  | "meeting_accepted"
  | "role_granted"
  | "job_posted"
  | "job_application_received"
  | "service_purchased"
  | "order_disputed"
  | "community_invite"
  | "community_post"
  | "community_member_joined"
  | "community_challenge_won"
  | "venture_published"
  | "venture_followed"
  | "certificate_issued"
  | "pitchathon_judge_assigned"
  | "pitchathon_submission_received"
  | "mention"
  | "system";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  icon: string | null;
  read: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface NotificationFeed {
  items: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
}

export async function fetchNotifications(params?: {
  limit?: number;
  tab?: "all" | "unread" | "archived";
  unreadOnly?: boolean;
  cursor?: string;
}): Promise<NotificationFeed> {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.tab) search.set("tab", params.tab);
  if (params?.unreadOnly) search.set("unreadOnly", "true");
  if (params?.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  return dotApi.get<NotificationFeed>(`/api/notifications${qs ? "?" + qs : ""}`);
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await dotApi.get<{ unreadCount: number }>("/api/notifications/unread-count");
  return res.unreadCount;
}

export async function markRead(id: string): Promise<void> {
  await dotApi.post(`/api/notifications/${id}/read`, {});
}

export async function markUnread(id: string): Promise<void> {
  await dotApi.post(`/api/notifications/${id}/unread`, {});
}

export async function archive(id: string): Promise<void> {
  await dotApi.post(`/api/notifications/${id}/archive`, {});
}

export async function unarchive(id: string): Promise<void> {
  await dotApi.post(`/api/notifications/${id}/unarchive`, {});
}

export async function markAllRead(): Promise<void> {
  await dotApi.post("/api/notifications/read-all", {});
}
