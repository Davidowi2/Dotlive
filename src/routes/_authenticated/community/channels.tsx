/**
 * Community Channels — Discord-style 3-column layout.
 *
 * Path: /community/channels (when user is a member of a community)
 * Path: /community/channels/$id (specific community)
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Hash, Megaphone, HelpCircle, Plus, Send, Smile,
  Pin, MessageSquare, Users, Loader2, ChevronRight, ChevronDown,
  ShieldCheck, BookOpen, Bell, Search, AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app/AppShell";
import { BackButton } from "@/components/app/BackButton";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import {
  listChannels, createChannel,
  listPosts, createPost, reactToPost,
  type CommunityChannel, type CommunityPost,
} from "@/api/community";
import { getMyCommunity } from "@/api/community";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community/channels")({
  head: () => ({ meta: [{ title: "Channels — DOT Community" }] }),
  component: ChannelsPage,
});

const CHANNEL_ICONS: Record<string, typeof Hash> = {
  general: Hash,
  announcements: Megaphone,
  help: HelpCircle,
  jobs: BookOpen,
  events: Bell,
};

const EMOJIS = ["❤️", "👍", "🎉", "🚀", "🙏", "🔥", "💯", "👏"];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ChannelsPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const navigate = useNavigate();
  const { user } = useDotAuth();
  const qc = useQueryClient();

  /* ------------------- get user's community ------------------- */
  const myCommQ = useQuery({
    queryKey: ["my-community"],
    queryFn: async () => {
      const r = await getMyCommunity();
      return r;
    },
  });

  // If no id in URL, default to user's community
  const communityId = params.id ?? (myCommQ.data as any)?.community?.id ?? (myCommQ.data as any)?.id;

  useEffect(() => {
    if (!params.id && communityId) {
      navigate({ to: "/community/channels", search: { id: communityId } as any, replace: true });
    }
  }, [params.id, communityId, navigate]);

  /* ------------------- channels + posts queries ------------------- */
  const channelsQ = useQuery({
    queryKey: ["channels", communityId],
    queryFn: () => listChannels(communityId!),
    enabled: !!communityId,
  });

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const channels = channelsQ.data?.channels ?? [];

  // Default to first channel when channels load
  useEffect(() => {
    if (!activeChannelId && channels.length > 0) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  const postsQ = useQuery({
    queryKey: ["posts", communityId, activeChannelId],
    queryFn: () => listPosts(communityId!, { channelId: activeChannelId ?? undefined, limit: 50 }),
    enabled: !!communityId && !!activeChannelId,
  });

  const [membersQ] = [
    // Members come from the existing /api/communities/:id/members — fetch lazily
    useQuery({
      queryKey: ["community-members", communityId],
      queryFn: async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("dot_token") ?? "" : "";
        const r = await fetch(`/api/communities/${communityId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return r.ok ? r.json() : { members: [] };
      },
      enabled: !!communityId,
    }),
  ];

  const posts = postsQ.data?.posts ?? [];
  const members: any[] = (membersQ.data as any)?.members ?? [];

  /* ------------------- post composer ------------------- */
  const [draft, setDraft] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const postM = useMutation({
    mutationFn: (body: string) => createPost(communityId!, { channelId: activeChannelId!, body }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["posts", communityId, activeChannelId] });
      qc.invalidateQueries({ queryKey: ["channels", communityId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to post"),
  });

  /* ------------------- new channel dialog ------------------- */
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const createChM = useMutation({
    mutationFn: () => createChannel(communityId!, { name: newChannelName, description: newChannelDesc }),
    onSuccess: () => {
      toast.success(`#${newChannelName} created`);
      setNewChannelOpen(false);
      setNewChannelName("");
      setNewChannelDesc("");
      qc.invalidateQueries({ queryKey: ["channels", communityId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to create channel"),
  });

  /* ------------------- reaction ------------------- */
  const reactM = useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      reactToPost(communityId!, postId, emoji),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["posts", communityId, activeChannelId] });
    },
  });

  if (!communityId) {
    return (
      <AppShell>
        <div className="mb-3">
          <BackButton label="Back" fallback="/dashboard" />
        </div>
        <PageHeader title="Community channels" subtitle="Pick a community to join the conversation" />
        <EmptyState
          icon={MessageSquare}
          title="You're not in a community yet"
          body="Join a community from Discover to start posting in channels."
          cta={{ label: "Browse communities", href: "/discover/communities" }}
        />
      </AppShell>
    );
  }

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <AppShell>
      <div className="mb-3">
        <BackButton label="Back" fallback="/community" />
      </div>
      <PageHeader
        title="Channels"
        subtitle={
          (myCommQ.data as any)?.community?.name ??
          (myCommQ.data as any)?.name ??
          "Live conversation"
        }
      />

      {/* 3-column Discord layout: channels rail / posts stream / members rail */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)_260px]">
        {/* ===================== LEFT: CHANNELS ===================== */}
        <aside className="rounded-2xl border border-border bg-card/40 p-2">
          <div className="px-2 pt-2 pb-1 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Channels
          </div>

          <nav className="flex flex-col gap-0.5">
            {channelsQ.isLoading && (
              <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading…
              </div>
            )}
            {channels.map((c) => {
              const Icon = CHANNEL_ICONS[c.name] ?? Hash;
              const active = c.id === activeChannelId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveChannelId(c.id)}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground/60")} />
                  <span className="truncate">{c.name}</span>
                  {c.recentCount > 0 && active && (
                    <span className="ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => setNewChannelOpen(true)}
            className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            New channel
          </button>
        </aside>

        {/* ===================== CENTER: POSTS ===================== */}
        <section className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card/40">
          {/* Channel header */}
          {activeChannel && (
            <header className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground/60">#</span>
                <h2 className="text-base font-semibold">{activeChannel.name}</h2>
                {activeChannel.description && (
                  <span className="ml-3 hidden text-xs text-muted-foreground sm:inline">
                    {activeChannel.description}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {activeChannel.postCount} posts
              </div>
            </header>
          )}

          {/* Posts */}
          <div className="flex-1 space-y-3 p-4">
            {postsQ.isLoading && (
              <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Loading posts…
              </div>
            )}
            {!postsQ.isLoading && posts.length === 0 && activeChannel && (
              <EmptyState
                icon={Megaphone}
                title={`Nothing in #${activeChannel.name} yet`}
                body={
                  activeChannel.name === "announcements"
                    ? "Admins post official updates here. Members will be notified."
                    : "Be the first to post in this channel."
                }
              />
            )}
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={user?.id}
                onReact={(emoji) => reactM.mutate({ postId: p.id, emoji })}
              />
            ))}
          </div>

          {/* Composer */}
          {activeChannel && !activeChannel.isAdminOnly && (
            <footer className="border-t border-border/60 p-3">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2 focus-within:border-primary/50">
                <Textarea
                  ref={composerRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message #${activeChannel.name}`}
                  rows={1}
                  className="min-h-[36px] flex-1 resize-none border-0 bg-transparent p-1 text-sm shadow-none focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (draft.trim()) postM.mutate(draft.trim());
                    }
                  }}
                />
                <Button
                  size="sm"
                  disabled={!draft.trim() || postM.isPending}
                  onClick={() => postM.mutate(draft.trim())}
                  className="h-8 rounded-lg"
                >
                  {postM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="mt-1 px-1 text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter for newline
              </div>
            </footer>
          )}
        </section>

        {/* ===================== RIGHT: MEMBERS ===================== */}
        <aside className="rounded-2xl border border-border bg-card/40 p-2">
          <div className="px-2 pt-2 pb-1 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            Members · {members.length}
          </div>
          <div className="space-y-0.5">
            {members.slice(0, 40).map((m: any) => (
              <div key={m.userId ?? m.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {(m.name ?? m.dotId ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <span className="truncate text-foreground/90">{m.name ?? m.dotId ?? "member"}</span>
              </div>
            ))}
            {members.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground">No members yet.</div>
            )}
          </div>
        </aside>
      </div>

      {/* ===================== NEW CHANNEL DIALOG ===================== */}
      {newChannelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setNewChannelOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <h3 className="text-lg font-semibold">New channel</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Channels organize the conversation. Only admins can create channels.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground/80">Name</label>
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="e.g. fundraising"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/80">Description (optional)</label>
                <Input
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setNewChannelOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!newChannelName || createChM.isPending}
                onClick={() => createChM.mutate()}
              >
                {createChM.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create channel
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ============================================================
 * PostCard — a single post in the channel stream.
 * ============================================================ */
function PostCard({
  post, currentUserId, onReact,
}: {
  post: CommunityPost;
  currentUserId?: string;
  onReact: (emoji: string) => void;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const initials = (post.authorName ?? post.authorDotId ?? "?").slice(0, 1).toUpperCase();
  const reactions = post.reactions ?? {};

  return (
    <article className="group rounded-xl border border-border/40 bg-background/40 p-3 transition-colors hover:bg-background/70">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <header className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {post.authorName ?? post.authorDotId ?? "Unknown"}
            </span>
            {post.pinned && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                <Pin className="h-2.5 w-2.5" />
                Pinned
              </span>
            )}
            <time className="text-[11px] text-muted-foreground">{timeAgo(post.createdAt)}</time>
          </header>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {post.body}
          </p>

          {/* Reactions */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                  users.includes(currentUserId ?? "")
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <span>{emoji}</span>
                <span className="text-[11px] font-medium tabular-nums">{users.length}</span>
              </button>
            ))}
            <div className="relative">
              <button
                onClick={() => setEmojiOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-card px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity hover:border-primary/40 group-hover:opacity-100"
                aria-label="Add reaction"
              >
                <Smile className="h-3 w-3" />
                React
              </button>
              {emojiOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg">
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => { onReact(e); setEmojiOpen(false); }}
                      className="rounded p-1 text-base hover:bg-muted"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {post.replyCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
