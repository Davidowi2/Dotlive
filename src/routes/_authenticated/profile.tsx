import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { User, Globe, Save, Loader2, Camera } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useFounderProfile } from "@/hooks/use-dot-data";
import { INDUSTRIES, AFRICAN_COUNTRIES } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Edit Profile — DOT" }] }),
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const { user, profile, refresh, roles } = useAuth();
  const { data: founder, isLoading: founderLoading } = useFounderProfile();
  const qc = useQueryClient();
  const isFounder = roles.includes("founder");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ventureName, setVentureName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");
  const [busy, setBusy] = useState(false);

  // Pre-fill when data loads
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (founder) {
      setVentureName(founder.venture_name ?? "");
      setIndustry(founder.industry ?? "");
      setCountry(founder.country ?? "");
      setBio(founder.bio ?? "");
      setWebsite(founder.website ?? "");
      setFundingGoal(founder.funding_goal ? String(founder.funding_goal) : "");
    }
  }, [founder]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      // Update profiles table
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ name: name.trim(), phone: phone.trim() || null })
        .eq("id", user.id);
      if (profErr) throw profErr;

      // Update founder_profiles if founder
      if (isFounder) {
        const { error: fpErr } = await supabase
          .from("founder_profiles")
          .update({
            venture_name: ventureName.trim() || null,
            industry: industry || null,
            country: country || null,
            bio: bio.trim() || null,
            website: website.trim() || null,
            funding_goal: fundingGoal ? Number(fundingGoal) : 0,
          })
          .eq("user_id", user.id);
        if (fpErr) throw fpErr;
      }

      await refresh();
      qc.invalidateQueries({ queryKey: ["founder_profile", user.id] });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  if (founderLoading) {
    return (
      <AppShell>
        <PageSkeleton.Header />
        <PageSkeleton.CardGrid count={2} cols={2} />
      </AppShell>
    );
  }

  const initial = (profile?.name || profile?.email || "?").charAt(0).toUpperCase();

  return (
    <AppShell>
      <PageHeader
        title="Edit Profile"
        subtitle="Update your personal information and venture details."
        action={
          <Button variant="hero" onClick={handleSave} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save changes
          </Button>
        }
      />

      <form onSubmit={handleSave} className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Avatar panel */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="relative">
            <div className="flex size-24 items-center justify-center rounded-full [background-image:var(--gradient-primary)] font-display text-3xl font-bold text-primary-foreground">
              {initial}
            </div>
            <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm">
              <Camera className="size-3.5" />
            </span>
          </div>
          <div className="text-center">
            <p className="font-display font-semibold">{profile?.name || "—"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <p className="text-xs text-muted-foreground">Avatar upload coming soon</p>
        </div>

        {/* Form fields */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal info */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Personal info</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amara Okafor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ""} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 801 234 5678" />
              </div>
            </div>
          </div>

          {/* Venture info — founders only */}
          {isFounder && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">Venture info</h2>
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venture">Venture name</Label>
                  <Input id="venture" value={ventureName} onChange={(e) => setVentureName(e.target.value)} placeholder="PayAfrika" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="website" className="pl-9" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourventure.io" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
                    placeholder="What does your venture do?" maxLength={500} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Funding goal (₦)</Label>
                  <Input id="goal" type="number" value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)} placeholder="5000000" />
                </div>
              </div>
            </div>
          )}

          <Separator />
          <div className="flex justify-end gap-3">
            <Button type="submit" variant="hero" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
