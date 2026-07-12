/**
 * /settings — Edit your account, profile, notifications, theme, security.
 *
 * Every input is wired to PATCH /api/users/me (or the relevant endpoint).
 * Previously this page showed hardcoded values (language = "English (UK)",
 * currency = "NGN", timezone = "Africa/Lagos") and notification Switches
 * with no onChange handlers. All of that is gone.
 */
import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  Bell, Shield, Palette, Globe, Trash2, LogOut, Mail,
  User as UserIcon, Save, Loader2, Check, ExternalLink, Hammer,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { dotApi } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — DOT" }] }),
  component: SettingsPage,
});

/* ─── primitives ─── */
function Section({
  icon: Icon, title, description, children,
}: { icon: any; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-border pb-4">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ─── page ─── */
function SettingsPage() {
  const { user, logout, refresh, roles } = useDotAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  
  // Read tab from URL search params on mount
  const [tab, setTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") ?? "account";
    }
    return "account";
  });

  // ─── Account form state
  const [name, setName] = useState(user?.name ?? "");
  const [headline, setHeadline] = useState((user as any)?.headline ?? "");
  const [location, setLocation] = useState((user as any)?.location ?? "");
  const [bio, setBio] = useState((user as any)?.bio ?? "");
  const [twitterUrl, setTwitterUrl] = useState((user as any)?.twitterUrl ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState((user as any)?.linkedinUrl ?? "");
  const [githubUrl, setGithubUrl] = useState((user as any)?.githubUrl ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setHeadline((user as any).headline ?? "");
      setLocation((user as any).location ?? "");
      setBio((user as any).bio ?? "");
      setTwitterUrl((user as any).twitterUrl ?? "");
      setLinkedinUrl((user as any).linkedinUrl ?? "");
      setGithubUrl((user as any).githubUrl ?? "");
    }
  }, [user]);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      // Save name to users table
      const res = await dotApi.patch<{ user: any }>("/api/users/me", {
        name: name.trim(),
      });
      // Save headline, location, bio, social links to builder_profiles table
      await dotApi.put("/api/users/me/builder-profile", {
        headline: headline.trim() || undefined,
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
        twitterUrl: twitterUrl.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
      });
      if (refresh) await refresh();
      qc.invalidateQueries({ queryKey: ["builder-arena"] });
      qc.invalidateQueries({ queryKey: ["user-public"] });
      qc.invalidateQueries({ queryKey: ["builder-profile-settings"] });
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSavingProfile(false);
    }
  }

  // ─── Notification toggles
  const [notif, setNotif] = useState({
    meetings:  (user as any)?.notif_meetings  ?? true,
    vantage:   (user as any)?.notif_vantage   ?? true,
    wallet:    (user as any)?.notif_wallet    ?? true,
    community: (user as any)?.notif_community ?? true,
    academy:   (user as any)?.notif_academy   ?? true,
  });
  useEffect(() => {
    if (user) setNotif({
      meetings:  (user as any).notif_meetings  ?? true,
      vantage:   (user as any).notif_vantage   ?? true,
      wallet:    (user as any).notif_wallet    ?? true,
      community: (user as any).notif_community ?? true,
      academy:   (user as any).notif_academy   ?? true,
    });
  }, [user]);

  async function toggleNotif(key: keyof typeof notif, value: boolean) {
    const next = { ...notif, [key]: value };
    setNotif(next);
    try {
      await dotApi.patch("/api/users/me", { [`notif_${key}`]: value });
    } catch (e: any) {
      // revert
      setNotif(notif);
      toast.error(e?.message ?? "Could not save preference");
    }
  }

  // ─── Locale
  const [language, setLanguage] = useState((user as any)?.language ?? "en");
  const [currency, setCurrency] = useState((user as any)?.currency ?? "NGN");
  const [timezone, setTimezone] = useState((user as any)?.timezone ?? "Africa/Lagos");
  useEffect(() => {
    if (user) {
      setLanguage((user as any).language ?? "en");
      setCurrency((user as any).currency ?? "NGN");
      setTimezone((user as any).timezone ?? "Africa/Lagos");
    }
  }, [user]);

  async function saveLocale() {
    try {
      await dotApi.patch("/api/users/me", { language, currency, timezone });
      toast.success("Locale saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    }
  }

  // ─── Builder profile
  const [builderHeadline, setBuilderHeadline] = useState("");
  const [builderBio, setBuilderBio] = useState("");
  const [builderSkills, setBuilderSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [builderHourlyRate, setBuilderHourlyRate] = useState("");
  const [builderPortfolio, setBuilderPortfolio] = useState("");
  const [builderLocation, setBuilderLocation] = useState("");
  const [builderAvailable, setBuilderAvailable] = useState(true);
  const [savingBuilder, setSavingBuilder] = useState(false);

  // Load existing builder profile (for all users - profile fields live in builder_profiles)
  useQuery({
    queryKey: ["builder-profile-settings"],
    queryFn: async () => {
      try {
        const r = await dotApi.get<{ profile: any }>("/api/users/me/builder-profile");
        const p = r.profile ?? {};
        setBuilderHeadline(p.headline ?? "");
        setBuilderBio(p.bio ?? "");
        setBuilderSkills(p.skills ?? []);
        setBuilderHourlyRate(p.hourlyDot ?? "");
        setBuilderPortfolio(p.portfolioUrl ?? "");
        setBuilderLocation(p.location ?? "");
        setBuilderAvailable(p.available ?? true);
        // Also populate Account tab fields from builder profile
        // API returns snake_case (twitter_url, linkedin_url, github_url) - handle both
        setHeadline(p.headline ?? "");
        setLocation(p.location ?? "");
        setBio(p.bio ?? "");
        setTwitterUrl(p.twitterUrl ?? p.twitter_url ?? "");
        setLinkedinUrl(p.linkedinUrl ?? p.linkedin_url ?? "");
        setGithubUrl(p.githubUrl ?? p.github_url ?? "");
        return p;
      } catch { return {}; }
    },
    enabled: !!user,  // Enable for ALL users, not just builders
  });

  function addSkill() {
    const s = skillInput.trim();
    if (s && !builderSkills.includes(s) && builderSkills.length < 20) {
      setBuilderSkills((prev) => [...prev, s]);
      setSkillInput("");
    }
  }

  function removeSkill(s: string) {
    setBuilderSkills((prev) => prev.filter((x) => x !== s));
  }

  async function saveBuilderProfile() {
    setSavingBuilder(true);
    try {
      await dotApi.put("/api/users/me/builder-profile", {
        headline: builderHeadline.trim() || undefined,
        bio: builderBio.trim() || undefined,
        skills: builderSkills,
        hourlyDot: builderHourlyRate || undefined,
        portfolioUrl: builderPortfolio.trim() || undefined,
        location: builderLocation.trim() || undefined,
        available: builderAvailable,
      });
      qc.invalidateQueries({ queryKey: ["builder-profile-settings"] });
      qc.invalidateQueries({ queryKey: ["builder-arena"] });
      toast.success("Builder profile saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSavingBuilder(false);
    }
  }

  // ─── Security
  function handleSignOut() {
    logout();
    navigate({ to: "/auth", search: { mode: "signin" } });
  }
  async function handlePasswordReset() {
    if (!user?.email) return;
    try {
      await dotApi.post("/api/auth/forgot-password", { email: user.email });
      toast.success("Password reset link sent to your email.");
    } catch {
      toast.error("Could not send reset link. Try again.");
    }
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Settings" subtitle="Loading your account…" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your profile, notifications, appearance, and security."
      />

      <PageIntent
        icon={<UserIcon className="size-5" />}
        intent="How do you want your account to behave?"
        context="Profile, builder visibility, notification preferences, theme, and security — every switch in one place."
      />

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="account"><UserIcon className="size-3.5" /> Account</TabsTrigger>
          {roles.includes("builder") && (
            <TabsTrigger value="builder"><Hammer className="size-3.5" /> Builder</TabsTrigger>
          )}
          <TabsTrigger value="notifications"><Bell className="size-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="size-3.5" /> Appearance</TabsTrigger>
          <TabsTrigger value="security"><Shield className="size-3.5" /> Security</TabsTrigger>
        </TabsList>

        {/* ── Account ───────────────────────────────────────── */}
        <TabsContent value="account" className="space-y-6">
          <Section icon={UserIcon} title="Profile" description="Visible to investors, founders and community members.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Headline" hint="One line about you — appears under your name">
                <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Full-stack TypeScript / React" />
              </Field>
              <Field label="Region" hint="City, country — shown on your public profile">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos, Nigeria" />
              </Field>
              <Field label="DOT ID" hint="Your permanent identifier — read-only">
                <Input value={user.dotId ?? ""} readOnly className="bg-muted/40 font-mono text-xs" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Bio" hint="Up to 500 characters">
                  <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="One short paragraph about you and what you do." />
                </Field>
              </div>
              <Field label="Twitter / X URL">
                <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://x.com/you" />
              </Field>
              <Field label="LinkedIn URL">
                <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/you" />
              </Field>
              <Field label="GitHub URL">
                <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/you" />
              </Field>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile" search={{}}>
                  <ExternalLink className="size-3.5" /> View public profile
                </Link>
              </Button>
              <Button onClick={saveProfile} disabled={savingProfile || !name.trim()}>
                {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {savingProfile ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </Section>

          <Section icon={Globe} title="Region & currency" description="How money, dates and language are presented.">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="settings-language">
                  Language
                </label>
                <select
                  id="settings-language"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English (UK)</option>
                  <option value="en-US">English (US)</option>
                  <option value="fr">Français</option>
                  <option value="sw">Kiswahili</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="settings-currency">
                  Currency display
                </label>
                <select
                  id="settings-currency"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="NGN">NGN — ₦</option>
                  <option value="USD">USD — $</option>
                  <option value="EUR">EUR — €</option>
                  <option value="KES">KES — KSh</option>
                  <option value="GHS">GHS — GH₵</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground" htmlFor="settings-timezone">
                  Timezone
                </label>
                <select
                  id="settings-timezone"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="Africa/Lagos">West Africa (UTC+1)</option>
                  <option value="Africa/Nairobi">East Africa (UTC+3)</option>
                  <option value="Africa/Cairo">Cairo (UTC+2)</option>
                  <option value="Europe/London">London (UTC+0)</option>
                  <option value="America/New_York">New York (UTC-5)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <Button onClick={saveLocale}><Save className="size-4" /> Save locale</Button>
            </div>
          </Section>
        </TabsContent>

        {/* ── Builder (builders only) ───────────────────────── */}
        {roles.includes("builder") && (
          <TabsContent value="builder" className="space-y-6">
            <Section icon={Hammer} title="Builder profile" description="This is what clients see when they browse for talent.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Professional headline" hint="30-80 chars — the first thing clients read">
                    <Input
                      value={builderHeadline}
                      onChange={(e) => setBuilderHeadline(e.target.value)}
                      placeholder="e.g. Full-stack TypeScript · React · Node.js"
                      maxLength={80}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Bio" hint="What you build, who you've built it for, what makes your work different">
                    <Textarea
                      rows={4}
                      value={builderBio}
                      onChange={(e) => setBuilderBio(e.target.value)}
                      placeholder="Concrete wins over fluff."
                      maxLength={1000}
                    />
                  </Field>
                </div>
                <Field label="Hourly rate (DOT)" hint="What you charge per hour">
                  <Input
                    type="number"
                    min="0"
                    value={builderHourlyRate}
                    onChange={(e) => setBuilderHourlyRate(e.target.value)}
                    placeholder="e.g. 50"
                  />
                </Field>
                <Field label="Location">
                  <Input
                    value={builderLocation}
                    onChange={(e) => setBuilderLocation(e.target.value)}
                    placeholder="Lagos, Nigeria"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Portfolio URL">
                    <Input
                      value={builderPortfolio}
                      onChange={(e) => setBuilderPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.com"
                    />
                  </Field>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                  Skills ({builderSkills.length}/20 — minimum 3)
                </label>
                <div className="flex flex-wrap gap-1.5 min-h-[36px] rounded-xl border border-border bg-muted/20 p-2">
                  {builderSkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 text-primary/70 hover:text-primary"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {builderSkills.length === 0 && (
                    <span className="text-xs text-muted-foreground px-1 py-0.5">Add your skills below</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Type a skill and press Enter (e.g. React, Figma, Python)"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addSkill} disabled={!skillInput.trim()}>
                    Add
                  </Button>
                </div>
                {/* Quick-add chips */}
                <div className="flex flex-wrap gap-1.5">
                  {["TypeScript","React","Node.js","Python","Figma","Solidity","SQL","AWS","Flutter","Next.js","Go","Rust","Design","Marketing","Copywriting","Sales","Finance","DevOps"].filter(s => !builderSkills.includes(s)).slice(0, 12).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { if (!builderSkills.includes(s)) setBuilderSkills(p => [...p, s]); }}
                      className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available toggle */}
              <Row label="Available for hire" sub="Show a green 'Available' badge on your profile">
                <Switch checked={builderAvailable} onCheckedChange={setBuilderAvailable} />
              </Row>

              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={saveBuilderProfile} disabled={savingBuilder || builderSkills.length < 3}>
                  {savingBuilder ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {savingBuilder ? "Saving…" : builderSkills.length < 3 ? `Add ${3 - builderSkills.length} more skill${3 - builderSkills.length !== 1 ? "s" : ""}` : "Save builder profile"}
                </Button>
              </div>
            </Section>
          </TabsContent>
        )}

        {/* ── Notifications ─────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6">
          <Section icon={Bell} title="Email & push" description="Choose which platform activity reaches your inbox. Saved instantly.">
            <Row label="Meeting requests" sub="When an investor requests a meeting">
              <Switch checked={notif.meetings} onCheckedChange={(v) => toggleNotif("meetings", v)} />
            </Row>
            <Row label="Vantage updates" sub="Score changes and assessment reminders">
              <Switch checked={notif.vantage} onCheckedChange={(v) => toggleNotif("vantage", v)} />
            </Row>
            <Row label="Wallet activity" sub="Deposits, transfers and DOT rewards">
              <Switch checked={notif.wallet} onCheckedChange={(v) => toggleNotif("wallet", v)} />
            </Row>
            <Row label="Community activity" sub="New members and milestones">
              <Switch checked={notif.community} onCheckedChange={(v) => toggleNotif("community", v)} />
            </Row>
            <Row label="Academy reminders" sub="Course deadlines and new content">
              <Switch checked={notif.academy} onCheckedChange={(v) => toggleNotif("academy", v)} />
            </Row>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3 text-primary" /> Changes persist immediately.
            </p>
          </Section>
        </TabsContent>

        {/* ── Appearance ────────────────────────────────────── */}
        <TabsContent value="appearance" className="space-y-6">
          <Section icon={Palette} title="Theme" description="Light or dark. Both are designed for long reading sessions.">
            <Row label="Theme" sub="Light, dark, or follow your system">
              <ThemeToggle />
            </Row>
            <Row label="Preview" sub="How the current theme renders in-app">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border border-border",
                    "bg-[oklch(0.96_0.02_90)] text-foreground",
                  )}
                  aria-label="Light preview"
                />
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border border-border",
                    "bg-[oklch(0.14_0.02_155)] text-primary",
                  )}
                  aria-label="Dark preview"
                />
              </div>
            </Row>
          </Section>
        </TabsContent>

        {/* ── Security ──────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          <Section icon={Shield} title="Authentication" description="Keep your wallet and account safe.">
            <Row label="Change password" sub="Send a password reset link to your email">
              <Button variant="outline" size="sm" onClick={handlePasswordReset}>
                <Mail className="size-4" /> Send reset link
              </Button>
            </Row>
            <Row label="Email" sub="Used for sign-in and password reset">
              <span className="font-mono text-sm text-muted-foreground">{user.email ?? "—"}</span>
            </Row>
          </Section>

          <Separator />

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" /> Sign out of this device
            </Button>
            <a
              href="mailto:support@dot.africa?subject=DOT%20account%20deletion%20request"
              className="inline-flex w-full items-center justify-start gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-4" /> Request account deletion
            </a>
            <p className="pt-1 text-xs text-muted-foreground">
              Account deletion is permanent. All DOT balances, certifications and
              history will be removed within 30 days. Email
              <code className="mx-1 rounded bg-muted px-1 py-0.5">support@dot.africa</code>
              to start the process.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
