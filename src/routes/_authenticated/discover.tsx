import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useMemo, useEffect } from "react";
import {
  ImagePlus,
  Loader2,
  MessageSquare,
  Bookmark,
  Share2,
  Hash,
  Clock,
  ArrowBigUp,
  ArrowBigDown,
  ChevronDown,
  Send,
  X,
  Users,
  Building2,
  LayoutGrid,
  SlidersHorizontal,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  EmptyState,
  ErrorState,
} from "@/components/app/EmptyState";
import { toast } from "sonner";
import { dotApi } from "@/api/client";
import { cn } from "@/lib/utils";
import { listVentures } from "@/api/ventures";
import { getDiscoverPeople } from "@/api/people";
import { PersonCard } from "@/components/discover/PersonCard";

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

const TYPE_OPTIONS = [
  { value: "general", label: "General", dot: "bg-red-500" },
  { value: "venture_update", label: "Venture Update", dot: "bg-sky-400" },
  { value: "gig", label: "Gig", dot: "bg-amber-400" },
  { value: "announcement", label: "Announcement", dot: "bg-rose-500" },
  { value: "funding", label: "Funding", dot: "bg-emerald-400" },
] as const;

function PostTypePill({ value }: { value: string }) {
  const opt = TYPE_OPTIONS.find(o => o.value === value);
  return (
    <span className="flex items-center gap-2">
      <span className={cn("w-1.5 h-1.5 rounded-full", opt?.dot ?? "bg-muted-foreground")} />
      <span>{opt?.label ?? value}</span>
    </span>
  );
}

const GIG_CATEGORIES = [
  "Design",
  "Development",
  "Writing",
  "Marketing",
  "Operations",
  "Support",
  "Data",
  "Video",
  "Other",
] as const;

const FUNDING_ROUNDS = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
] as const;

const OPEN_TO_OPTIONS = [
  "Angels",
  "VCs",
  "Strategic investors",
  "Crowdfunding",
] as const;

