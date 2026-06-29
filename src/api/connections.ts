/**
 * Connections (chat threads) API client.
 */
import { dotApi } from "./client";

export interface Connection {
  id: string;
  userAId: string;
  userBId: string;
  status: "pending" | "active" | "closed";
  meetingId: string | null;
  initiatedBy: string;
  createdAt: string;
  closedAt: string | null;
}

export interface ConnectionMessage {
  id: string;
  connectionId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface ConnectionThread extends Connection {}

export async function listMyConnections() {
  const res = await dotApi.get<{ connections: Connection[] }>("/api/connections");
  return res.connections ?? [];
}

export async function getThread(id: string) {
  const res = await dotApi.get<{ thread: ConnectionThread; messages: ConnectionMessage[] }>(
    `/api/connections/${id}`,
  );
  return res;
}

export async function sendMessage(connectionId: string, body: string) {
  const res = await dotApi.post<{ message: ConnectionMessage }>(
    `/api/connections/${connectionId}/messages`,
    { body },
  );
  return res.message;
}

export async function closeThread(connectionId: string) {
  await dotApi.post(`/api/connections/${connectionId}/close`);
}
