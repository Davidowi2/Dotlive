/**
 * Chat thread view.
 * Polls for new messages every 5s. Both sides must be present
 * (meeting must be in 'accepted' status) to send.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, X } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDotAuth } from "@/contexts/DotAuthContext";
import {
  getThread,
  sendMessage,
  closeThread,
  type ConnectionThread,
  type ConnectionMessage,
} from "@/api/connections";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({ meta: [{ title: "Conversation · DOT" }] }),
  component: MessageThread,
});

function MessageThread() {
  const { id } = Route.useParams();
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["thread", id],
    queryFn: () => getThread(id),
    refetchInterval: 5_000,
  });

  const sendMut = useMutation({
    mutationFn: () => sendMessage(id, body),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["thread", id] });
    },
  });
  const closeMut = useMutation({
    mutationFn: () => closeThread(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thread", id] });
      qc.invalidateQueries({ queryKey: ["connections"] });
      navigate({ to: "/messages" });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages?.length]);

  if (isLoading || !data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <div className="h-12 animate-pulse rounded-2xl bg-card/40" />
          <div className="mt-4 h-96 animate-pulse rounded-2xl bg-card/40" />
        </div>
      </AppShell>
    );
  }

  const { thread, messages } = data;
  const isActive = thread.status === "active";
  const otherId = thread.userAId === user?.id ? thread.userBId : thread.userAId;

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Link
            to="/messages"
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Back to messages"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-light">
              Thread
            </h1>
            <p className="text-xs text-muted-foreground">
              With user {otherId?.slice(0, 8)}…
            </p>
          </div>
          {isActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => closeMut.mutate()}
              disabled={closeMut.isPending}
            >
              <X className="mr-1.5 size-3.5" /> Close
            </Button>
          )}
          {!isActive && (
            <span className="text-xs text-muted-foreground">Closed</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground">
              <p>Say hi.</p>
              <p className="mt-1 text-xs">
                Concrete questions get concrete answers.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  m={m}
                  mine={m.senderId === user?.id}
                />
              ))}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        {isActive ? (
          <div className="flex items-end gap-2 border-t border-border pt-3">
            <Textarea
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (body.trim() && !sendMut.isPending) {
                    sendMut.mutate();
                  }
                }
              }}
              placeholder="Type a message…"
              className="min-h-12 resize-none"
            />
            <Button
              disabled={!body.trim() || sendMut.isPending}
              onClick={() => sendMut.mutate()}
              size="icon"
              className="size-12 shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card/40 p-3 text-center text-xs text-muted-foreground">
            This thread is closed. Open a new one by accepting a meeting request.
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MessageBubble({ m, mine }: { m: ConnectionMessage; mine: boolean }) {
  return (
    <li className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          mine
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card"
        }`}
      >
        <p className="whitespace-pre-wrap">{m.body}</p>
        <p
          className={`mt-1 text-[10px] ${
            mine ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}
        >
          {new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </li>
  );
}