function SearchResults({
  results,
  isLoading,
}: {
  results: { posts: any[]; people: any[]; ventures: any[] };
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasResults = results.posts.length + results.people.length + results.ventures.length > 0;

  if (!hasResults) {
    return (
      <EmptyState
        variant="inline"
        title="No results"
        description="Try different keywords."
      />
    );
  }

  return (
    <div className="space-y-6">
      {results.ventures.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Ventures</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.ventures.map((v) => (
              <Card key={v.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">{v.industry ?? "—"} · {v.stage ?? ""}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {results.people.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">People</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.people.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-semibold">{p.name ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">{p.dotId ?? ""}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {results.posts.length > 0 && (
        <section className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Posts</p>
          <div className="space-y-3">
            {results.posts.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-1">
                  <p className="text-sm font-medium">{p.title ?? "Post"}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DiscoverPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const [tab, setTab] = useState("feed");
  const [feedTab, setFeedTab] = useState<"latest" | "popular" | "trending">("latest");
  const [type, setType] = useState<"general" | "venture_update" | "gig" | "announcement" | "funding">("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  /* ── People filters ── */
  const [peopleRole, setPeopleRole] = useState<string>("");
  const [peopleSort, setPeopleSort] = useState<"newest" | "vantage_desc" | "vouches_desc">("newest");

  /* ── Ventures filters ── */
  const [vStage, setVStage] = useState<string>("");
  const [vIndustry, setVIndustry] = useState<string>("");
  const [vCountry, setVCountry] = useState<string>("");
  const [vMinVantage, setVMinVantage] = useState<string>("");
  const [vMinFund, setVMinFund] = useState<string>("");
  const [vSort, setVSort] = useState<"newest" | "vantage_desc" | "fundability_desc">("newest");

  const STAGES = ["Assess", "Validate", "Build", "Fund", "Scale"];

  /* ── Composer type-specific fields ── */
  const [gigHourlyRate, setGigHourlyRate] = useState("");
  const [gigCategory, setGigCategory] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");
  const [fundingRound, setFundingRound] = useState("");
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [ventureId, setVentureId] = useState("");
  const [myVentures, setMyVentures] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const isFounder = (user?.roles as string[] | undefined)?.includes("founder") ?? false;
  const isAdmin = (user?.roles as string[] | undefined)?.some((r: string) => ["admin", "super_admin"].includes(r)) ?? false;
  const primaryRole = (user as any)?.primaryRole ?? "builder";

  const visibleTypes = useMemo(() => {
    if (isAdmin) return TYPE_OPTIONS;
    return TYPE_OPTIONS.filter(opt => opt.value !== "announcement");
  }, [isAdmin]);

  const audience = primaryRole === "founder" || primaryRole === "investor" || primaryRole === "capital_partner"
    ? primaryRole
    : "builder";

  const postsQ = useQuery({
    queryKey: ["feed", feedTab, audience],
    queryFn: async () => {
      const r = await dotApi.get<{ posts: Post[] }>(`/api/feed?tab=${feedTab}&audience=${audience}&limit=50`);
      return r.posts ?? [];
    },
    staleTime: 30_000,
  });

  const searchQ = useQuery({
    queryKey: ["search", searchDebounce],
    queryFn: async () => {
      const trimmed = searchDebounce.trim();
      if (!trimmed) return { posts: [], people: [], ventures: [] };
      const r = await dotApi.get<{ posts: any[]; people: any[]; ventures: any[] }>(`/api/search?q=${encodeURIComponent(trimmed)}&limit=5`);
      return r ?? { posts: [], people: [], ventures: [] };
    },
    enabled: searchDebounce.length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (searchDebounce.length > 0) {
      setTab("feed");
    }
  }, [searchDebounce]);

  const peopleQ = useQuery({
    queryKey: ["people", "discover", peopleRole, peopleSort],
    queryFn: async () =>
      getDiscoverPeople({
        role: peopleRole || undefined,
        sort: peopleSort,
        limit: 20,
      }),
    staleTime: 30_000,
  });

  const venturesQ = useQuery({
    queryKey: ["ventures", "discover", vStage, vIndustry, vCountry, vMinVantage, vMinFund, vSort],
    queryFn: async () =>
      listVentures({
        stage: vStage || undefined,
        industry: vIndustry || undefined,
        country: vCountry || undefined,
        minVantage: vMinVantage ? Number(vMinVantage) : undefined,
        minFundability: vMinFund ? Number(vMinFund) : undefined,
        sort: vSort,
        limit: 20,
      }),
    staleTime: 30_000,
  });

  const myVenturesQ = useQuery({
    queryKey: ["my-ventures"],
    queryFn: async () => {
      const res = await dotApi.get<{ ventures: { id: string; name: string }[] }>("/api/ventures/my");
      return res.ventures ?? [];
    },
    enabled: isFounder,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (myVenturesQ.data?.length && !ventureId) {
      setMyVentures(myVenturesQ.data);
    }
  }, [myVenturesQ.data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let imageUrl: string | null = null;
      if (file) {
        const up = await import("@/lib/upload").then(m => uploadImageToCloudinary(file, "feed", user.id));
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
        hourlyRate: type === "gig" && gigHourlyRate ? Number(gigHourlyRate) : null,
        gigCategory: type === "gig" ? gigCategory || null : null,
        deliveryDays: type === "gig" && deliveryDays ? Number(deliveryDays) : null,
        fundingGoal: type === "funding" && fundingGoal ? Number(fundingGoal) : null,
        fundingRound: type === "funding" ? fundingRound || null : null,
        openTo: type === "funding" && openTo.length ? openTo : null,
        ventureId: type === "venture_update" ? ventureId || null : null,
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
        .slice(0, 10);
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
      const map: Record<string, boolean> = {};
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
              Feed, people, and ventures in the DOT ecosystem.
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="feed">
              <LayoutGrid className="size-3.5 mr-1.5" /> Feed
            </TabsTrigger>
            <TabsTrigger value="people">
              <Users className="size-3.5 mr-1.5" /> People
            </TabsTrigger>
            <TabsTrigger value="ventures">
              <Building2 className="size-3.5 mr-1.5" /> Ventures
            </TabsTrigger>
          </TabsList>

          {/* ── Feed ── */}
          <TabsContent value="feed" className="mt-0 space-y-4">
            <div className="flex items-center gap-2">
              {(["latest", "popular", "trending"] as const).map(t => (
                <Button
                  key={t}
                  variant={feedTab === t ? "hero" : "outline"}
                  size="sm"
                  onClick={() => setFeedTab(t)}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="search"
                placeholder="Search posts, people, ventures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </Button>
              )}
            </div>

            {searchDebounce.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Search results for “{searchDebounce}”
              </div>
            )}

            <Card>
              <CardContent className="p-5">
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Post Type</Label>
                      <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                        <SelectTrigger className="h-9">
                          <PostTypePill value={type} />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="gap-2">
                              <span className="flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 rounded-full", opt.dot)} />
                                {opt.label}
                              </span>
                            </SelectItem>
                          ))}
                          {!isAdmin && TYPE_OPTIONS.some(o => o.value === "announcement") && (
                            <SelectItem value="announcement" disabled className="gap-2 opacity-60">
                              <span className="flex items-center gap-2">
                                <span className={cn("w-1.5 h-1.5 rounded-full", "bg-rose-500")} />
                                Announcement
                              </span>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's new?" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Body</Label>
                    <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Context, traction, ask..." />
                  </div>

                  {/* Type-specific fields */}
                  {type === "gig" && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Hourly rate (DOT/hr)</Label>
                        <Input type="number" min={0} value={gigHourlyRate} onChange={(e) => setGigHourlyRate(e.target.value)} placeholder="25" required={type === "gig"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Category</Label>
                        <Select value={gigCategory} onValueChange={setGigCategory}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {GIG_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Delivery days</Label>
                        <Input type="number" min={1} value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)} placeholder="7" required={type === "gig"} />
                      </div>
                    </div>
                  )}

                  {type === "funding" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Funding goal (DOT)</Label>
                        <Input type="number" min={0} value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)} placeholder="50000" required={type === "funding"} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Funding round</Label>
                        <Select value={fundingRound} onValueChange={setFundingRound}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select round" />
                          </SelectTrigger>
                          <SelectContent>
                            {FUNDING_ROUNDS.map(round => (
                              <SelectItem key={round} value={round}>{round}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Open to</Label>
                        <div className="flex flex-wrap gap-2">
                          {OPEN_TO_OPTIONS.map(opt => (
                            <Button
                              key={opt}
                              type="button"
                              variant={openTo.includes(opt) ? "hero" : "outline"}
                              size="sm"
                              onClick={() => setOpenTo(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                            >
                              {opt}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {type === "venture_update" && isFounder && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Venture</Label>
                      <Select value={ventureId} onValueChange={setVentureId}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select venture" />
                        </SelectTrigger>
                        <SelectContent>
                          {(myVenturesQ.data ?? []).map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {type === "venture_update" && !isFounder && (
                    <p className="text-xs text-muted-foreground">Only founders can post venture updates.</p>
                  )}

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
                            <X className="size-4 mr-1" /> Remove
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
                      <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="founder, lagos, seed" />
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

            {postsQ.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : searchDebounce.length > 0 ? (
              <SearchResults results={searchQ.data ?? { posts: [], people: [], ventures: [] }} isLoading={searchQ.isLoading} />
            ) : posts.length === 0 ? (
              <EmptyState
                variant="inline"
                title="No posts yet"
                description="Be the first to share something with the DOT community."
                action={
                  <Button variant="hero" onClick={() => document.getElementById("discover-body")?.focus()}>Create Post</Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {posts.map((p) => {
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
                            p.imageUrl.includes("fl_archived") ? (
                              <div className="mt-2 rounded-xl border border-border bg-muted/30 p-4 text-center">
                                <p className="text-xs text-muted-foreground">Image archived · 6 months ago</p>
                              </div>
                            ) : (
                              <img
                                src={p.imageUrl}
                                alt="Post image"
                                className="mt-2 rounded-xl border border-border object-cover w-full max-h-96"
                                loading="lazy"
                              />
                            )
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
                              <Button type="submit" size="icon" variant="hero" disabled={!((commentText[p.id] ?? "").trim())}>
                                <Send className="size-4" />
                              </Button>
                            </form>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── People ── */}
          <TabsContent value="people" className="mt-0 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <SlidersHorizontal className="size-3.5" /> Filters
                  </div>
                  <Select value={peopleRole} onValueChange={setPeopleRole}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All roles</SelectItem>
                      <SelectItem value="builder">Builder</SelectItem>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                      <SelectItem value="capital_partner">Capital Partner</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={peopleSort} onValueChange={(v) => setPeopleSort(v as typeof peopleSort)}>
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="vantage_desc">Top Vantage</SelectItem>
                      <SelectItem value="vouches_desc">Most vouched</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {peopleQ.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : peopleQ.error ? (
              <ErrorState
                title="Couldn't load people"
                message="Something went wrong loading discoverable people."
                onRetry={() => peopleQ.refetch()}
              />
            ) : (peopleQ.data?.people?.length ?? 0) === 0 ? (
              <EmptyState
                variant="inline"
                title="No people found"
                description="Try widening your filters."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(peopleQ.data?.people ?? []).map(p => (
                  <PersonCard key={p.id} person={p} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Ventures ── */}
          <TabsContent value="ventures" className="mt-0 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <SlidersHorizontal className="size-3.5" /> Filters
                  </div>
                  <Select value={vStage} onValueChange={setVStage}>
                    <SelectTrigger className="h-8 w-36">
                      <SelectValue placeholder="All stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All stages</SelectItem>
                      {STAGES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 w-40"
                    placeholder="Industry"
                    value={vIndustry}
                    onChange={(e) => setVIndustry(e.target.value)}
                  />
                  <Input
                    className="h-8 w-36"
                    placeholder="Country"
                    value={vCountry}
                    onChange={(e) => setVCountry(e.target.value)}
                  />
                  <Input
                    className="h-8 w-28"
                    placeholder="Min vantage"
                    value={vMinVantage}
                    onChange={(e) => setVMinVantage(e.target.value)}
                    type="number"
                  />
                  <Input
                    className="h-8 w-28"
                    placeholder="Min fundability"
                    value={vMinFund}
                    onChange={(e) => setVMinFund(e.target.value)}
                    type="number"
                  />
                  <Select value={vSort} onValueChange={(v) => setVSort(v as typeof vSort)}>
                    <SelectTrigger className="h-8 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="vantage_desc">Top Vantage</SelectItem>
                      <SelectItem value="fundability_desc">Fundability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {venturesQ.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : venturesQ.error ? (
              <ErrorState
                title="Couldn't load ventures"
                message="Something went wrong loading ventures."
                onRetry={() => venturesQ.refetch()}
              />
            ) : (venturesQ.data?.length ?? 0) === 0 ? (
              <EmptyState
                variant="inline"
                title="No ventures found"
                description="Try adjusting your filters."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(venturesQ.data ?? []).map((v: any) => (
                  <Card key={v.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{v.name}</p>
                          {v.industry && (
                            <p className="text-xs text-muted-foreground">{v.industry}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {v.stage && (
                            <Badge variant="secondary" className="text-[10px]">{v.stage}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Vantage {Number(v.vantagePoint ?? 0)}</span>
                        <span>Fundability {Number(v.fundability ?? 0)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => toast.message("Coming soon")}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="hero"
                          className="flex-1"
                          onClick={() => toast.message("Coming soon")}
                        >
                          Meet Founder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
    onSuccess: () => toast.success("Joined community"),
    onError: (err: any) => toast.error(err?.message ?? "Could not join"),
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
