import { FastifyInstance } from "fastify";
import { and, eq, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  connections,
  connectionMessages,
  users,
} from "../db/schema.js";
import { notify } from "../lib/notify.js";

type WSConnection = {
  socket: WebSocket;
  userId: string;
  subscriptions: Set<string>;
  alive: boolean;
};

const clients = new Map<WebSocket, WSConnection>();

function broadcastToThread(threadId: string, senderId: string, message: unknown) {
  for (const [socket, meta] of clients.entries()) {
    if (!meta.alive) continue;
    if (!meta.subscriptions.has(threadId)) continue;
    if (meta.userId === senderId) continue;
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // Consumer is gone; cleanup on next close event.
    }
  }
}

async function markMessagesRead(threadId: string, userId: string, messageIds: string[]) {
  await db
    .update(connectionMessages)
    .set({ readAt: new Date() } as any)
    .where(
      and(
        eq(connectionMessages.connectionId, threadId),
        sql`${connectionMessages.id} = ANY(${messageIds}::uuid[])`,
        sql`${connectionMessages.senderId} != ${userId}`,
      ),
    );
}

export async function wsRoutes(app: FastifyInstance) {
  app.register(import("@fastify/websocket") as any);

  app.get(
    "/ws/connect",
    { websocket: true },
    (connection: any, req: any) => {
      const token = (req.query as any)?.token as string | undefined;
      let userId = "";

      try {
        const payload = (req as any).jwtVerify?.(token) as { sub?: string };
        userId = String(payload?.sub ?? "");
      } catch {
        connection.socket.close(1008, "Unauthorized");
        return;
      }

      const meta: WSConnection = {
        socket: connection.socket,
        userId,
        subscriptions: new Set<string>(),
        alive: true,
      };
      clients.set(connection.socket, meta);

      connection.socket.on("message", async (msg: any) => {
        try {
          msg = JSON.parse(String(msg));
        } catch {
          return;
        }

        switch (msg.type) {
          case "subscribe:thread": {
            const threadId = String(msg.threadId ?? "");
            const meta = clients.get(connection.socket);
            if (meta && threadId) {
              meta.subscriptions.add(threadId);
              connection.socket.send(JSON.stringify({ type: "subscribed", threadId }));
            }
            break;
          }
          case "unsubscribe:thread": {
            const threadId = String(msg.threadId ?? "");
            const meta = clients.get(connection.socket);
            if (meta) meta.subscriptions.delete(threadId);
            break;
          }
          case "typing:start":
          case "typing:stop": {
            const threadId = String(msg.threadId ?? "");
            if (!threadId || !userId) break;
            broadcastToThread(threadId, userId, {
              type: "thread:typing",
              threadId,
              userId,
              isTyping: msg.type === "typing:start",
            });
            break;
          }
          case "read:mark": {
            const threadId = String(msg.threadId ?? "");
            const messageIds = Array.isArray(msg.messageIds)
              ? msg.messageIds.map((x: unknown) => String(x))
              : [];
            if (threadId && userId && messageIds.length) {
              await markMessagesRead(threadId, userId, messageIds).catch(() => {});
            }
            break;
          }
          default:
            break;
        }
      });

      connection.socket.on("close", () => {
        const meta = clients.get(connection.socket);
        if (meta) {
          meta.alive = false;
          meta.subscriptions.clear();
        }
        clients.delete(connection.socket);
      });

      connection.socket.on("error", () => {
        clients.delete(connection.socket);
      });
    },
  );
}

export async function broadcastNewMessage(threadId: string, senderId: string, message: {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
}) {
  broadcastToThread(threadId, senderId, {
    type: "thread:new-message",
    threadId,
    message,
  });
}
