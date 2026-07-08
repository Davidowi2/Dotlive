import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search, X, Filter, Briefcase, MapPin, ArrowUpRight,
  Gauge, TrendingUp, Heart, MessageCircle, Bookmark,
  Share2, Plus, Flame, Clock, Zap, Building2,
  Megaphone, Coins, MoreHorizontal, Loader2, Send,
  ChevronDown, Vote, Users, Compass, Trophy, Lock, Globe,
  ChevronRight, Award, GraduationCap,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/app/EmptyState";
import { cn } from "@/lib/utils";
import { dotApi } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/discover")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (s.tab as string | undefined) ?? "feed",
  }),
  head: () => ({ meta: [{ title: "Discover — DOT" }] }),
  component: DiscoverPage,
});

/* ── Types ───────────────────────────────────────────────────────── */
export type PostType = "gig" | "announcement" | "venture_update" | "funding" | "general";

export interface FeedPost {
  id: string;
  type: PostType;
  title?: string | null;
  body: string;
  authorId: string;
  authorName?: string | null;
  authorDotId?: string | null;
  authorAvatar?: string | null;
  authorRole?: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  tags?: string[];
  /* venture_update extras */
  ventureName?: string | null;
  ventureStage?: string | null;
  /* gig extras */
  budgetDot?: number | null;
  gigType?: string | null;
  /* funding extras */
  fundingGoal?: number | null;
  fundingRound?: string | null;
}

interface FeedComment {
  id: string;
  body: string;
  authorName?: string | null;
  authorDotId?: string | null;
  createdAt: string;
  likesCount: number;
}

/* ── API helpers ─────────────────────────────────────────────────── */
async function fetchFeed(tab: string, page = 1): Promise<{ posts: FeedPost[]; hasMore: boolean }> {
  try {
    const r = await dotApi.get<any>(`/api/feed?tab=${tab}&page=${page}&limit=20`);
    return { posts: r.posts ?? r.items ?? [], hasMore: r.hasMore ?? false };
  } catch {
    return { posts: [], hasMore: false };
  }
}

async function likePost(postId: string): Promise<void> {
  await dotApi.post(`/api/feed/${postId}/like`, {});
}

async function bookmarkPost(postId: string): Promise<void> {
  await dotApi.post(`/api/feed/${postId}/bookmark`, {});
}

async function fetchComments(postId: string): Promise<FeedComment[]> {
  try {
    const r = await dotApi.get<any>(`/api/feed/${postId}/comments`);
    return r.comments ?? r.items ?? [];
  } catch {
    return [];
  }
}

async function addComment(postId: string, body: string): Promise<FeedComment> {
  return dotApi.post<FeedComment>(`/api/feed/${postId}/comments`, { body });
}

async function createPost(data: {
  type: PostType; title?: string; body: string; tags?: string[];
  budgetDot?: number; gigType?: string; fundingGoal?: number;
}): Promise<FeedPost> {
  return dotApi.post<FeedPost>("/api/feed", data);
}

/* ── Venture browse (keep existing) ────────────────────────────── */
const STAGES = ["Assess", "Validate", "Build", "Fund", "Scale"];
const INDUSTRIES = ["Fintech","Agriculture","Commerce","Health","Energy","Education","Logistics","Media","Other"];

