import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageToCloudinary } from "@/lib/upload";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Profile — DOT" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let avatarUrl: string | null = null;
      if (avatar) {
        avatarUrl = await uploadImageToCloudinary(avatar, "avatars", user.id);
      }

      const updates: Record<string, unknown> = { name: name || null };
      if (avatarUrl) updates.avatar_url = avatarUrl;

      const { error } = await supabase.from("users").update(updates).eq("id", user.id);
      if (error) throw error;
      await refresh();
      qc.invalidateQueries();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  function pickAvatar(file: File | null) {
    if (!file) {
      setAvatar(null);
      setPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setAvatar(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <AppShell>
      <h1 className="font-display text-3xl font-bold">Profile</h1>
      <form
        onSubmit={saveProfile}
        className="mt-6 max-w-lg space-y-6 rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="relative size-16 overflow-hidden rounded-full bg-muted">
            {preview ? (
              <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="m-auto size-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Profile picture</Label>
            <Input
              type="file"
              accept="image/*"
              className="mt-1"
              onChange={(e) => pickAvatar(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-muted-foreground">Uploads go directly to Cloudinary.</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <Button type="submit" variant="hero" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </form>
    </AppShell>
  );
}
