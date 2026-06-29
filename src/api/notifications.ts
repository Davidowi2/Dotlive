/**
 * Notifications API client.
 * Mirrors /api/notifications on the backend.
 */
import { dotApi } from "./client";

export type NotificationType =
  | "transfer_received"
  | "transfer_sent"
  | "job_posted"
  | "job_application_received"
  | "service_purchased"
  | "order_disputed"
  | "community_invite"
  | "community_post"
  | "community_member_joined"
  | "venture_published"
  | "venture_followed"
  | "certificate_issued"
  | "withdrawal_approved"
  | "withdrawal_rejected"
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
  createdAt: string;
}

export interface NotificationFeed {
  items: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
}

export async function fetchNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
  cursor?: string;
}): Promise<NotificationFeed> {
  const search = new URLSearchParams();
  if (params?.limit) search.set("limit", String(params.limit));
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

export async function markAllRead(): Promise<void> {
  await dotApi.post("/api/notifications/read-all", {});
}
