import { useEffect, useRef, useState, useCallback } from "react";
import { useDotAuth } from "@/contexts/DotAuthContext";

type WSMessage =
  | { type: "subscribed"; threadId: string }
  | { type: "thread:new-message"; threadId: string; message: { id: string; body: string; createdAt: string; senderId: string } }
  | { type: "thread:typing"; threadId: string; userId: string; isTyping: boolean };

type ThreadNewMessage = Extract<WSMessage, { type: "thread:new-message" }>;
type ThreadMessage = ThreadNewMessage["message"];

export function useThreadSocket(threadId: string) {
  const { token } = useDotAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [typing, setTyping] = useState<{ userId: string; isTyping: boolean } | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!threadId || !token) return;
    const ws = new WebSocket(`ws://${window.location.host}/ws/connect?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "subscribe:thread", threadId }));
    };

    ws.onmessage = (event) => {
      let msg: WSMessage;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }
      if (msg.type === "thread:new-message" && msg.threadId === threadId) {
        setMessages((prev) => [...prev, msg.message]);
      }
      if (msg.type === "thread:typing" && msg.threadId === threadId && msg.userId !== (token ? "" : msg.userId)) {
        setTyping({ userId: msg.userId, isTyping: msg.isTyping });
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(() => connect(), 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [threadId, token]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { messages, typing, connected, ws: wsRef.current };
}
