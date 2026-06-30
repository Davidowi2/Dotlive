/**
 * EcosystemEmptyState — the "explains the platform" empty state.
 *
 * Replaces passive empty states ("No jobs found") with active ecosystem
 * framing ("Founders post jobs. Become a Founder to add the first one.").
 *
 * Three parts:
 *   1. WHAT is missing
 *   2. WHO creates it (the role that should be posting)
 *   3. HOW to become that role (CTA if you don't have it, primary CTA if you do)
 *
 * Use this for empty states where the data depends on *other users*
 * taking an action — jobs, sessions, pitchathons, communities, challenges,
 * etc. Use the regular EmptyState for user-personal empty states (no orders,
 * no submissions, no certificates).
 */
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Lock, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDotAuth } from "@/contexts/DotAuthContext";
import type { EmptyStateAccent } from "@/components/app/EmptyState";

type UserRole =
  | "builder"
  | "founder"
  | "investor"
  | "community_leader"
  | "capital_partner"
  | "vendor"
  | "moderator"
  | "support"
  | "finance"
  | "admin"
  | "super_admin";

interface EcosystemEmptyStateProps {
  icon: LucideIcon;
  /** What's missing — "No jobs posted" */
  title: string;
  /** Quick contextual note — "Open positions from founders" */
  subtitle?: string;
  /** Who creates this — "Founders and Admins" */
  postedBy: string;
  /** Role required to post — checks against user's roles */
  requiredRole: UserRole | UserRole[];
  /** Where the user can become eligible — typically /onboarding */
  upgradeHref?: string;
  /** Where the user goes to actually post — /work for jobs, etc. */
  postHref?: string;
  /** Label for the post CTA — "Post the first job" */
  postLabel?: string;
  /** Extra action shown below the primary CTA (e.g. "Browse gigs") */
  secondaryAction?: { label: string; href: string };
  /** Optional accent color */
  accent?: EmptyStateAccent;
  /** Compact card style (default) or full-page first-visit style */
  variant?: "card" | "full-page";
  className?: string;
}

const accentClasses: Record<EmptyStateAccent, { text: string; chip: string; ring: string }> = {
  primary: { text: "text-primary", chip: "bg-primary/10", ring: "ring-primary/20" },
  teal:    { text: "text-teal",    chip: "bg-teal/10",    ring: "ring-teal/20" },
  gold:    { text: "text-gold",    chip: "bg-gold/10",    ring: "ring-gold/20" },
  purple:  { text: "text-purple",  chip: "bg-purple/10",  ring: "ring-purple/20" },
};

export function EcosystemEmptyState({
  icon: Icon,
  title,
  subtitle,
  postedBy,
  requiredRole,
  upgradeHref = "/onboarding",
  postHref,
  postLabel,
  secondaryAction,
  accent = "primary",
  variant = "card",
  className,
}: EcosystemEmptyStateProps) {
  const { roles = [], hasRole } = useDotAuth() as {
    roles?: UserRole[];
    hasRole?: (role: string) => boolean;
  };

  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const checkHas = (r: UserRole) => (hasRole ? hasRole(r) : roles.includes(r));
  const hasRequiredRole = requiredRoles.some(checkHas);
  const hasAnyAdminRole =
    checkHas("admin") || checkHas("super_admin") || checkHas("moderator") ||
    checkHas("support") || checkHas("finance");

  const a = accentClasses[accent];

  return (
    <div
      className={cn(
        variant === "full-page"
          ? "flex flex-1 flex-col items-center justify-center gap-5 py-20 text-center"
          : "mt-6 flex flex-col items-center gap-4 border border-dashed border-border bg-card px-6 py-14 text-center",
        className,
      )}
    >
      {/* Icon */}
      <div className={cn("flex items-center justify-center rounded-sm ring-1 ring-inset size-14", a.chip, a.ring)}>
        <Icon className={cn("size-7", a.text)} />
      </div>

      {/* Title + subtitle */}
      <div className="max-w-md">
        <h2 className={cn("font-display tracking-tight", variant === "full-page" ? "text-xl font-light" : "text-sm font-light")}>
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground font-light">{subtitle}</p>
        )}
      </div>

      {/* Ecosystem explanation */}
      <div className="max-w-md rounded-xl border border-border/60 bg-muted/30 px-5 py-4 text-left">
        <div className="flex items-start gap-3">
          <Users className={cn("mt-0.5 size-4 shrink-0", a.text)} />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              Posted by {postedBy}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasRequiredRole
                ? postHref
                  ? `You're eligible. Click below to post.`
                  : `You're eligible. Take action from the main page.`
                : hasAnyAdminRole
                ? `As staff you can help curate this.`
                : `Switch to a ${requiredRoles.join(" or ")} role to start posting.`}
            </p>
          </div>
        </div>
      </div>

      {/* Primary action */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {hasRequiredRole && postHref ? (
          <Button variant="hero" asChild>
            <Link to={postHref}>
              {postLabel ?? "Add the first one"}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        ) : (
          <Button variant="hero" asChild>
            <Link to={upgradeHref}>
              <Lock className="size-3.5" />
              Become a {requiredRoles[0]}
            </Link>
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" asChild>
            <Link to={secondaryAction.href}>{secondaryAction.label}</Link>
          </Button>
        )}
      </div>

      {/* Operator-only note */}
      {hasAnyAdminRole && !hasRequiredRole && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3" />
          Operators can also post this from the Operator panel.
        </p>
      )}
    </div>
  );
}