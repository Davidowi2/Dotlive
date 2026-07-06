/**
 * /ventures — Founder's venture dashboard.
 *
 * One question this page must answer (for the founder themselves):
 *   "What do investors see when they look at my venture, and how
 *    can I improve it?"
 *
 * Sections:
 *   1. Hero — venture name + Vantage score + stage badge
 *   2. "What investors see" preview — public-looking card with the
 *      data investors need to make a decision
 *   3. Edit form — every field the founder can fill in to improve
 *      the data above
 *   4. Missing-data checklist — green/red list of what's filled vs
 *      what's empty, with links to fill each
 *
 * Saving the form updates the founder_profiles table via
 * /api/users/me/founder-profile (POST).
 */
import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2, MapPin, Globe, Users, Wallet, TrendingUp, Calendar, Briefcase,
  Sparkles, Save, CheckCircle2, AlertTriangle, ExternalLink, Edit3, ArrowRight,
  Target, LineChart, Award, Lock,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { BackButton } from "@/components/app/BackButton";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { dotApi } from "@/api/client";
import {
  getMyFounderProfile, saveFounderProfile,
  type FounderProfile,
} from "@/api/founder";
import { formatDot, formatNaira, dotToNaira } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAGES = [
  "Assess", "Validate", "Improve", "Pitch", "Fund", "Scale",
] as const;

const INDUSTRIES = [
  "AgriTech", "FinTech", "HealthTech", "EdTech", "CleanTech",
  "Logistics", "Marketplace", "SaaS", "AI/ML", "Media", "Other",
] as const;

export const Route = createFileRoute("/_authenticated/ventures")({
  head: () => ({ meta: [{ title: "My Venture — DOT" }] }),
  component: VenturesPage,
});

function VenturesPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();
  const profileQ = useQuery({
    queryKey: ["founder-profile", "me"],
    queryFn: getMyFounderProfile,
    enabled: !!user,
  });

  const [form, setForm] = useState<FounderProfile | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profileQ.data && !form) {
      setForm(profileQ.data);
      // Auto-enter edit mode if profile is mostly empty
      const filled = countFilledFields(profileQ.data);
      if (filled < 3) setEditing(true);
    }
  }, [profileQ.data, form]);

  const saveMut = useMutation({
    mutationFn: async (data: Partial<FounderProfile>) => {
      await saveFounderProfile({
        ventureName: data.ventureName ?? "",
        industry: data.industry ?? "",
        stage: data.stage ?? "Assess",
        country: data.country ?? "",
        bio: data.bio ?? "",
        website: data.website ?? "",
        fundingGoal: data.fundingGoal ?? "0",
        logoUrl: data.logoUrl ?? "",
        headcount: data.headcount ?? 0,
        annualRevenueDot: data.annualRevenueDot ?? "0",
        foundedYear: data.foundedYear ?? new Date().getFullYear(),
        totalRaisedDot: data.totalRaisedDot ?? "0",
        sharePriceKobo: data.sharePriceKobo ?? 0,
        sharesAvailable: data.sharesAvailable ?? 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["founder-profile", "me"] });
      qc.invalidateQueries({ queryKey: ["founder"] });
      toast.success("Venture saved.");
      setEditing(false);
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Could not save venture.");
    },
  });

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="My Venture" subtitle="Loading…" />
      </AppShell>
    );
  }

  if (profileQ.isLoading || !form) {
    return (
      <AppShell>
        <div className="mb-3"><BackButton label="Back to dashboard" fallback="/dashboard" /></div>
        <PageHeader title="My Venture" subtitle="Loading your venture…" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  const filled = countFilledFields(form);
  const totalFields = 10;
  const completeness = Math.round((filled / totalFields) * 100);

  return (
    <AppShell>
      <div className="mb-3"><BackButton label="Back to dashboard" fallback="/dashboard" /></div>

      <PageHeader
        eyebrow="Founder OS"
        title={form.ventureName || "Your venture"}
        subtitle={
          form.bio?.slice(0, 140) ||
          "Tell investors what you do, where you're based, and how big the opportunity is."
        }
        action={
          <div className="flex items-center gap-2">
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit3 className="size-3.5" />
                Edit
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to="/profile">View public profile →</Link>
            </Button>
          </div>
        }
      />

      <PageIntent
        icon={<Building2 className="size-5" />}
        intent="What does your venture look like to investors today?"
        context="Profile completeness, Vantage score, stage, and the team, milestones, and escrow that back it up."
      />
      {/* ── Completeness + scores row ───────────────────────── */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Completeness */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              Profile completeness
            </h3>
            <span className="font-display text-2xl font-semibold tabular-nums">{completeness}%</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full transition-all",
                completeness >= 80 ? "bg-emerald-500"
                : completeness >= 50 ? "bg-amber-500"
                : "bg-red-500",
              )}
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {filled} of {totalFields} investor-critical fields filled.
          </p>
        </div>

        {/* Vantage Point */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
              Vantage Point
            </h3>
            <Sparkles className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
            {form.vantagePoint ?? 0}<span className="text-base text-muted-foreground">/1000</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Investors see this number first. Update via Vantage.
          </p>
          <Button asChild variant="link" size="sm" className="mt-2 h-auto p-0">
            <Link to="/vantage">Take Vantage →</Link>
          </Button>
        </div>

        {/* Stage */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Stage
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <span className="font-display text-xl font-semibold">{form.stage ?? "Assess"}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {STAGES.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                  s === form.stage
                    ? "bg-primary text-primary-foreground"
                    : STAGES.indexOf(form.stage as any) > i
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground/60",
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── "What investors see" preview ─────────────────────── */}
      <section className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
            <LineChart className="size-3 text-teal" />
            What investors see
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">
            {form.ventureName || "Your venture name"}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {form.industry && <Badge variant="secondary">{form.industry}</Badge>}
            {form.country && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="size-3" /> {form.country}
              </Badge>
            )}
            {form.stage && <Badge variant="outline">{form.stage}</Badge>}
            {form.foundedYear && (
              <Badge variant="outline">
                <Calendar className="mr-1 size-3" />
                Founded {form.foundedYear}
              </Badge>
            )}
            {form.website && (
              <a
                href={form.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="size-3" /> {form.website.replace(/^https?:\/\//, "")}
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {form.bio || "Add a one-paragraph description of what your venture does, who it serves, and why it matters."}
          </p>

          {/* Traction grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <TractionStat
              icon={Users}
              label="Team size"
              value={form.headcount ? `${form.headcount} people` : "—"}
              filled={!!form.headcount}
            />
            <TractionStat
              icon={TrendingUp}
              label="Annual revenue"
              value={form.annualRevenueDot ? `${formatDot(Number(form.annualRevenueDot))} DOT` : "—"}
              subValue={form.annualRevenueDot ? `≈ ${formatNaira(dotToNaira(Number(form.annualRevenueDot)))}` : undefined}
              filled={!!Number(form.annualRevenueDot)}
            />
            <TractionStat
              icon={Wallet}
              label="Total raised"
              value={form.totalRaisedDot ? `${formatDot(Number(form.totalRaisedDot))} DOT` : "—"}
              filled={!!Number(form.totalRaisedDot)}
            />
            <TractionStat
              icon={Briefcase}
              label="Funding goal"
              value={form.fundingGoal ? `${formatDot(Number(form.fundingGoal))} DOT` : "—"}
              filled={!!Number(form.fundingGoal)}
            />
          </div>

          {/* Share offer */}
          {(form.sharePriceKobo || 0) > 0 && (
            <div className="mt-5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-medium tracking-widest uppercase text-primary">
                Open to investors
              </p>
              <p className="mt-1 font-display text-xl font-semibold">
                {form.sharesAvailable ?? 0} shares at {formatNaira(form.sharePriceKobo ?? 0)} each
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Total raise available: {formatDot(((form.sharesAvailable ?? 0) * (form.sharePriceKobo ?? 0)) / 1500)} DOT
              </p>
            </div>
          )}
        </div>
      </section>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="advisors">Advisors</TabsTrigger>
          <TabsTrigger value="escrow">Escrow</TabsTrigger>
        </TabsList>

      <TabsContent value="overview" className="mt-4">

      {/* ── Missing-data checklist ───────────────────────────── */}
      <MissingChecklist profile={form} />

      </TabsContent>

      <TabsContent value="team" className="mt-4">
        <VentureTeamTab ventureId={form.id} />
      </TabsContent>

      <TabsContent value="milestones" className="mt-4">
        <VentureMilestonesTab ventureId={form.id} />
      </TabsContent>

      <TabsContent value="advisors" className="mt-4">
        <VentureAdvisorsTab ventureId={form.id} />
      </TabsContent>

      <TabsContent value="escrow" className="mt-4">
        <VentureEscrowTab ventureId={form.id} />
      </TabsContent>
      </Tabs>

      {/* ── Edit form ────────────────────────────────────────── */}
      {editing ? (
        <EditForm
          initial={form}
          onCancel={() => setEditing(false)}
          onSave={(data) => {
            setForm({ ...form, ...data });
            saveMut.mutate(data);
          }}
          saving={saveMut.isPending}
        />
      ) : (
        <div className="mt-8 flex justify-end">
          <Button onClick={() => setEditing(true)}>
            <Edit3 className="size-4" />
            Edit venture details
          </Button>
        </div>
      )}
    </AppShell>
  );
}

/* ───────── Helpers ───────── */

function countFilledFields(p: FounderProfile): number {
  let n = 0;
  if (p.ventureName) n++;
  if (p.industry) n++;
  if (p.country) n++;
  if (p.bio) n++;
  if (p.website) n++;
  if ((p.headcount ?? 0) > 0) n++;
  if (Number(p.annualRevenueDot ?? 0) > 0) n++;
  if (p.foundedYear) n++;
  if (Number(p.totalRaisedDot ?? 0) > 0) n++;
  if (Number(p.fundingGoal ?? 0) > 0) n++;
  return n;
}

function TractionStat({
  icon: Icon, label, value, subValue, filled,
}: { icon: any; label: string; value: string; subValue?: string; filled: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-3",
      filled ? "border-border bg-background/40" : "border-dashed border-muted bg-muted/20",
    )}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="mt-1 font-display text-base font-semibold tabular-nums">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      {!filled && <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">Not yet filled</p>}
    </div>
  );
}

function MissingChecklist({ profile }: { profile: FounderProfile }) {
  const checks = [
    { label: "Venture name", filled: !!profile.ventureName },
    { label: "One-paragraph bio", filled: !!profile.bio },
    { label: "Industry", filled: !!profile.industry },
    { label: "Country", filled: !!profile.country },
    { label: "Founded year", filled: !!profile.foundedYear },
    { label: "Team size", filled: (profile.headcount ?? 0) > 0 },
    { label: "Annual revenue", filled: Number(profile.annualRevenueDot ?? 0) > 0 },
    { label: "Total raised", filled: Number(profile.totalRaisedDot ?? 0) > 0 },
    { label: "Funding goal", filled: Number(profile.fundingGoal ?? 0) > 0 },
    { label: "Website", filled: !!profile.website },
  ];

  const filled = checks.filter((c) => c.filled).length;
  const pct = Math.round((filled / checks.length) * 100);

  if (filled === checks.length) return null;

  return (
    <section className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <div className="flex-1">
          <h3 className="font-display text-base font-semibold">
            Investors need {checks.length - filled} more {checks.length - filled === 1 ? "field" : "fields"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {pct}% complete. Each missing field is a question an investor will skip your venture for.
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {checks.filter((c) => !c.filled).map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Circle className="size-3 text-amber-500" />
            {c.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

// Local Circle import — was used in MissingChecklist
import { Circle } from "lucide-react";

/* ───────── Edit form ───────── */

function EditForm({
  initial, onCancel, onSave, saving,
}: { initial: FounderProfile; onCancel: () => void; onSave: (data: Partial<FounderProfile>) => void; saving: boolean }) {
  const [v, setV] = useState({
    ventureName: initial.ventureName ?? "",
    industry: initial.industry ?? "",
    stage: initial.stage ?? "Assess",
    country: initial.country ?? "",
    bio: initial.bio ?? "",
    website: initial.website ?? "",
    fundingGoal: initial.fundingGoal ?? "0",
    headcount: initial.headcount ?? 0,
    annualRevenueDot: initial.annualRevenueDot ?? "0",
    foundedYear: initial.foundedYear ?? new Date().getFullYear(),
    totalRaisedDot: initial.totalRaisedDot ?? "0",
    sharePriceKobo: initial.sharePriceKobo ?? 0,
    sharesAvailable: initial.sharesAvailable ?? 0,
  });

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
          <Edit3 className="size-3" />
          Edit venture
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); onSave(v); }}
        className="space-y-6 rounded-2xl border border-border bg-card p-6"
      >
        {/* Basics */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Basics</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Venture name">
              <Input value={v.ventureName} onChange={(e) => setV({ ...v, ventureName: e.target.value })} placeholder="Acme Logistics" />
            </Field>
            <Field label="Industry">
              <Select value={v.industry} onChange={(val) => setV({ ...v, industry: val })} options={[...INDUSTRIES]} />
            </Field>
            <Field label="Country">
              <Input value={v.country} onChange={(e) => setV({ ...v, country: e.target.value })} placeholder="Nigeria" />
            </Field>
            <Field label="Stage">
              <Select value={v.stage} onChange={(val) => setV({ ...v, stage: val })} options={[...STAGES]} />
            </Field>
            <Field label="Founded year">
              <Input type="number" min={1900} max={new Date().getFullYear()} value={v.foundedYear} onChange={(e) => setV({ ...v, foundedYear: Number(e.target.value) })} />
            </Field>
            <Field label="Website">
              <Input value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} placeholder="https://acme.co" />
            </Field>
          </div>
        </fieldset>

        {/* Traction */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Traction (what investors need to see)</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Team size" hint="Number of full-time staff">
              <Input type="number" min={0} value={v.headcount} onChange={(e) => setV({ ...v, headcount: Number(e.target.value) })} />
            </Field>
            <Field label="Annual revenue (DOT)" hint="ARR or annualized. 0 if pre-revenue.">
              <Input type="number" min={0} value={v.annualRevenueDot} onChange={(e) => setV({ ...v, annualRevenueDot: e.target.value })} />
            </Field>
            <Field label="Total raised (DOT)" hint="Cumulative across all rounds">
              <Input type="number" min={0} value={v.totalRaisedDot} onChange={(e) => setV({ ...v, totalRaisedDot: e.target.value })} />
            </Field>
          </div>
        </fieldset>

        {/* Raise */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-medium tracking-widest uppercase text-muted-foreground">Open raise (optional)</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Funding goal (DOT)" hint="How much you want to raise in this round">
              <Input type="number" min={0} value={v.fundingGoal} onChange={(e) => setV({ ...v, fundingGoal: e.target.value })} />
            </Field>
            <Field label="Share price (₦ kobo)" hint="Price per share. 1 DOT = 1500 kobo">
              <Input type="number" min={0} value={v.sharePriceKobo} onChange={(e) => setV({ ...v, sharePriceKobo: Number(e.target.value) })} />
            </Field>
            <Field label="Shares available" hint="Total shares offered in this round">
              <Input type="number" min={0} value={v.sharesAvailable} onChange={(e) => setV({ ...v, sharesAvailable: Number(e.target.value) })} />
            </Field>
          </div>
        </fieldset>

        {/* Bio */}
        <Field label="About" hint="One paragraph. What you do, who you serve, why it matters.">
          <Textarea value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} rows={4} maxLength={2000} />
        </Field>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save venture
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Select({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
    >
      <option value="" disabled>Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Loader2(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function VentureTeamTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["venture", ventureId, "team"],
    enabled: !!ventureId,
    queryFn: async () => {
      const res = await dotApi.get<{ team: any[] }>(`/api/ventures/${ventureId}/team`);
      return res.team;
    },
  });
  if (!ventureId) {
    return <EmptyTab icon={Users} title="No venture yet" description="Save your venture profile first, then add team members." />;
  }
  if (isLoading) {
    return <TabSkeleton lines={3} />;
  }
  if (!data || data.length === 0) {
    return <EmptyTab icon={Users} title="No team members yet" description="Add the people building with you. Investors look at this first." />;
  }
  return (
    <ul className="space-y-2">
      {data.map((m: any) => (
        <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
            {(m.name ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium">{m.name}</p>
            <p className="text-xs text-muted-foreground">{m.role}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function VentureMilestonesTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["venture", ventureId, "milestones"],
    enabled: !!ventureId,
    queryFn: async () => {
      const res = await dotApi.get<{ milestones: any[] }>(`/api/ventures/${ventureId}/milestones`);
      return res.milestones;
    },
  });
  if (!ventureId) {
    return <EmptyTab icon={Target} title="No venture yet" description="Save your venture profile first, then add milestones." />;
  }
  if (isLoading) {
    return <TabSkeleton lines={3} />;
  }
  if (!data || data.length === 0) {
    return <EmptyTab icon={Target} title="No milestones yet" description="Add milestones to break your roadmap into fundable chunks." />;
  }
  return (
    <ul className="space-y-2">
      {data.map((m: any) => (
        <li key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex-1">
            <p className="font-medium">{m.title}</p>
            <p className="text-xs text-muted-foreground">
              {m.status} · {m.targetDate ? new Date(m.targetDate).toLocaleDateString() : "no target date"}
            </p>
          </div>
          {m.fundedAmount && (
            <p className="tabular-nums text-sm">
              {formatDot(Number(m.fundedAmount))} DOT
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function VentureAdvisorsTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["venture", ventureId, "advisors"],
    enabled: !!ventureId,
    queryFn: async () => {
      const res = await dotApi.get<{ advisors: any[] }>(`/api/ventures/${ventureId}/advisors`);
      return res.advisors;
    },
  });
  if (!ventureId) {
    return <EmptyTab icon={Award} title="No venture yet" description="Save your venture profile first, then add advisors." />;
  }
  if (isLoading) {
    return <TabSkeleton lines={3} />;
  }
  if (!data || data.length === 0) {
    return <EmptyTab icon={Award} title="No advisors yet" description="Add advisors to boost your Vantage and signal external validation." />;
  }
  return (
    <ul className="space-y-2">
      {data.map((a: any) => (
        <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-gold/15 text-gold font-medium">
            {(a.name ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium">{a.name}</p>
            <p className="text-xs text-muted-foreground">{a.role}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function VentureEscrowTab({ ventureId }: { ventureId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["venture", ventureId, "escrow"],
    enabled: !!ventureId,
    queryFn: async () => {
      const res = await dotApi.get<{ totalFunded: number; totalPayout: number; milestones: any[]; byStatus: Record<string, number> }>(`/api/ventures/${ventureId}/escrow`);
      return res;
    },
  });
  if (!ventureId) {
    return <EmptyTab icon={Lock} title="No venture yet" description="Save your venture profile first, then set up milestone escrow." />;
  }
  if (isLoading) {
    return <TabSkeleton lines={3} />;
  }
  if (!data) {
    return <EmptyTab icon={Lock} title="No escrow yet" description="Add milestones with funded amounts to start using escrow." />;
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <EscrowCard label="Total funded" value={data.totalFunded} accent="primary" />
        <EscrowCard label="Released" value={data.totalPayout} accent="gold" />
        <EscrowCard label="Milestones" value={data.milestones.length} accent="teal" count />
      </div>
    </div>
  );
}

function EscrowCard({ label, value, accent, count }: { label: string; value: number; accent: "primary" | "gold" | "teal"; count?: boolean }) {
  const ring = { primary: "ring-primary/20 bg-primary/5", teal: "ring-teal/20 bg-teal/5", gold: "ring-gold/20 bg-gold/5" }[accent];
  const text = { primary: "text-primary", teal: "text-teal", gold: "text-gold" }[accent];
  return (
    <div className={`rounded-2xl border border-border p-4 ring-1 ring-inset ${ring}`}>
      <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-light tabular-nums ${text}`}>
        {count ? value : `${formatDot(value)} DOT`}
      </p>
    </div>
  );
}

function EmptyTab({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function TabSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}