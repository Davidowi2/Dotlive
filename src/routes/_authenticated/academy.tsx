import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ExternalLink, CheckCircle2, Award, Gift } from "lucide-react";
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
      toast.success(reward > 0 ? `Completed! +${formatDot(reward)} DOT earned.` : "Marked complete!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  }

  const completedCount = enrollments.filter((e) => e.status === "completed").length;

  return (
    <AppShell>
      <PageHeader
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
          icon={BookOpen}
          title="No courses yet"
          description="Check back soon — new learning tracks are being added."
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const enr = enrollMap.get(c.id);
            const done = enr?.status === "completed";
            return (
              <div key={c.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="size-5" />
                  </span>
                  {c.category && <Badge variant="outline">{c.category}</Badge>}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {c.dotReward > 0 && (
                    <span className="flex items-center gap-1 text-gold">
                      <Gift className="size-3" /> +{formatDot(c.dotReward)} DOT
                    </span>
                  )}
                  {c.vantageBoost > 0 && <span>+{c.vantageBoost} Vantage</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  {done ? (
                    <Button variant="outline" className="flex-1" disabled>
                      <CheckCircle2 className="size-4 text-primary" /> Completed
                    </Button>
                  ) : enr ? (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => c.whopUrl && window.open(c.whopUrl, "_blank", "noopener")}>
                        <ExternalLink className="size-4" /> Open
                      </Button>
                      <Button variant="hero" onClick={() => complete(c.id, c.dotReward)}>
                        Mark done
                      </Button>
                    </>
                  ) : (
                    <Button variant="hero" className="flex-1" onClick={() => enroll(c.id, c.whopUrl)}>
                      Enroll <ExternalLink className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
