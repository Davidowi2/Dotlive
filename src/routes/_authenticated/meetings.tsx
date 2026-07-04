/**
 * Meetings — single surface for meeting requests + chat threads.
 *
 * Tabs:
 *   1. Received — meeting requests sent to you (accept/decline)
 *   2. Sent     — meeting requests you've sent
 *   3. Conversations — active chat threads (one per accepted meeting)
 *
 * On accept of a meeting, the founder/investor can immediately chat with
 * the other party. The chat is rendered inline below the request card.
 *
 * The legacy /messages route now redirects here with ?thread=<id> so
 * any deep link / saved tab still works.
 */
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  CalendarDays,
  Inbox,
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dotApi } from "@/api/client";
import {
  listMyConnections,
  getThread,
  sendMessage,
  type Connection,
  type ConnectionMessage,
} from "@/api/connections";

type MeetingsSearch = { thread?: string };

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({ meta: [{ title: "Meetings · DOT" }] }),
  component: MeetingsPage,
  validateSearch: (search: Record<string, unknown>): MeetingsSearch => ({
    thread: typeof search.thread === "string" ? search.thread : undefined,
  }),
});

function MeetingsPage() {
  const { user, roles } = useDotAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/meetings" }) as MeetingsSearch;
  const isInvestor = roles.includes("investor");
  const isFounder = roles.includes("founder");

  // ── Meeting requests received by this founder from investors
  const { data: received = [], isLoading: rxLoading } = useQuery({
    queryKey: ["meetings-received", user?.id],
    enabled: !!user && isFounder,
    queryFn: async () => {
      const res = await dotApi.get<{ meetings: any[] }>("/api/investor/meetings?role=founder");
      return (res?.meetings ?? []).map((r) => ({ ...r, investor: null }));
    },
  });

  // ── Meeting requests sent by this investor to founders
  const { data: sent = [], isLoading: sentLoading } = useQuery({
    queryKey: ["meetings-sent", user?.id],
    enabled: !!user && isInvestor,
    queryFn: async () => {
      const res = await dotApi.get<{ meetings: any[] }>("/api/investor/meetings");
      return (res?.meetings ?? []).map((r) => ({ ...r, founder: null }));
    },
  });

  // ── Active chat threads (one per accepted meeting)
  const { data: connections = [], isLoading: connLoading } = useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user,
    queryFn: listMyConnections,
    refetchInterval: 5_000,
    staleTime: 4_000,
  });

  // When /meetings?thread=<id> opens, switch to the conversations tab
  useEffect(() => {
    if (search.thread) {
      // Tabs is uncontrolled; user can navigate. We just scroll to the thread.
      const el = document.getElementById(`thread-${search.thread}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [search.thread]);

  async function updateStatus(id: string, status: "accepted" | "declined") {
    try {
      const res = await dotApi.patch<{ ok: boolean; connectionId?: string | null }>(
        `/api/investor/meetings/${id}`,
        { status },
      );
      qc.invalidateQueries({ queryKey: ["meetings-received", user?.id] });
      qc.invalidateQueries({ queryKey: ["connections", user?.id] });
      if (status === "accepted") {
        if (res?.connectionId) {
          // Open the new conversation immediately — no hunting required.
          navigate({ to: "/meetings", search: { thread: res.connectionId } });
          toast.success("Meeting accepted. Chat is open.");
        } else {
          toast.success("Meeting accepted. Open the Conversations tab to chat.");
        }
      } else {
        toast.success("Request declined.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  }

  const pendingCount = received.filter((r) => r.status === "pending").length;
  const acceptedCount = received.filter((r) => r.status === "accepted").length;
  const activeChats = connections.filter((c) => c.status === "active").length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Capital"
        title="Meetings"
        subtitle={
          isFounder
            ? "Investor meeting requests. Accept to open a private chat and share your Vantage."
            : "Meeting requests and conversations with founders. After acceptance, chat in-line."
        }
        action={
          <Badge variant="outline" className="font-medium">
            <CalendarDays className="mr-1.5 size-3" />
            {pendingCount} pending
          </Badge>
        }
      />

      {/* Quick stats strip */}
      <section className="mt-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryTile
            icon={Inbox}
            label="Received"
            value={String(received.length)}
            sub={pendingCount > 0 ? `${pendingCount} need a reply` : "all caught up"}
            accent="primary"
          />
          <SummaryTile
            icon={CheckCircle2}
            label="Accepted"
            value={String(acceptedCount)}
            sub={isFounder ? "ready to chat" : "scheduled"}
            accent="gold"
          />
          <SummaryTile
            icon={MessageSquare}
            label="Conversations"
            value={String(activeChats)}
            sub={activeChats === 0 ? "accept a request to start" : "open chat threads"}
            accent="muted"
          />
        </div>
      </section>

      <hr className="my-10 border-border" />

      {/* Tabs: received / sent / conversations */}
      <Tabs defaultValue={search.thread ? "conversations" : "received"}>
        <TabsList>
          <TabsTrigger value="received">
            Received{" "}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="conversations">
            Conversations{" "}
            {activeChats > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {activeChats}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Received ── */}
        <TabsContent value="received" className="mt-6">
          {rxLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : received.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No meeting requests yet"
              description="When investors request meetings with you, they'll appear here. Accept to open a private chat."
              action={
                isFounder ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: "/vantage" })}
                  >
                    <Sparkles className="size-4" />
                    Improve your Vantage to be discovered
                    <ArrowRight className="size-4" />
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-4">
              {received.map((r) => (
                <article
                  key={r.id}
                  className="rounded-sm border border-border bg-card p-5 transition-all hover:border-foreground/20"
                >
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {(r.investor?.name ?? "I").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium">{r.investor?.name ?? "Investor"}</p>
                        {r.investor?.email && (
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Mail className="size-3 shrink-0" />
                            <span className="truncate">{r.investor.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {new Date(r.createdAt ?? r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </header>

                  {r.message && (
                    <blockquote className="mt-4 rounded-sm border-l-2 border-primary/40 bg-muted/40 px-4 py-3 text-sm text-foreground/90">
                      "{r.message}"
                    </blockquote>
                  )}

                  {r.status === "pending" && (
                    <footer className="mt-4 flex gap-2 border-t border-border pt-4">
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => updateStatus(r.id, "accepted")}
                      >
                        <CheckCircle2 className="size-4" />
                        Accept & open chat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(r.id, "declined")}
                      >
                        <XCircle className="size-4" />
                        Decline
                      </Button>
                    </footer>
                  )}

                  {r.status === "accepted" && (
                    <footer className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-primary" />
                        Accepted. Continue the conversation in the Conversations tab.
                      </span>
                    </footer>
                  )}
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Sent ── */}
        <TabsContent value="sent" className="mt-6">
          {sentLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : sent.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No requests sent"
              description={
                isInvestor
                  ? "Browse ventures in DOT Demo to request meetings with founders."
                  : "As a founder, you receive meeting requests — send is investor-only."
              }
            />
          ) : (
            <div className="space-y-3">
              {sent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 rounded-sm border border-border bg-card p-5 transition-all hover:border-foreground/20"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Building2 className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {r.founder?.venture_name ?? "Venture"}
                    </p>
                    <p className="flex items-center gap-3 text-xs text-muted-foreground">
                      {r.founder?.country && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {r.founder.country}
                        </span>
                      )}
                      {r.founder?.vantage_point != null && (
                        <span className="flex items-center gap-1">
                          <Sparkles className="size-3" />
                          Vantage {r.founder.vantage_point}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    <span className="hidden tabular text-xs text-muted-foreground sm:inline">
                      {new Date(r.createdAt ?? r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Conversations (active chat threads) ── */}
        <TabsContent value="conversations" className="mt-6">
          {connLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : connections.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="When you accept a meeting request, a private chat thread will appear here."
            />
          ) : (
            <div className="space-y-4">
              {connections.map((c) => (
                <ChatThreadCard
                  key={c.id}
                  connection={c}
                  currentUserId={user?.id}
                  highlight={search.thread === c.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ─── Chat thread (inline) ─────────────────────────────────────── */

function ChatThreadCard({
  connection,
  currentUserId,
  highlight,
}: {
  connection: Connection;
  currentUserId?: string;
  highlight: boolean;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["thread", connection.id],
    queryFn: () => getThread(connection.id),
    refetchInterval: 5_000,
    staleTime: 4_000,
  });

  const messages: ConnectionMessage[] = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await sendMessage(connection.id, trimmed);
      setBody("");
      qc.invalidateQueries({ queryKey: ["thread", connection.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    }
  }

  const counterpartyId =
    currentUserId === connection.userAId ? connection.userBId : connection.userAId;
  const isClosed = connection.status === "closed";

  return (
    <Card
      id={`thread-${connection.id}`}
      className={cn(
        "transition-all",
        highlight && "ring-2 ring-primary/40",
      )}
    >
      <CardContent className="p-5">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            <span className="font-medium">Conversation</span>
            <span className="text-xs text-muted-foreground">
              · with {counterpartyId.slice(0, 8)}…
            </span>
          </div>
          {isClosed && <Badge variant="secondary">closed</Badge>}
        </header>

        <div className="mt-3 max-h-80 min-h-32 space-y-2 overflow-y-auto rounded-sm border border-border/50 bg-muted/20 p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No messages yet. Say hello.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === currentUserId;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    mine ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-sm px-3 py-2 text-sm",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        mine
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-3 flex items-end gap-2"
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              isClosed ? "This conversation is closed." : "Type a message…"
            }
            disabled={isClosed}
            rows={2}
            className="min-h-10 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isClosed || !body.trim()}
          >
            <Send className="size-4" />
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ─── Internal helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "accepted"
          ? "default"
          : status === "declined"
            ? "destructive"
            : "secondary"
      }
      className="text-[10px]"
    >
      {status}
    </Badge>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "gold" | "muted";
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center",
            accent === "primary" && "text-primary",
            accent === "gold" && "text-gold",
            accent === "muted" && "text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-light leading-none tracking-tight tabular">
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
