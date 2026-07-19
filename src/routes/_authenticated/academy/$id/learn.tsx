import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCourse, getMyEnrollments } from "@/api/academy";
import { Play, Check, ExternalLink, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/academy/$id/learn")({
  head: () => ({ meta: [{ title: "Learn — DOT Academy" }] }),
  component: CoursePlayerPage,
});

function CoursePlayerPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["academy-course", id], queryFn: () => getCourse(id), staleTime: 120_000 });
  const enrollmentsQ = useQuery({ queryKey: ["academy-enrollments"], queryFn: getMyEnrollments, staleTime: 60_000 });
  const course = q.data;
  const enrollment = (enrollmentsQ.data ?? []).find((e) => e.courseId === id);
  const hasAccess = !!enrollment || !course?.whopUrl;

  if (q.isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </AppShell>
    );
  }

  if (!course) {
    return (
      <AppShell>
        <PageHeader title="Course" subtitle="Not found" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title={course.title}
        subtitle={course.description ?? "Course player"}
        action={
          (enrollment as any)?.status === "completed" ? (
            <Badge variant="default"><Check className="mr-1 size-3" /> Completed</Badge>
          ) : (
            <Badge variant="secondary">In progress</Badge>
          )
        }
      />
      <div className="mx-auto max-w-6xl mt-8 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <div className="rounded-xl border border-border bg-card">
            <div className="aspect-video w-full bg-muted/40 flex items-center justify-center">
              {hasAccess ? (
                course.whopUrl ? (
                  <Button asChild size="lg" className="gap-2">
                    <a href={course.whopUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="size-4" /> Continue on Whop <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">No embedded player yet. Content is hosted externally.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Enroll to access course content.</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Reward: <strong className="text-foreground">{course.dotReward} DOT</strong></span>
            <span>Level: {course.level ?? "All levels"}</span>
          </div>
        </div>
        <aside className="md:col-span-4 space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <h3 className="font-display font-semibold">Curriculum</h3>
            <p className="mt-1 text-muted-foreground">Content is hosted on Whop. Progress is tracked on DOT.</p>
          </div>
          {!!course.whopUrl && (
            <Button asChild className="w-full">
              <a href={course.whopUrl} target="_blank" rel="noopener noreferrer">
                <Play className="mr-2 size-4" /> Open course on Whop
              </a>
            </Button>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
