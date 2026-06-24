import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Award,
  Gift,
  Sparkles,
  PlayCircle,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { PageSkeleton } from "@/components/app/PageSkeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { listCourses, getMyEnrollments, enrollInCourse, completeCourse } from "@/api/academy";
import { formatDot } from "@/lib/constants";
import type { Course } from "@/types/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/academy")({
  head: () => ({
    meta: [
      { title: "DOT Academy — DOT" },
      { name: "description", content: "Founder education powered by DOT Academy." },
    ],
  }),
  component: AcademyPage,
});

/**
 * Academy
 *
 * Course catalogue delivered via Whop. Each course has a DOT reward and an
 * optional Vantage boost on completion. We split the catalogue into
 * "In progress" and "Available" so founders can resume quickly.
 */
function AcademyPage() {
  const { user } = useDotAuth();
  const qc = useQueryClient();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: listCourses,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: getMyEnrollments,
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) => enrollInCourse(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-enrollments"] }),
  });

  const completeMutation = useMutation({
    mutationFn: (courseId: string) => completeCourse(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-enrollments"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const enrollMap = new Map(enrollments.map((e) => [e.courseId, e]));

  async function enroll(courseId: string, whopUrl: string | null) {
    if (!user) return;
    try {
      await enrollMutation.mutateAsync(courseId);
      toast.success("Enrolled! Opening course on Whop.");
      if (whopUrl) window.open(whopUrl, "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not enroll");
    }
  }

  async function complete(courseId: string, reward: number) {
    if (!user) return;
    try {
      await completeMutation.mutateAsync(courseId);
      toast.success(
        reward > 0 ? `Completed! +${formatDot(reward)} DOT earned.` : "Marked complete!"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  }

  const completedCount = enrollments.filter((e) => e.status === "completed").length;
  const inProgressCount = enrollments.filter((e) => e.status === "enrolled").length;
  const totalDotEarned = courses.reduce((sum, c) => {
    const enr = enrollMap.get(c.id);
    return sum + (enr?.status === "completed" ? c.dotReward : 0);
  }, 0);

  const inProgress = courses.filter((c) => {
    const enr = enrollMap.get(c.id);
    return enr && enr.status !== "completed";
  });
  const available = courses.filter((c) => !enrollMap.get(c.id));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Learn"
        title="DOT Academy"
        subtitle="Founder education delivered via Whop. Complete tracks to earn DOT and boost Vantage."
        action={
          <Badge variant="secondary">
            <Award className="mr-1 size-3" /> {completedCount} completed
          </Badge>
        }
      />

      {isLoading ? (
        <PageSkeleton.CardGrid count={6} cols={3} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No courses yet"
          description="Check back soon — new learning tracks are being added."
        />
      ) : (
        <>
          {/* ── Snapshot strip ──────────────────────────────────── */}
          <section className="mt-8 grid gap-3 sm:grid-cols-3">
            <SnapshotTile
              icon={BookOpen}
              label="Total courses"
              value={String(courses.length)}
              tone="primary"
            />
            <SnapshotTile
              icon={PlayCircle}
              label="In progress"
              value={String(inProgressCount)}
              tone="teal"
            />
            <SnapshotTile
              icon={Gift}
              label="DOT earned"
              value={`${formatDot(totalDotEarned)} DOT`}
              tone="gold"
            />
          </section>

          {/* ── In progress ─────────────────────────────────────── */}
          {inProgress.length > 0 && (
            <>
              <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px flex-1 bg-border" />
                <span>Continue learning</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inProgress.map((c) => {
                  const enr = enrollMap.get(c.id);
                  const done = enr?.status === "completed";
                  return (
                    <CourseCard
                      key={c.id}
                      course={c}
                      status={done ? "completed" : "in_progress"}
                      onEnroll={() => enroll(c.id, c.whopUrl)}
                      onComplete={() => complete(c.id, c.dotReward)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* ── Available courses ───────────────────────────────── */}
          {available.length > 0 && (
            <>
              <div className="my-10 flex items-center gap-3 text-[10px] tracking-widest uppercase text-muted-foreground/60">
                <span className="h-px flex-1 bg-border" />
                <span>Catalogue</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {available.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    status="available"
                    onEnroll={() => enroll(c.id, c.whopUrl)}
                    onComplete={() => complete(c.id, c.dotReward)}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── Footer tip ──────────────────────────────────────── */}
          {courses.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/50 px-5 py-4">
              <p className="text-xs text-muted-foreground">
                Completed tracks pay out DOT to your wallet and raise your Vantage Point.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/vantage">
                  See Vantage <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

/* ── Course card ──────────────────────────────────────────────────────── */

type CourseStatus = "available" | "in_progress" | "completed";

interface CourseCardProps {
  course: Course;
  status: CourseStatus;
  onEnroll: () => void;
  onComplete: () => void;
}

function CourseCard({ course: c, status, onEnroll, onComplete }: CourseCardProps) {
  const done = status === "completed";
  const inProgress = status === "in_progress";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors",
        done && "border-primary/30 bg-primary/5",
        inProgress && "border-teal/30 bg-teal/5"
      )}
    >
      {/* Status badge (top-right) */}
      {(done || inProgress) && (
        <div className="absolute right-4 top-4">
          {done ? (
            <Badge variant="secondary" className="border-primary/30 bg-primary/10 text-primary">
              <CheckCircle2 className="mr-1 size-3" /> Done
            </Badge>
          ) : (
            <Badge variant="secondary" className="border-teal/30 bg-teal/10 text-teal">
              <PlayCircle className="mr-1 size-3" /> In progress
            </Badge>
          )}
        </div>
      )}

      {/* Icon + category */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            done ? "bg-primary/10 text-primary"
              : inProgress ? "bg-teal/10 text-teal"
              : "bg-muted text-muted-foreground"
          )}
        >
          <BookOpen className="size-5" />
        </span>
        {c.category && <Badge variant="outline">{c.category}</Badge>}
      </div>

      {/* Title + description */}
      <h3 className="mt-4 pr-16 font-display text-lg font-light tracking-tight">{c.title}</h3>
      {c.description && (
        <p className="mt-1 line-clamp-3 flex-1 text-sm font-light text-muted-foreground">
          {c.description}
        </p>
      )}

      {/* Rewards row */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {c.dotReward > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-gold">
            <Gift className="size-3" /> +{formatDot(c.dotReward)} DOT
          </span>
        )}
        {c.vantageBoost > 0 && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Sparkles className="size-3" /> +{c.vantageBoost} Vantage
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {done ? (
          <Button variant="outline" className="flex-1" disabled>
            <CheckCircle2 className="size-4 text-primary" /> Completed
          </Button>
        ) : inProgress ? (
          <>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => c.whopUrl && window.open(c.whopUrl, "_blank", "noopener")}
            >
              <ExternalLink className="size-4" /> Resume
            </Button>
            <Button variant="hero" onClick={onComplete}>
              Mark done
            </Button>
          </>
        ) : (
          <Button variant="hero" className="flex-1" onClick={onEnroll}>
            Enroll <ExternalLink className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Snapshot tile ────────────────────────────────────────────────────── */

interface SnapshotTileProps {
  icon: typeof BookOpen;
  label: string;
  value: string;
  tone: "primary" | "teal" | "gold";
}

function SnapshotTile({ icon: Icon, label, value, tone }: SnapshotTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          tone === "primary" && "bg-primary/10 text-primary",
          tone === "teal" && "bg-teal/10 text-teal",
          tone === "gold" && "bg-gold/10 text-gold"
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 font-display text-xl font-light tabular tracking-tight">{value}</p>
      </div>
    </div>
  );
}