/**
 * /settings — Edit your account, profile, notifications, theme, security.
 *
 * Every input is wired to PATCH /api/users/me (or the relevant endpoint).
 * Previously this page showed hardcoded values (language = "English (UK)",
 * currency = "NGN", timezone = "Africa/Lagos") and notification Switches
 * with no onChange handlers. All of that is gone.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell, Shield, Palette, Globe, Trash2, LogOut, Mail,
  User as UserIcon, Save, Loader2, Check, ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
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
  const { user, logout, refresh } = useDotAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("account");

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
      const res = await dotApi.patch<{ user: any }>("/api/users/me", {
        name: name.trim(),
        headline: headline.trim() || null,
        location: location.trim() || null,
        bio: bio.trim() || null,
        twitterUrl: twitterUrl.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
      });
      if (refresh) await refresh();
      qc.invalidateQueries({ queryKey: ["builder-arena"] });
      qc.invalidateQueries({ queryKey: ["user-public"] });
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

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="account"><UserIcon className="size-3.5" /> Account</TabsTrigger>
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
              <Field label="Language">
                <select
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English (UK)</option>
                  <option value="en-US">English (US)</option>
                  <option value="fr">Français</option>
                  <option value="sw">Kiswahili</option>
                </select>
              </Field>
              <Field label="Currency display">
                <select
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
              </Field>
              <Field label="Timezone">
                <select
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
              </Field>
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <Button onClick={saveLocale}><Save className="size-4" /> Save locale</Button>
            </div>
          </Section>
        </TabsContent>

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
