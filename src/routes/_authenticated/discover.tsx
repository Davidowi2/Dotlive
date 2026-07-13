import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  type CloudinarySignResp,
  signCloudinaryImageUpload,
  uploadImageToCloudinary,
} from "@/lib/upload";
import { listPublicCommunities, joinByCode } from "@/api/community";
import { toast } from "sonner";

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

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — DOT" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/discover" });
  const [type, setType] = useState<"general" | "venture_update">("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["discover-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("feed_posts")
        .select(
          "id,type,title,body,tags,likes_count,comments_count,budget_dot,created_at,author_name,author_dot_id",
        )
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as Post[];
    },
  });

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
      const { error } = await supabase.from("feed_posts").insert({
        type,
        title: title || null,
        body,
        tags,
        author_id: user.id,
        author_name: user.user_metadata?.name ?? null,
        author_dot_id: null,
        author_role: "builder",
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["discover-posts"] });
      toast.success("Posted to Discover");
      setTitle("");
      setBody("");
      setTagsText("");
      setFile(null);
      setPreview(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Post failed");
    } finally {
      setBusy(false);
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

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display text-3xl font-bold">Discover</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share venture updates, gigs and announcements.
        </p>

        {/* Post Composer */}
        <Card className="mt-6">
          <CardContent className="p-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Post Type</Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as typeof type)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">📢 General</SelectItem>
                      <SelectItem value="venture_update">🚀 Venture Update</SelectItem>
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
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />
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
                  {tagsText.split(",").filter(Boolean).map((tag, i) => (
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (data ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No posts yet. Be the first!</p>
              </CardContent>
            </Card>
          ) : (
            (data ?? []).map((p) => (
              <Card key={p.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  {/* Post Header */}
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
                          {new Date(p.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {p.type.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Post Content */}
                  <div className="mt-3 space-y-3">
                    {p.title && (
                      <h3 className="font-display text-base font-semibold leading-tight">
                        {p.title}
                      </h3>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.body}
                    </p>
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt="Post image"
                        className="mt-2 rounded-xl border border-border object-cover w-full h-auto max-h-96"
                        loading="lazy"
                      />
                    )}
                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {p.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons (Reddit/Discord Inspired) */}
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                      <Heart className="size-4" />
                      <span className="text-xs">{p.likesCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                      <MessageSquare className="size-4" />
                      <span className="text-xs">{p.commentsCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                      <Bookmark className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                      <Share2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Communities Section (Discord Inspired) */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="size-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Public Communities</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Public groups you can join.</p>
          <CommunityGrid />
        </section>
      </div>
    </AppShell>
  );
}

/* Public community directory */
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {q.isLoading ? (
        [1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-muted/40" />
        ))
      ) : items.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="py-12 text-center">
            <Globe className="size-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No public communities yet.</p>
          </CardContent>
        </Card>
      ) : (
        items.map((c) => (
          <Card key={c.id} className="overflow-hidden hover:border-primary/30 transition-all">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.description ?? ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {c.category && (
                    <Badge variant="outline" className="text-xs">
                      {c.category}
                    </Badge>
                  )}
                  {c.region && (
                    <span className="text-xs text-muted-foreground">{c.region}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="size-3" />
                  {c.memberCount}
                </span>
              </div>
              <Button
                size="sm"
                variant="hero"
                className="w-full"
                disabled={joinMut.isPending}
                onClick={() => joinMut.mutate(c.referralCode)}
              >
                {joinMut.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : null}
                Join Community
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
