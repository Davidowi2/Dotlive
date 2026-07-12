import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  type CloudinarySignResp,
  signCloudinaryImageUpload,
  uploadImageToCloudinary,
} from "@/lib/upload";
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
      <h1 className="font-display text-3xl font-bold">Discover</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Share venture updates, gigs and announcements.
      </p>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <select
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="general">General</option>
              <option value="venture_update">Venture Update</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's new?"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label className="text-xs">Body</Label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Context, traction, ask..."
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 h-32 w-full rounded-xl object-cover"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Tags</Label>
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="founder, lagos, seed"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" variant="hero" disabled={busy || !body.trim()}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            Publish post
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          (data ?? []).map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.authorName ?? "User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{p.type}</span>
              </div>
              {p.title && <h3 className="mt-2 font-display text-base font-semibold">{p.title}</h3>}
              <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="mt-2 h-48 w-full rounded-xl object-cover" />
              )}
              <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
                <span>{p.likesCount} likes</span>
                <span>{p.commentsCount} comments</span>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