/* ═══════════════════ MAIN PAGE ═══════════════════════════════════ */
function DiscoverPage() {
  const search = Route.useSearch();
  const [mainTab, setMainTab] = useState<"feed" | "ventures" | "communities">(
    (search.tab === "communities" ? "communities" : search.tab === "ventures" ? "ventures" : "feed") as any
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="Network"
        title="Discover"
        subtitle="What's happening in the DOT ecosystem."
      />

      <PageIntent
        icon={<Compass className="size-5" />}
        intent="Who and what is worth your attention in the network today?"
        context="Feed, ventures, and communities — vetted by Vantage and curated for your role."
      />

      {/* Top nav tabs */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["feed", "ventures", "communities"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            className={cn(
              "rounded-full border px-3 py-1 font-medium capitalize transition-colors",
              mainTab === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
        <Link
          to="/marketplace"
          className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          Open gigs
        </Link>
      </div>

      <div className="mt-6">
        {mainTab === "feed" && <FeedTab />}
        {mainTab === "ventures" && <VenturesBrowseTab />}
        {mainTab === "communities" && <CommunitiesTab />}
      </div>
    </AppShell>
  );
}

/* ═══════════════════ FEED TAB ════════════════════════════════════ */
function FeedTab() {
  const { user } = useDotAuth();
  const [feedTab, setFeedTab] = useState<"latest" | "popular" | "trending">("latest");
  const [showCompose, setShowCompose] = useState(false);

  // Check URL for compose param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('compose') === 'true') {
      setShowCompose(true);
      params.delete('compose');
      window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params : ''));
    }
  }, []);

  // Close modal handler
  const closeCompose = () => {
    setShowCompose(false);
    const params = new URLSearchParams(window.location.search);
    params.delete('compose');
    window.history.replaceState({}, '', window.location.pathname + (params.toString() ? '?' + params : ''));
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["feed", feedTab],
    queryFn: () => fetchFeed(feedTab),
    staleTime: 30_000,
  });

  const posts = data?.posts ?? [];

  return (
    <div className="flex flex-col lg:flex-row gap-4 2xl:gap-8">
      {/* Main feed column - full width on mobile, constrained on desktop */}
      <div className="min-w-0 flex-1 space-y-4 w-full max-w-3xl mx-auto lg:mx-0 lg:w-auto">
        {/* Compose button - use anchor for navigation (onClick stripped by Lovable) */}
        <a
          id="compose-btn"
          href="?compose=true"
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/30 cursor-pointer block"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <span>Share an update, gig, or announcement…</span>
          <Plus className="ml-auto size-4 shrink-0 text-primary" />
        </a>

        {/* Feed filter tabs */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
          {(["latest", "popular", "trending"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFeedTab(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors",
                feedTab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "latest" && <Clock className="size-3" />}
              {t === "popular" && <Heart className="size-3" />}
              {t === "trending" && <Flame className="size-3" />}
              {t}
            </button>
          ))}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="Nothing here yet"
            description="Be the first to share a gig, announcement, or venture update."
            action={<a href="?compose=true" className="cursor-pointer"><Button>Post something</Button></a>}
          />
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onRefresh={refetch} />
            ))}
          </div>
        )}
      </div>

      {/* Right sidebar — trending tags - shown on large screens, collapsible on mobile */}
      <aside className="hidden w-72 shrink-0 space-y-4 lg:block xl:w-80 2xl:w-96">
        <TrendingSidebar />
      </aside>

      {/* Compose modal */}
      {showCompose && (
        <ComposeModal onClose={() => { closeCompose(); refetch(); }} />
      )}
    </div>
  );
}

/* ─── Post Card ──────────────────────────────────────────────────── */
const POST_TYPE_META: Record<PostType, { label: string; color: string; icon: any }> = {
  gig:            { label: "Gig",            color: "bg-blue-500/10 text-blue-500 border-blue-500/20",    icon: Briefcase },
  announcement:   { label: "Announcement",   color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Megaphone },
  venture_update: { label: "Venture Update", color: "bg-primary/10 text-primary border-primary/20",       icon: TrendingUp },
  funding:        { label: "Funding",        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Coins },
  general:        { label: "Post",           color: "bg-muted text-muted-foreground border-border",        icon: MessageCircle },
};

