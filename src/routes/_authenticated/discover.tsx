import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  ImagePlus,
  Loader2,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Users,
  Hash,
  Globe,
  Clock,
  ArrowBigUp,
  ArrowBigDown,
  MoreHorizontal,
  ChevronDown,
  Send,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { useNavigate } from "@tanstack/react-router";
import {
  type CloudinarySignResp,
  signCloudinaryImageUpload,
  uploadImageToCloudinary,
} from "@/lib/upload";
import { listPublicCommunities, joinByCode } from "@/api/community";
import { toast } from "sonner";
import { dotApi } from "@/api/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — DOT" }] }),
  ssr: false,
  component: DiscoverPage,
});

type Post = {
  id: string;
  type: string;
  title: string | null;
  body: string;
  imageUrl: string | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  budgetDot: number | null;
  createdAt: string;
  authorName: string | null;
  authorDotId: string | null;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string | null;
  authorId: string | null;
};

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function useFeed(tab: "latest" | "popular" | "trending") {
  return useQuery({
    queryKey: ["feed", tab],
    queryFn: async () => {
      const r = await dotApi.get<{ posts: Post[] }>(`/api/feed?tab=${tab}&limit=50`);
      return r.posts ?? [];
    },
    staleTime: 30_000,
  });
}

function DiscoverPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/discover" });

  const [tab, setTab] = useState<"latest" | "popular" | "trending">("latest");
  const [type, setType] = useState<"general" | "venture_update" | "gig" | "announcement" | "funding">("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const postsQ = useFeed(tab);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        const up = await uploadImageToCloudinary(file, "feed", user.id);
        imageUrl = up.url;
      }
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await dotApi.post("/api/feed", {
        type,
        title: title || null,
        body,
        tags,
        imageUrl,
        budgetDot: null,
      });
      toast.success("Posted to Discover");
      setTitle("");
      setBody("");
      setTagsText("");
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Post failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleLike(post: Post) {
    try {
      if (post.isLiked) {
        await dotApi.post(`/api/feed/${post.id}/like`, {});
      } else {
        await dotApi.post(`/api/feed/${post.id}/like`, {});
      }
      qc.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      toast.error("Could not update like");
    }
  }

  async function toggleBookmark(post: Post) {
    try {
      await dotApi.post(`/api/feed/${post.id}/bookmark`, {});
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success(post.isBookmarked ? "Removed bookmark" : "Saved");
    } catch {
      toast.error("Could not update bookmark");
    }
  }

  async function submitComment(e: React.FormEvent, postId: string) {
    e.preventDefault();
    const text = (commentText[postId] ?? "").trim();
    if (!text) return;
    try {
      await dotApi.post(`/api/feed/${postId}/comments`, { body: text });
      setCommentText((x) => ({ ...x, [postId]: "" }));
      qc.invalidateQueries({ queryKey: [`feed-comments`, postId] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Comment added");
    } catch {
      toast.error("Could not post comment");
    }
  }

  function pickFile(f: File | null) {
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) return toast.error("Image only");
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }

  const posts: Post[] = postsQ.data ?? [];
  const expandedRef = useRef<Record<string, boolean>>({});
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const commentsQ = useQuery({
    queryKey: expandedIds.length ? ["feed-comments", expandedIds.join(",")] : ["feed-comments-empty"],
    queryFn: async () => {
      const pending = posts
        .filter(p => expandedRef.current[p.id])
        .slice(0,10);
      if (!pending.length) return {};
      const out: Record<string, Comment[]> = {};
      await Promise.all(
        pending.map(async p => {
          try {
            const r = await dotApi.get<{ comments: Comment[] }>(`/api/feed/${p.id}/comments`);
            out[p.id] = r.comments ?? [];
          } catch {
            out[p.id] = [];
          }
        })
      );
      return out;
    },
    enabled: expandedIds.length > 0,
    staleTime: 15_000,
  });

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const map: Record<string,boolean> = {};
      prev.forEach(x => (map[x] = true));
      map[id] = !map[id];
      expandedRef.current = map;
      return Object.keys(map).filter(k => map[k]);
    });
  }

  const commentsMap: Record<string, Comment[]> = (commentsQ.data as any) ?? {};

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Discover</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Share venture updates, gigs and announcements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={tab === "latest" ? "hero" : "outline"}
              size="sm"
              onClick={() => setTab("latest")}
            >
              Latest
            </Button>
            <Button
              variant={tab === "popular" ? "hero" : "outline"}
              size="sm"
              onClick={() => setTab("popular")}
            >
              Popular
            </Button>
            <Button
              variant={tab === "trending" ? "hero" : "outline"}
              size="sm"
              onClick={() => setTab("trending")}
            >
              Trending
            </Button>
          </div>
        </div>

        {/* Composer */}
        <Card className="mt-6">
          <CardContent className="p-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Post Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">📢 General</SelectItem>
                      <SelectItem value="venture_update">🚀 Venture Update</SelectItem>
                      <SelectItem value="gig">🛠️ Gig</SelectItem>
                      <SelectItem value="announcement">📣 Announcement</SelectItem>
                      <SelectItem value="funding">💰 Funding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What's new?"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Context, traction, ask..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Image</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("discover-image-input")?.click()}
                    >
                      <ImagePlus className="size-4 mr-2" />
                      {preview ? "Change image" : "Choose image"}
                    </Button>
                    <input
                      id="discover-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    />
                    {preview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          pickFile(null);
                          const el = document.getElementById("discover-image-input") as HTMLInputElement | null;
                          if (el) el.value = "";
                        }}
                      >
                        <X className="size-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="mt-2 h-32 w-full rounded-xl object-cover border border-border"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <Input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="founder, lagos, seed"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  {tagsText
                    .split(",")
                    .filter(Boolean)
                    .map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag.trim()}
                      </Badge>
                    ))}
                </div>
                <Button type="submit" variant="hero" disabled={busy || !body.trim()}>
                  {busy ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : (
                    <ImagePlus className="size-4 mr-2" />
                  )}
                  Publish post
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Feed */}
        <div className="mt-6 space-y-4">
          {postsQ.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No posts yet. Be the first!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((p) => {
              const showComments = !!expandedRef.current[p.id];
              const comments = commentsMap[p.id] ?? [];

              return (
                <Card key={p.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {(p.authorName ?? "U").charAt(0).toUpperCase()}
                          </span>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{p.authorName ?? "User"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            {timeAgo(p.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {p.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-3">
                      {p.title && (
                        <h3 className="font-display text-base font-semibold leading-tight">{p.title}</h3>
                      )}
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{p.body}</p>
                      {p.imageUrl && (
                        <img
                          src={p.imageUrl}
                          alt="Post image"
                          className="mt-2 rounded-xl border border-border object-cover w-full max-h-96"
                          loading="lazy"
                        />
                      )}
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {p.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                            >
                              <Hash className="size-3" />#{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2", p.isLiked && "text-red-500")}
                        onClick={() => toggleLike(p)}
                      >
                        <ArrowBigUp className="size-4" />
                        <span className="text-xs font-medium">{p.likesCount}</span>
                        <ArrowBigDown className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2", showComments && "text-primary")}
                        onClick={() => toggleExpand(p.id)}
                      >
                        <MessageSquare className="size-4" />
                        <span className="text-xs font-medium">{p.commentsCount}</span>
                        <ChevronDown
                          className={cn("size-3 transition-transform", showComments && "rotate-180")}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-2", p.isBookmarked && "text-amber-600")}
                        onClick={() => toggleBookmark(p)}
                      >
                        <Bookmark className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const url = `${window.location.origin}/discover`;
                          navigator.clipboard?.writeText(url).then(() => toast.success("Link copied"));
                        }}
                      >
                        <Share2 className="size-4" />
                      </Button>
                    </div>

                    {showComments && (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-3">
                          {comments.map((c) => (
                            <div key={c.id} className="flex gap-3">
                              <Avatar className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xs font-semibold">
                                  {(c.authorName ?? "U").charAt(0).toUpperCase()}
                                </span>
                              </Avatar>
                              <div className="flex-1 rounded-xl border border-border bg-background/60 p-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-medium">{c.authorName ?? "User"}</p>
                                  <p className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</p>
                                </div>
                                <p className="mt-1 text-sm text-foreground leading-relaxed">{c.body}</p>
                              </div>
                            </div>
                          ))}
                          {commentsQ.isFetching && (
                            <p className="text-xs text-muted-foreground">Loading comments...</p>
                          )}
                          {!commentsQ.isLoading && comments.length === 0 && (
                            <p className="text-xs text-muted-foreground">No comments yet.</p>
                          )}
                        </div>
                        <form
                          onSubmit={(e) => submitComment(e, p.id)}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={commentText[p.id] ?? ""}
                            onChange={(e) =>
                              setCommentText((x) => ({ ...x, [p.id]: e.target.value }))
                            }
                            placeholder="Add a comment..."
                          />
                          <Button
                            type="submit"
                            size="icon"
                            variant="hero"
                            disabled={!((commentText[p.id] ?? "").trim())}
                          >
                            <Send className="size-4" />
                          </Button>
                        </form>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Public communities */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Communities</h2>
              <p className="text-xs text-muted-foreground">Public groups you can join.</p>
            </div>
          </div>
          <CommunityGrid />
        </section>
      </div>
    </AppShell>
  );
}

function CommunityGrid() {
  const q = useQuery({ queryKey: ["public-communities"], queryFn: listPublicCommunities, staleTime: 60_000 });
  const joinMut = useMutation({
    mutationFn: (code: string) => joinByCode(code),
    onSuccess: () => {
      toast.success("Joined community");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Could not join");
    },
  });
  const items = q.data ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {q.isLoading ? (
        [1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/40" />)
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No public communities yet.</p>
      ) : (
        items.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-background p-4 space-y-2">
            <div>
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{c.description ?? ""}</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{c.category ?? "General"}</span>
              <span>{c.region ?? "—"} · {c.memberCount} members</span>
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={joinMut.isPending}
              onClick={() => joinMut.mutate(c.referralCode)}
            >
              Join
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
