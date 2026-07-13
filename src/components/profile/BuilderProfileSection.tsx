/**
 * BuilderProfileSection — Upwork-style builder profile summary.
 *
 * Shows (when the user is a builder):
 *   - Active gigs (services they've posted)
 *   - Completed orders (work history)
 *   - Reviews (from clients)
 *   - Skills + portfolio (from builder profile)
 *   - Reputation + level summary
 *
 * Used inside the /profile page so builders see *why a client should
 * hire them* — same question the public-facing /founder/$id profile
 * answers, but from the builder's own POV.
 */
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Hammer, Star, CheckCircle2, Clock, Award, Briefcase,
  Edit3, Package, TrendingUp, Sparkles, ExternalLink, Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { listMyServices, listOrders } from "@/api/marketplace";
import { dotApi } from "@/api/client";
import { formatDot } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BuilderDocumentsForm } from "@/components/builder/BuilderDocumentsForm";
import { BuilderCertificationsForm } from "@/components/builder/BuilderCertificationsForm";
import { BuilderVouchCard } from "@/components/builder/BuilderVouchCard";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  priceDot: string | number;
  deliveryDays: number;
  rating?: number;
  ordersCount?: number;
  isActive: boolean;
}

interface ServiceOrder {
  id: string;
  title: string;
  status: "in_progress" | "delivered" | "completed" | "cancelled" | "disputed";
  amountDot: string | number;
  completedAt?: string | null;
  createdAt: string;
}

interface BuilderProfile {
  headline?: string;
  bio?: string;
  skills?: string[];
  portfolio?: Array<{ title: string; url?: string; description?: string }>;
}

interface ReputationSummary {
  reputation: number;
  level: number;
  label: string;
}

