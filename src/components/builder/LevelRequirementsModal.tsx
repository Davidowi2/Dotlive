/**
 * LevelRequirementsModal — shows what's needed to reach the next builder
 * level, with current progress and a link to satisfy each requirement.
 *
 * Tier 1 commitment: make the "Reach Level X" badge actually clickable.
 * Each requirement shows: progress bar, current value vs target, and a
 * button that takes the user to the right page to satisfy it.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LevelRequirement {
  key: string;        // "tasks" | "rating" | "ventures" | "reputation"
  label: string;      // "Complete 1 service order"
  current: number;
  target: number;
  met: boolean;
  actionLabel: string;
  actionHref: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  currentLevel: number;
  nextLevel: number;
  requirements: Record<string, boolean>;
  stats?: { tasks?: number; rating?: number; ventures?: number; reputation?: number };
}

const REQUIREMENT_DEFS: Record<string, Omit<LevelRequirement, "met" | "current">> = {
  tasks: {
    key: "tasks",
    label: "Complete service orders",
    target: 1,
    actionLabel: "Find a gig",
    actionHref: "/work",
  },
  rating: {
    key: "rating",
    label: "Average rating from clients",
    target: 4,
    actionLabel: "Deliver great work",
    actionHref: "/work",
  },
  ventures: {
    key: "ventures",
    label: "Win approved challenges",
    target: 1,
    actionLabel: "See open challenges",
    actionHref: "/builder#challenges",
  },
  reputation: {
    key: "reputation",
    label: "Earn reputation points",
    target: 500,
    actionLabel: "Earn your first 100",
    actionHref: "/builder#how-to-earn",
  },
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Explorer",
  2: "Contributor",
  3: "Specialist",
  4: "Core Builder",
  5: "Elite",
};

export function LevelRequirementsModal({
  open, onClose, currentLevel, nextLevel, requirements, stats,
}: Props) {
  if (!open) return null;

  const reqList: LevelRequirement[] = Object.entries(requirements).map(([k, met]) => {
    const def = REQUIREMENT_DEFS[k];
    if (!def) return null;
    const current = (stats?.[k as keyof typeof stats] ?? 0) as number;
    return {
      ...def,
      current,
      met,
    };
  }).filter(Boolean) as LevelRequirement[];

  const metCount = reqList.filter((r) => r.met).length;
  const totalCount = reqList.length;
  const allMet = metCount === totalCount && totalCount > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-modal-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 p-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
              <Sparkles className="h-3 w-3" />
              Builder progression
            </div>
            <h2 id="level-modal-title" className="mt-2 text-2xl font-semibold tracking-tight">
              Reach Level {nextLevel}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              From <strong className="text-foreground">{LEVEL_LABELS[currentLevel] ?? `Level ${currentLevel}`}</strong>{" "}
              to{" "}
              <strong className="text-foreground">{LEVEL_LABELS[nextLevel] ?? `Level ${nextLevel}`}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress count */}
        <div className="border-b border-border/60 bg-muted/30 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {metCount} of {totalCount} requirements met
            </span>
            {allMet ? (
              <span className="inline-flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Ready to promote
              </span>
            ) : (
              <span className="text-muted-foreground">
                {totalCount - metCount} to go
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(metCount / Math.max(totalCount, 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Requirement list */}
        <div className="space-y-3 p-6">
          {reqList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No requirements to reach the next level — you're already there.
            </p>
          ) : (
            reqList.map((r) => (
              <RequirementRow key={r.key} req={r} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border/60 bg-muted/30 p-4">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button asChild>
            <Link to="/work" onClick={onClose}>
              Find work
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RequirementRow({ req }: { req: LevelRequirement }) {
  const pct = Math.min(100, Math.round((req.current / Math.max(req.target, 1)) * 100));
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        req.met
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-border bg-background/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {req.met ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium">{req.label}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {req.current} / {req.target}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
            <div
              className={cn(
                "h-full transition-all",
                req.met ? "bg-emerald-500" : "bg-primary",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          {!req.met && (
            <Link
              to={req.actionHref}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {req.actionLabel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