function PostCard({ post, onRefresh }: { post: FeedPost; onRefresh?: () => void }) {
  const qc = useQueryClient();
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likesCount ?? 0);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const [showComments, setShowComments] = useState(false);

  const meta = POST_TYPE_META[post.type] ?? POST_TYPE_META.general;
  const TypeIcon = meta.icon;

  const likeMut = useMutation({
    mutationFn: () => likePost(post.id),
    onMutate: () => {
      setLiked((l) => !l);
      setLikeCount((c) => liked ? c - 1 : c + 1);
    },
    onError: () => {
      setLiked((l) => !l);
      setLikeCount((c) => liked ? c + 1 : c - 1);
    },
  });

  const bookmarkMut = useMutation({
    mutationFn: () => bookmarkPost(post.id),
    onMutate: () => setBookmarked((b) => !b),
    onError: () => setBookmarked((b) => !b),
  });

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <article className="rounded-2xl border border-border bg-card transition-colors hover:border-border/80">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="size-9 shrink-0">
              <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                {(post.authorName || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {post.authorDotId ? (
                  <Link
                    to="/founder/$id"
                    params={{ id: post.authorDotId }}
                    className="text-sm font-semibold hover:underline"
                  >
                    {post.authorName ?? "Anonymous"}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold">{post.authorName ?? "Anonymous"}</span>
                )}
                {post.authorRole && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {post.authorRole}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
              </div>
              {/* Post type badge */}
              <span className={cn("mt-0.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", meta.color)}>
                <TypeIcon className="size-2.5" />
                {meta.label}
              </span>
            </div>
          </div>
          <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <MoreHorizontal className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-3 space-y-1.5">
          {post.title && <p className="font-semibold">{post.title}</p>}
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{post.body}</p>
        </div>

        {/* Type-specific extras */}
        {post.type === "gig" && (post.budgetDot || post.gigType) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.gigType && <Badge variant="outline" className="text-xs">{post.gigType}</Badge>}
            {post.budgetDot && (
              <Badge variant="outline" className="text-xs font-mono">
                <Coins className="mr-1 size-3" />{post.budgetDot} DOT
              </Badge>
            )}
          </div>
        )}
        {post.type === "funding" && post.fundingGoal && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm">
            <Coins className="size-4 text-emerald-500" />
            <span className="text-emerald-700 dark:text-emerald-400">
              Seeking <strong>{post.fundingGoal.toLocaleString()} DOT</strong>
              {post.fundingRound && ` — ${post.fundingRound}`}
            </span>
          </div>
        )}
        {post.type === "venture_update" && post.ventureName && (
          <div className="mt-2 text-xs text-muted-foreground">
            <Building2 className="mr-1 inline size-3" />
            {post.ventureName}
            {post.ventureStage && <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5">{post.ventureStage}</span>}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.tags.map((t) => (
              <span key={t} className="text-xs text-primary hover:underline cursor-pointer">#{t}</span>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
          <button
            onClick={() => likeMut.mutate()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              liked
                ? "bg-red-500/10 text-red-500"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Heart className={cn("size-3.5", liked && "fill-current")} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="size-3.5" />
            {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.origin + "/discover?post=" + post.id);
              toast.success("Link copied");
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Share2 className="size-3.5" />
          </button>
          <button
            onClick={() => bookmarkMut.mutate()}
            className={cn(
              "ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              bookmarked
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Bookmark className={cn("size-3.5", bookmarked && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && <CommentsSection postId={post.id} />}
    </article>
  );
}

/* ─── Comments Section ────────────────────────────────────────────── */
function CommentsSection({ postId }: { postId: string }) {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    staleTime: 30_000,
  });

  const submitMut = useMutation({
    mutationFn: () => addComment(postId, draft.trim()),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not post comment"),
  });

  return (
    <div className="border-t border-border/60 bg-muted/20 px-4 py-3 space-y-3">
      {/* Comment input */}
      <div className="flex gap-2">
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
            {(user?.name || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 gap-2">
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
                submitMut.mutate();
              }
            }}
            placeholder="Write a comment…"
            className="min-h-[36px] resize-none py-1.5 text-sm"
            rows={1}
          />
          <Button
            size="sm"
            disabled={!draft.trim() || submitMut.isPending}
            onClick={() => submitMut.mutate()}
            className="shrink-0"
          >
            {submitMut.isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="h-10 animate-pulse rounded bg-muted/40" />
      ) : comments.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-2">No comments yet. Be first.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="size-6 shrink-0">
                <AvatarFallback className="bg-muted text-[10px]">
                  {(c.authorName || "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-xl bg-card px-3 py-2 text-sm">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold">{c.authorName ?? "Anonymous"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-line">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Compose Modal ───────────────────────────────────────────────── */
function ComposeModal({ onClose }: { onClose: () => void }) {
  const { user } = useDotAuth();
  const [type, setType] = useState<PostType>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [budgetDot, setBudgetDot] = useState("");
  const [gigType, setGigType] = useState("One-off Project");
  const [fundingGoal, setFundingGoal] = useState("");
  const [fundingRound, setFundingRound] = useState("Pre-seed");

  const qc = useQueryClient();
  const submitMut = useMutation({
    mutationFn: () => createPost({
      type,
      title: title.trim() || undefined,
      body: body.trim(),
      tags: tags.trim() ? tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean) : [],
      ...(type === "gig" && { budgetDot: budgetDot ? Number(budgetDot) : undefined, gigType }),
      ...(type === "funding" && { fundingGoal: fundingGoal ? Number(fundingGoal) : undefined, fundingRound }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Posted!");
      onClose();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not post"),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">New post</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {/* Post type selector */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(["general", "announcement", "venture_update", "gig", "funding"] as PostType[]).map((t) => {
            const m = POST_TYPE_META[t];
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  type === t ? m.color : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {(type !== "general") && (
            <Input
              placeholder={type === "gig" ? "Gig title…" : type === "funding" ? "Round name or headline…" : "Title (optional)"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          )}
          <Textarea
            placeholder={
              type === "gig" ? "Describe the work, deliverables, and timeline…"
              : type === "announcement" ? "Share your announcement with the community…"
              : type === "venture_update" ? "What milestone, traction, or update do you want to share?"
              : type === "funding" ? "Describe your raise — what you're building, why now, what you need…"
              : "What's on your mind?"
            }
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="resize-none"
          />

          {type === "gig" && (
            <div className="flex gap-2">
              <Select value={gigType} onValueChange={setGigType}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="One-off Project">One-off Project</SelectItem>
                  <SelectItem value="Recurring Gig">Recurring Gig</SelectItem>
                  <SelectItem value="Monthly Retainer">Monthly Retainer</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Budget (DOT)"
                value={budgetDot}
                onChange={(e) => setBudgetDot(e.target.value)}
                className="w-36"
              />
            </div>
          )}

          {type === "funding" && (
            <div className="flex gap-2">
              <Select value={fundingRound} onValueChange={setFundingRound}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Pre-seed","Seed","Series A","Series B","Bridge","Grant"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Goal (DOT)"
                value={fundingGoal}
                onChange={(e) => setFundingGoal(e.target.value)}
                className="w-36"
              />
            </div>
          )}

          <Input
            placeholder="Tags — comma separated (e.g. fintech, nigeria)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!body.trim() || submitMut.isPending}
            onClick={() => submitMut.mutate()}
          >
            {submitMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Trending Sidebar ────────────────────────────────────────────── */
function TrendingSidebar() {
  const { data: trending = [] } = useQuery({
    queryKey: ["feed-trending-tags"],
    queryFn: async () => {
      try {
        const r = await dotApi.get<{ tags: { tag: string; count: number }[] }>("/api/feed/trending-tags");
        return r.tags ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 300_000, // 5 minutes
  });

  if (trending.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <Flame className="size-4 text-primary" /> Trending
      </h3>
      <div className="space-y-2">
        {trending.map((t) => (
          <div key={t.tag} className="flex items-center justify-between text-sm">
            <span className="text-primary cursor-pointer hover:underline">#{t.tag}</span>
            <span className="text-xs text-muted-foreground">{t.count} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ VENTURES BROWSE TAB ════════════════════════ */
function VenturesBrowseTab() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [sort, setSort] = useState<string>("newest");

  const filters = useMemo(() => ({
    search: query || undefined,
    stage: stage || undefined,
    industry: industry || undefined,
    country: country || undefined,
    sort,
    limit: 50,
  }), [query, stage, industry, country, sort]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["discover", filters],
    queryFn: () => dotApi.get<{ ventures: any[] }>("/api/ventures?" + new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
    ).toString()),
    staleTime: 30_000,
  });

  const ventures: any[] = (data as any)?.ventures ?? [];

  const founderIds = useMemo(() => Array.from(new Set(ventures.map((v) => v.userId))), [ventures]);
  const { data: foundersMap } = useQuery({
    queryKey: ["founders-map", founderIds],
    queryFn: async () => {
      const map: Record<string, any> = {};
      await Promise.all(
        founderIds.slice(0, 50).map(async (id) => {
          try {
            const r = await dotApi.get<any>(`/api/founders/${encodeURIComponent(id)}`);
            map[id] = { name: r.founder.name, dotId: r.founder.dotId, avatarUrl: r.founder.avatarUrl };
          } catch {}
        })
      );
      return map;
    },
    enabled: founderIds.length > 0,
    staleTime: 60_000,
  });

  const hasActiveFilters = query || stage || industry || country;

  return (
    <div className="space-y-4">
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ventures…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort by…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="vantage_desc">Highest vantage</SelectItem>
            <SelectItem value="fundability_desc">Most fundable</SelectItem>
            <SelectItem value="alpha">A → Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={stage} onValueChange={(v) => setStage(v === "__any" ? "" : v)}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
            <SelectValue placeholder="Any stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Any stage</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={industry} onValueChange={(v) => setIndustry(v === "__any" ? "" : v)}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
            <SelectValue placeholder="Any industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any">Any industry</SelectItem>
            {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Country:</span>
          <Input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Nigeria" className="h-8 w-28 text-xs" />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setStage(""); setIndustry(""); setCountry(""); }} className="h-8">
            <X className="mr-1 size-3" /> Clear
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Could not load ventures.
        </div>
      ) : ventures.length === 0 ? (
        <EmptyState
          title="No ventures found"
          description={hasActiveFilters ? "Try removing a filter." : "Be the first founder on DOT."}
          icon={Building2}
          action={
            hasActiveFilters
              ? <Button variant="outline" onClick={() => { setQuery(""); setStage(""); setIndustry(""); setCountry(""); }}>Clear filters</Button>
              : <Button asChild><Link to="/onboarding">Create your venture</Link></Button>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground"><strong>{ventures.length}</strong> ventures</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ventures.map((v) => (
              <VentureCard key={v.id} venture={v} founder={foundersMap?.[v.userId]} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VentureCard({ venture, founder }: { venture: any; founder?: any }) {
  const fundingGoal = Number(venture.fundingGoal ?? 0);
  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              to="/founder/$id"
              params={{ id: founder?.dotId ?? venture.userId }}
              className="font-display text-base font-semibold group-hover:text-primary line-clamp-1"
            >
              {venture.name}
            </Link>
            {founder && (
              <Link
                to="/founder/$id"
                params={{ id: founder.dotId ?? venture.userId }}
                className="mt-0.5 block text-xs text-muted-foreground hover:text-foreground"
              >
                by {founder.name ?? "—"}
                {founder.dotId && <span className="ml-1 font-mono opacity-60">({founder.dotId})</span>}
              </Link>
            )}
          </div>
          <Link
            to="/founder/$id"
            params={{ id: founder?.dotId ?? venture.userId }}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {venture.industry && <Badge variant="outline" className="text-[10px]"><Briefcase className="mr-1 size-3" />{venture.industry}</Badge>}
          {venture.stage && <Badge variant="secondary" className="text-[10px]">{venture.stage}</Badge>}
          {venture.country && <Badge variant="outline" className="text-[10px]"><MapPin className="mr-1 size-3" />{venture.country}</Badge>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
          <VentureStat icon={Gauge} label="Vantage" value={Number(venture.vantagePoint ?? 0).toLocaleString()} />
          <VentureStat icon={TrendingUp} label="Fundability" value={`${Number(venture.fundability ?? 0)}%`} />
        </div>

        {fundingGoal > 0 && (
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-xs text-muted-foreground">Funding goal</span>
            <span className="font-medium tabular-nums">{fundingGoal.toLocaleString()} DOT</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VentureStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />{label}
      </div>
      <div className="mt-0.5 text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

/* ═══════════════════ COMMUNITIES TAB ════════════════════════════ */
interface Community {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tier: string;
  region: string | null;
  memberCount: number;
  isPrivate?: boolean;
  createdAt: string;
  leader: { name: string | null; dotId: string } | null;
}

const COMMUNITY_TIER_META: Record<string, { label: string; className: string; icon: any }> = {
  free:       { label: "Free",       className: "bg-muted text-muted-foreground",         icon: Globe },
  verified:   { label: "Verified",   className: "bg-emerald-500/10 text-emerald-500",     icon: Award },
  campus:     { label: "Campus",     className: "bg-blue-500/10 text-blue-500",           icon: GraduationCap },
  enterprise: { label: "Enterprise", className: "bg-purple-500/10 text-purple-500",       icon: Briefcase },
};

function CommunitiesTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["discover", "communities"],
    queryFn: () => dotApi.get<{ communities: Community[] }>("/api/communities"),
    staleTime: 60_000,
  });
  const communities = data?.communities ?? [];

  const filtered = useMemo(() => {
    return communities.filter((c) => {
      if (filter !== "all" && c.tier !== filter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!c.name.toLowerCase().includes(s) && !(c.description?.toLowerCase().includes(s) ?? false)) return false;
      }
      return true;
    });
  }, [communities, search, filter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">
            {communities.length} communities across the DOT network
          </p>
        </div>
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="size-3" /> Create / Manage yours
        </Link>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search communities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", "verified", "enterprise", "campus", "free"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No communities match"
          description={search ? "Try a different search term." : "Be the first to start one."}
          action={<Button asChild><Link to="/community">Create a community</Link></Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => <DiscoverCommunityCard key={c.id} community={c} />)}
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg">Run your own community?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Referral links, member tracking, and DOT-based rewards all included.
          </p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/community">Start a community</Link>
        </Button>
      </div>
    </div>
  );
}

function DiscoverCommunityCard({ community }: { community: Community }) {
  const tierMeta = COMMUNITY_TIER_META[community.tier] ?? COMMUNITY_TIER_META.free;
  const TierIcon = tierMeta.icon;
  const initials = community.name.split(/[\s-]+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const isPrivate = community.isPrivate;

  return (
    <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 font-display text-lg font-bold text-primary">
            {initials || "•"}
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            {isPrivate ? (
              <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                <Lock className="size-2.5 mr-1" /> Private
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <Globe className="size-2.5 mr-1" /> Public
              </Badge>
            )}
            <Badge className={cn("text-[10px]", tierMeta.className)}>
              <TierIcon className="size-2.5 mr-1" />{tierMeta.label}
            </Badge>
          </div>
        </div>

        <div>
          <h3 className="font-display text-base font-semibold leading-tight">{community.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {community.description ?? "A DOT community."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {community.region && (
            <span className="flex items-center gap-1"><MapPin className="size-3" />{community.region}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3" />{community.memberCount ?? 0} members
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="text-xs">
            <p className="text-muted-foreground">Led by</p>
            <p className="font-medium">{community.leader?.name ?? "Community Leader"}</p>
          </div>
          {isPrivate ? (
            <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
              <Link to="/community">
                <Lock className="size-3" /> Need code
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              View <ChevronRight className="size-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