export function BuilderProfileSection() {
  const { user } = useDotAuth();

  // ─── Services (gigs the builder has posted) ──────────
  const servicesQ = useQuery({
    queryKey: ["services", "mine"],
    queryFn: () => listMyServices(),
  });

  // ─── Orders where this user is the builder ───────────
  const ordersQ = useQuery({
    queryKey: ["orders", "builder", user?.id],
    enabled: !!user,
    queryFn: () => listOrders("builder"),
  });

  // ─── Builder profile (headline / bio / skills / portfolio) ──
  const profileQ = useQuery({
    queryKey: ["builder-profile", "me"],
    queryFn: async () => {
      try {
        return await dotApi.get<{ profile: BuilderProfile }>("/api/users/me/builder-profile");
      } catch {
        return { profile: {} as BuilderProfile };
      }
    },
  });

  // ─── Reputation / level ───────────────────────────────
  const repQ = useQuery({
    queryKey: ["builder-level", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        return await dotApi.get<ReputationSummary>("/api/builder/level");
      } catch {
        return { reputation: 0, level: 1, label: "Explorer" } as ReputationSummary;
      }
    },
  });

  const services = (servicesQ.data ?? []) as Service[];
  const orders = (ordersQ.data ?? []) as ServiceOrder[];
  const profile = profileQ.data?.profile ?? {};
  const reputation = repQ.data;

  const activeServices = Array.isArray(services)
    ? services.filter((s) => s.isActive)
    : [];
  const completedOrders = Array.isArray(orders)
    ? orders.filter((o) => o.status === "completed")
    : [];
  const totalEarned = completedOrders.reduce(
    (sum, o) => sum + Number(o.amountDot || 0),
    0,
  );

  const isLoading = servicesQ.isLoading || ordersQ.isLoading;

  return (
    <>
      {/* ── Section divider ───────────────────────────────── */}
      <div className="mt-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-semibold text-muted-foreground">
          <Hammer className="size-3 text-gold" />
          Builder profile
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* ── Headline + bio ────────────────────────────────── */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold tracking-tight">
              {profile.headline ?? "Add a headline to your builder profile"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.bio ?? "Tell clients what you do, who you've done it for, and what makes your work different. This is the first thing clients see on your profile."}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings">
              <Edit3 className="size-3.5" />
              Edit
            </Link>
          </Button>
        </div>

        {/* Skills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profile.skills && profile.skills.length > 0 ? (
            profile.skills.map((s, i) => (
              <Badge key={i} variant="secondary">{s}</Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No skills added yet. Add skills in settings so clients can find you.
            </p>
          )}
        </div>
      </section>

      {/* ── Quick stats: gigs / orders / earnings / reputation ── */}
      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          tone="gold"
          label="Active gigs"
          value={isLoading ? "…" : String(activeServices.length)}
          hint={activeServices.length === 0 ? "Post your first gig to start" : "Services you offer"}
        />
        <StatCard
          icon={CheckCircle2}
          tone="primary"
          label="Completed orders"
          value={isLoading ? "…" : String(completedOrders.length)}
          hint="Successfully delivered work"
        />
        <StatCard
          icon={TrendingUp}
          tone="teal"
          label="Total earned"
          value={isLoading ? "…" : `${formatDot(totalEarned)} DOT`}
          hint="From completed work"
        />
        <StatCard
          icon={Sparkles}
          tone="purple"
          label={reputation?.label ? `Level ${reputation.level} · ${reputation.label}` : "Reputation"}
          value={reputation ? String(reputation.reputation) : "…"}
          hint="Reputation points"
        />
      </section>

      {/* ── Active gigs ───────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div>
            <h3 className="font-display text-base font-semibold">Active gigs</h3>
            <p className="text-xs text-muted-foreground">
              Services clients can order. Click a card to see orders.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/work">
              <Plus className="size-3.5" />
              Manage in DOT Work
            </Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : activeServices.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Wrench className="mx-auto size-7 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No gigs posted yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Post a service on DOT Work to start earning DOT. Buyers hire you based on your headline, samples, and reviews.
            </p>
            <Button variant="hero" size="sm" className="mt-4" asChild>
              <Link to="/work">Post your first gig</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {activeServices.slice(0, 5).map((s) => (
              <article key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-display text-sm font-semibold">{s.title}</h4>
                    <Badge variant="outline" className="shrink-0">{s.category}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-sm font-semibold tabular-nums">
                    {formatDot(Number(s.priceDot))} DOT
                  </p>
                  <p className="text-xs text-muted-foreground">{s.deliveryDays}d delivery</p>
                </div>
              </article>
            ))}
            {activeServices.length > 5 && (
              <p className="px-5 py-2.5 text-xs text-muted-foreground">
                + {activeServices.length - 5} more — view in DOT Work
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Completed orders + reviews ────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div>
            <h3 className="font-display text-base font-semibold">Recent completed work</h3>
            <p className="text-xs text-muted-foreground">
              Builds your reputation. Each completed order adds 50 reputation points.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/work">View all orders</Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : completedOrders.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Package className="mx-auto size-7 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No completed orders yet</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              When clients accept your deliveries, they appear here as proof of work.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {completedOrders.slice(0, 5).map((o) => (
              <article key={o.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium">{o.title}</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Completed {o.completedAt ? new Date(o.completedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                    <CheckCircle2 className="mr-1 size-3" /> Completed
                  </Badge>
                  <span className="font-display text-sm font-semibold tabular-nums">
                    +{formatDot(Number(o.amountDot))} DOT
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ── Portfolio (if any) ───────────────────────────── */}
      {profile.portfolio && profile.portfolio.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-display text-base font-semibold">Portfolio</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.portfolio.map((p, i) => (
              <a
                key={i}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/40 hover:bg-background/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm">{p.title}</h4>
                  {p.url && <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-primary" />}
                </div>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Documents (CV, certificates, projects) ────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <BuilderDocumentsForm />
      </section>

      {/* ── Certifications ────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <BuilderCertificationsForm />
      </section>

      {/* ── Community Vouches ─────────────────────────────── */}
      {user && (
        <section className="mt-6">
          <BuilderVouchCard
            builderId={user.id}
            builderName={user.name || "Builder"}
          />
        </section>
      )}
    </>
  );
}

/* ───────── Helper sub-components ───────── */

function StatCard({
  icon: Icon, tone, label, value, hint,
}: { icon: any; tone: "primary" | "teal" | "gold" | "purple"; label: string; value: string; hint?: string }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal/10 text-teal",
    gold: "bg-gold/10 text-gold",
    purple: "bg-purple/10 text-purple",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs font-medium text-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Plus(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}