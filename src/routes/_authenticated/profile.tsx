import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User as UserIcon,
  UserCircle,
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
  Shield,
  ShieldCheck,
  TrendingUp,
  Clock,
  Camera,
  Upload,
} from "lucide-react";
import { VouchButton } from "@/components/vouch/VouchButton";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { PageIntent } from "@/components/app/PageIntent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { ROLE_LABELS, type AppRole } from "@/lib/constants";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { uploadImageToCloudinary } from "@/lib/upload";
import { BuilderProfileSection } from "@/components/profile/BuilderProfileSection";
import { VouchDisplay } from "@/components/vouch/VouchDisplay";
import { VouchList } from "@/components/vouch/VouchList";
import { fetchNotifications } from "@/api/notifications";
import { getTransactions as listTransactions } from "@/api/wallet";
import { useWallet } from "@/hooks/use-dot-data";
import { formatDot } from "@/lib/constants";
import { dotApi } from "@/api/client";

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
  const qc = useQueryClient();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const { data: walletBalance = 0 } = useWallet();
  const { data: vantageData } = useQuery({
    queryKey: ["vantage", "latest", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await dotApi.get<{ latest?: { vantagePoint?: number } }>(
          "/api/vantage/latest",
        );
        return res?.latest?.vantagePoint ?? null;
      } catch {
        return null;
      }
    },
  });
  const { data: pitchathonCount = 0 } = useQuery({
    queryKey: ["pitchathons", "mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const res = await dotApi.get<{ applications?: unknown[] }>(
          "/api/pitchathons/me",
        );
        return (res?.applications ?? []).length;
      } catch {
        return 0;
      }
    },
  });

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Image files only");
      return;
    }
    setAvatarUploading(true);
    try {
      const up = await uploadImageToCloudinary(file, "avatars", user.id);
      const res = await dotApi.patch<{ ok: boolean; user: { id: string } }>("/api/users/me", {
        avatarUrl: up.url,
      });
      toast.success("Avatar updated");
      qc.invalidateQueries({ queryKey: ["user"] });
      qc.invalidateQueries({ queryKey: ["admin-users-management"] });
      e.target.value = "";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

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
            <VouchButton
              voucheeId={user.id}
              currentUserId={user.id}
              compact
            />
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

      <PageIntent
        icon={<UserCircle className="size-5" />}
        intent="What does the rest of the network see when they land on your profile?"
        context="Your name, Vantage, vouch count, ventures, builder work — your public reputation, end to end."
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
              <div className="relative flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 border-card bg-[oklch(0.32_0.10_155)] font-display text-3xl font-bold text-primary-foreground shadow-soft overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name ?? "Profile"}
                    className="size-full rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-primary-foreground">{initial}</span>
                )}
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-2xl bg-black/40 opacity-0 transition-opacity hover:opacity-100" htmlFor="profile-avatar-upload">
                  <Camera className="size-6 text-white" />
                </label>
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

      {/* ─── Quick stats (bound to live data) ──────────────────────── */}
      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          tone="gold"
          label="Wallet"
          value={`${formatDot(walletBalance)} DOT`}
        />
        <Stat
          icon={Gauge}
          tone="primary"
          label="Vantage Point"
          value={vantageData != null ? String(vantageData) : "Take Vantage"}
        />
        <Stat
          icon={Trophy}
          tone="gold"
          label="Pitchathons entered"
          value={pitchathonCount > 0 ? String(pitchathonCount) : "None yet"}
        />
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-muted-foreground">
            <ShieldCheck className="size-3" />
            Vouches
          </div>
          <div className="mt-2">
            <VouchDisplay userId={user.id} />
          </div>
        </div>
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
          <dl className="space-y-4 text-sm">
            <div className="flex items-start gap-2">
              <UserIcon className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Display name</div>
                <div className="font-medium">{user.name ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">DOT ID</div>
                <div className="font-mono text-xs">{dotId}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Region</div>
                <div className="font-medium">
                  {(user as any).location || <span className="text-muted-foreground">Not set</span>}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Headline</div>
                <div className="font-medium">
                  {(user as any).headline || <span className="text-muted-foreground">Not set</span>}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 size-3.5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Roles</div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {roles.length === 0 ? (
                    <span className="text-muted-foreground">No roles yet</span>
                  ) : (
                    roles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">
                        {ROLE_LABELS[r as AppRole] ?? r}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </dl>
        </div>
      </section>

      {/* ─── Bio / about section ──────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
          <UserIcon className="size-4 text-primary" />
          <h3 className="font-display text-base font-semibold tracking-tight">
            Bio
          </h3>
        </div>
        <p className="text-sm font-light leading-relaxed text-foreground/80">
          {(user as any).bio?.trim() ? (user as any).bio : (
            <span className="text-muted-foreground">
              Add a short bio in Settings so others know what you’re building.
            </span>
          )}
        </p>
      </section>

      {/* ─── Section divider ──────────────────────────────────────── */}
            <div className="mt-8 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
                Vouched by
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <section className="mt-4">
              <VouchList userId={user.id} limit={8} />
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

            <ProfileActivityFeed />

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

/* ─── Profile Activity Feed — real notifications + transactions timeline ─── */

function ProfileActivityFeed() {
  const { data: notifData } = useQuery({
    queryKey: ["profile", "notifications"],
    queryFn: async () => {
      try {
        return await fetchNotifications({ limit: 10 });
      } catch {
        return { items: [] as any[] };
      }
    },
    staleTime: 60_000,
  });
  const { data: txData } = useQuery({
    queryKey: ["profile", "transactions"],
    queryFn: async () => {
      try {
        return await listTransactions();
      } catch {
        return { transactions: [] as any[] };
      }
    },
    staleTime: 60_000,
  });

  type FeedItem = {
    id: string;
    icon: typeof Trophy;
    tone: "primary" | "gold" | "purple";
    title: string;
    body: string;
    time: string;
    href?: string;
  };

  const items: FeedItem[] = [];

  const notifs: any[] = (notifData as any)?.items ?? [];
  for (const n of notifs) {
    const type = String(n.type ?? "");
    const tone: "primary" | "gold" | "purple" =
      type.startsWith("wallet") || type.includes("transfer") || type.includes("deposit")
        ? "gold"
        : type.includes("meeting") || type.includes("role")
        ? "primary"
        : "purple";
    items.push({
      id: `n-${n.id}`,
      icon: type.includes("meeting")
        ? CalendarCheck
        : tone === "gold"
        ? Wallet
        : tone === "primary"
        ? Trophy
        : Sparkles,
      tone,
      title: n.title ?? "Notification",
      body: n.body ?? "",
      time: n.createdAt ?? "",
      href: n.link ?? "/notifications",
    });
  }

  const txPayload: any = txData ?? {};
  const txs: any[] = Array.isArray(txPayload)
    ? txPayload
    : Array.isArray(txPayload.transactions)
      ? txPayload.transactions
      : [];
  for (const t of txs.slice(0, 5)) {
    const positive = Number(t.amount) > 0;
    items.push({
      id: `t-${t.id}`,
      icon: positive ? TrendingUp : Clock,
      tone: positive ? "gold" : "primary",
      title: positive
        ? `Received ${Math.abs(Number(t.amount))} DOT`
        : `Spent ${Math.abs(Number(t.amount))} DOT`,
      body: t.description ?? t.type ?? "Wallet activity",
      time: t.createdAt ?? "",
      href: "/wallet",
    });
  }

  items.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  const visible = items.slice(0, 8);

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="tracking-editorial text-primary">Activity</span>
          <h3 className="mt-1 font-display text-lg font-light tracking-tight">Recent activity</h3>
        </div>
        <Link
          to="/notifications"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          All activity →
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No activity yet — start by completing a task, taking a Vantage assessment, or earning your first DOT.
        </div>
      ) : (
        <ol className="mt-5 space-y-2">
          {visible.map((item) => {
            const Icon = item.icon;
            const Wrap = ({ children }: { children: React.ReactNode }) =>
              item.href ? (
                <Link to={item.href} className="block">
                  {children}
                </Link>
              ) : (
                <>{children}</>
              );
            return (
              <li key={item.id}>
                <Wrap>
                  <div className="group flex items-start gap-3 rounded-xl border border-border p-3 transition-all hover:border-foreground/20 hover:bg-accent/30">
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md",
                        item.tone === "primary" && "bg-primary/10 text-primary",
                        item.tone === "gold" && "bg-gold/10 text-gold",
                        item.tone === "purple" && "bg-purple/10 text-purple",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] tabular text-muted-foreground">
                      {item.time ? new Date(item.time).toLocaleDateString() : ""}
                    </span>
                  </div>
                </Wrap>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
