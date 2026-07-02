import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User as UserIcon,
  Globe,
  MapPin,
  Briefcase,
  Wallet,
  Trophy,
  BookOpen,
  CalendarCheck,
  Gauge,
  Building2,
  Share2,
  Copy,
  Check,
  Sparkles,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { ROLE_LABELS, type AppRole } from "@/lib/constants";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BuilderProfileSection } from "@/components/profile/BuilderProfileSection";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Public Profile — DOT" }] }),
  component: PublicProfilePage,
});

/**
 * /profile — read-only view of how the user's profile appears to
 * other founders, investors and community members on DOT.
 *
 * Note: editing happens in /settings. This page is for verification
 * ("does my profile look right?") and sharing.
 */
function PublicProfilePage() {
  const { user, roles, primaryRole } = useDotAuth();
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Public profile" subtitle="Loading your account…" />
      </AppShell>
    );
  }

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  const dotId = user.dotId ?? "—";
  const profileUrl = `https://dotlive-lake.vercel.app/founder/${dotId}`;

  function handleCopy() {
    void navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      toast.success("Profile link copied");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Public view"
        title="Your profile"
        subtitle="This is how other founders, investors and community members see you on DOT."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button asChild variant="hero" size="sm">
              <Link to="/settings" search={{}}>
                <Sparkles className="size-4" /> Edit details
              </Link>
            </Button>
          </div>
        }
      />

      {/* ─── Hero card ────────────────────────────────────────────── */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {/* Cover band — design-token gradient, no fake imagery */}
        <div
          aria-hidden
          className="h-20 w-full [background-image:var(--gradient-primary)]"
        />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-[oklch(0.32_0.10_155)] font-display text-3xl font-bold text-primary-foreground shadow-soft">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name ?? "Profile"}
                    className="size-full rounded-2xl object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              <div className="pb-1">
                <h2 className="font-display text-2xl font-light tracking-tight">
                  {user.name ?? "Unnamed member"}
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                  {dotId}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {primaryRole && (
                <Badge variant="default">{ROLE_LABELS[primaryRole as AppRole] ?? primaryRole}</Badge>
              )}
              {roles
                .filter((r) => r !== primaryRole)
                .map((r) => (
                  <Badge key={r} variant="secondary">
                    {ROLE_LABELS[r as AppRole] ?? r}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section divider ──────────────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
          At a glance
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* ─── Quick stats (honest — bound to known user fields only) ── */}
      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={Wallet}
          tone="gold"
          label="Wallet"
          value="Visible to you only"
        />
        <Stat
          icon={Gauge}
          tone="primary"
          label="Vantage Point"
          value="Set in Vantage"
        />
        <Stat
          icon={Trophy}
          tone="gold"
          label="Pitchathons entered"
          value="Tracked from your submissions"
        />
      </section>

      {/* ─── About / role context ─────────────────────────────────── */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <UserIcon className="size-4 text-primary" />
            <h3 className="font-display text-base font-semibold tracking-tight">
              About
            </h3>
          </div>
          <p className="text-sm font-light leading-relaxed text-foreground/80">
            {primaryRole === "founder"
              ? "You're listed as a founder on DOT. Your venture details, Vantage report and pitchathon results appear here once you complete them."
              : primaryRole === "investor"
                ? "You're listed as an investor. Your portfolio, public thesis and meeting availability appear here once you publish them."
                : "You're a DOT member. Your role-specific contributions show on this page once you publish them."}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
            <Building2 className="size-4 text-primary" />
            <h3 className="font-display text-base font-semibold tracking-tight">
              Identity
            </h3>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <UserIcon className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Display name</dt>
                <dd className="font-medium">{user.name ?? "—"}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">DOT ID</dt>
                <dd className="font-mono text-xs">{dotId}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Region</dt>
                <dd className="font-medium">
                  {(user as any).location ?? <span className="text-muted-foreground">Not set</span>}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Headline</dt>
                <dd className="font-medium">
                  {(user as any).headline ?? <span className="text-muted-foreground">Not set</span>}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Roles</dt>
                <dd className="flex flex-wrap gap-1">
                  {roles.length === 0 ? (
                    <span className="text-muted-foreground">None</span>
                  ) : (
                    roles.map((r) => (
                      <span
                        key={r}
                        className="rounded-md border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {ROLE_LABELS[r as AppRole] ?? r}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </section>

      {/* ─── Section divider ──────────────────────────────────────── */}
            <div className="mt-8 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
                Activity feed
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* ─── Builder profile section (only for builders) ─────────── */}
            {roles.includes("builder") && (
              <BuilderProfileSection />
            )}

            <section className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <Lock className="mx-auto size-7 text-muted-foreground/50" />
        <h3 className="mt-3 font-display text-base font-semibold">
          Activity will appear here
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Pitchathon entries, course completions, sessions attended and community
          milestones are summarised here as you earn them.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1">
            <Trophy className="size-3 text-gold" /> Pitchathons
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1">
            <BookOpen className="size-3 text-purple" /> Academy
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1">
            <CalendarCheck className="size-3 text-primary" /> Sessions
          </span>
        </div>
      </section>

      {/* ─── Footer link bar ──────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Share2 className="size-3.5" /> Shareable at{" "}
          <code className="font-mono text-foreground/80">/founder/{dotId}</code>
        </span>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link to="/settings" search={{}}>Edit profile in Settings →</Link>
        </Button>
      </div>
    </AppShell>
  );
}

/* ─── Local stat tile (uses tokens, not the global StatCard — smaller, card-less) ─ */
function Stat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof UserIcon;
  tone: "primary" | "gold";
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-md",
            tone === "primary" && "text-primary bg-primary/10",
            tone === "gold" && "text-gold bg-gold/15",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-sm font-light text-foreground/80">{value}</p>
    </div>
  );
}
