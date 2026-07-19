import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Clock, MessageSquare, MoreHorizontal, ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { listMyConnections, getThread, closeThread, sendMessage } from "@/api/connections";
import { ConnectModal } from "@/components/app/ConnectModal";
import { MessageComposer } from "@/components/dot-connect/MessageComposer";
import { useThreadSocket } from "@/hooks/useThreadSocket";

export const Route = createFileRoute("/_authenticated/connect")({
  head: () => ({ meta: [{ title: "Connect — DOT" }] }),
  component: ConnectPage,
});

type Thread = {
  id: string;
  status: "pending" | "active" | "closed";
  otherName: string;
  otherAvatar: string | null;
  otherRole: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

function ThreadItem({ thread, selected, onClick }: { thread: Thread; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
        selected ? "bg-muted/60" : "hover:bg-muted/40"
      }`}
    >
      <Avatar className="size-10 shrink-0">
        <AvatarImage src={thread.otherAvatar ?? undefined} />
        <AvatarFallback>{thread.otherName?.charAt(0) ?? "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{thread.otherName}</p>
          {thread.lastMessageAt && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: false })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">{thread.lastMessage ?? "No messages yet"}</p>
          {thread.unreadCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 justify-center px-1 text-[10px]">{thread.unreadCount}</Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ConnectPage() {
  const { user } = useDotAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"active" | "requests" | "archived">("active");
  const [connectTarget, setConnectTarget] = useState<{ userId: string; userName: string; role: string; vantage: number } | null>(null);

  const threadsQ = useQuery({
    queryKey: ["connections"],
    enabled: !!user,
    queryFn: async () => {
      const data = await listMyConnections();
      return data.filter((t) => {
        const otherId = t.userAId === user?.id ? t.userBId : t.userAId;
        const name = (t as any).otherName ?? "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    },
  });

  const selectedThreadQ = useQuery({
    queryKey: ["connection", selectedThreadId],
    enabled: !!selectedThreadId,
    queryFn: async () => {
      if (!selectedThreadId) return null;
      const res = await getThread(selectedThreadId);
      return res as unknown as { thread: Thread; messages: any[] };
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      sendMessage(threadId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connection"] });
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: () => toast.error("Failed to send"),
  });

  const closeMutation = useMutation({
    mutationFn: (threadId: string) => closeThread(threadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Thread closed");
    },
  });

  useEffect(() => {
    const id = router.state.location.search.thread as string | undefined;
    if (id && threadsQ.data?.some((t) => t.id === id)) {
      setSelectedThreadId(id);
    }
  }, [router.state.location.search, threadsQ.data]);

  const threads = threadsQ.data ?? [];
  const sections = useMemo(() => ({
    requests: threads.filter((t) => t.status === "pending"),
    active: threads.filter((t) => t.status === "active"),
    archived: threads.filter((t) => t.status === "closed"),
  }), [threads]);

  const activeList = sections[activeSection];
  const activeThread = selectedThreadQ.data;
  const baseMessages = activeThread?.messages ?? [];

  const { messages: wsMessages, typing, connected } = useThreadSocket(selectedThreadId ?? "");
  const messages = useMemo(() => {
    if (!selectedThreadId) return baseMessages;
    const map = new Map(baseMessages.map((m: any) => [m.id, m]));
    for (const m of wsMessages) map.set(m.id, m);
    return Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [baseMessages, wsMessages, selectedThreadId]);

  if (!user) return null;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          <div className="lg:col-span-1 flex flex-col border rounded-xl overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search connections..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-1 mt-3">
                {(["active", "requests", "archived"] as const).map((section) => (
                  <Button
                    key={section}
                    size="sm"
                    variant={activeSection === section ? "secondary" : "ghost"}
                    onClick={() => setActiveSection(section)}
                    className="flex-1 h-7 text-[11px]"
                  >
                    {section === "requests" && <MessageSquare className="mr-1 size-3" />}
                    {section === "archived" && <Clock className="mr-1 size-3" />}
                    {section === "active" && <MessageSquare className="mr-1 size-3" />}
                    {section}
                    <Badge variant="muted" className="ml-1 h-4 min-w-4 justify-center px-1 text-[9px]">
                      {sections[section].length}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {threadsQ.isLoading ? (
                <div className="p-3 space-y-2">
                  {[0,1,2].map((i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : activeList.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">No {activeSection} yet</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {activeList.map((thread) => (
                    <ThreadItem
                      key={thread.id}
                      thread={thread as Thread}
                      selected={selectedThreadId === thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="lg:col-span-2 border rounded-xl overflow-hidden flex flex-col">
            {selectedThreadId && activeThread ? (
              <>
                <div className="flex items-center gap-3 p-4 border-b">
                  <Avatar className="size-10">
                    <AvatarImage src={(activeThread.thread as any).otherAvatar ?? undefined} />
                    <AvatarFallback>{(activeThread.thread as any).otherName?.charAt(0) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{(activeThread.thread as any).otherName}</p>
                    <p className="text-xs text-muted-foreground">{(activeThread.thread as any).otherRole ?? "Member"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.message("Coming soon")}>Schedule meeting</Button>
                    <Button size="sm" variant="ghost" onClick={() => toast.message("Coming soon")}>Profile</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Close this thread?")) closeMutation.mutate(selectedThreadId);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <p className="text-xs text-muted-foreground">No messages yet. Say hello.</p>
                    )}
                    {typing && (
                      <p className="text-xs text-muted-foreground italic">Someone is typing...</p>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.senderId === user.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.senderId === user.id ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-[10px] opacity-70">{new Date(m.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            {m.senderId === user.id && (
                              <span className="text-[10px] opacity-80">{m.readAt ? "Read" : "Sent"}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t">
                  <MessageComposer
                    threadId={selectedThreadId}
                    onMessageSent={(msg) => {
                      qc.setQueryData(["connection", selectedThreadId], (old: any) => ({
                        ...old,
                        messages: [...(old?.messages ?? []), msg],
                      }));
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">Select a conversation to start messaging.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
