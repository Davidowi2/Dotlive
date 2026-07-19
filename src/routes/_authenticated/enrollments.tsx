import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap, Award, Clock, Loader2, ArrowRight,
  ExternalLink, Play, Check
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMyEnrollments, listCourses } from "@/api/academy";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/enrollments")({
  head: () => ({ meta: [{ title: "Enrollments — DOT" }] }),
  component: EnrollmentsPage,
});

function EnrollmentsPage() {
  const coursesQ = useQuery({ queryKey: ["academy-courses"], queryFn: listCourses, staleTime: 120_000 });
  const enrollmentsQ = useQuery({ queryKey: ["academy-enrollments"], queryFn: getMyEnrollments, staleTime: 60_000 });

  const courses = coursesQ.data ?? [];
  const enrolled = enrollmentsQ.data ?? [];

  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

  return (
    <AppShell>
      <PageHeader
        title="My enrollments"
        subtitle="Track progress, earnings, and certificates."
      />

      {enrollmentsQ.isLoading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/40" />)}
        </div>
      ) : enrolled.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <GraduationCap className="mx-auto size-8 text-muted-foreground/50 mb-3" />
          <p className="font-display text-lg font-light">No enrollments yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Browse <Link to="/academy" className="text-primary hover:underline">the catalog</Link> to get started.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrolled.map(e => {
            const course = courseMap[e.courseId];
            const status = (e as any).status ?? "pending";
            const isCompleted = status === "completed";
            const isPending = status === "pending";
            const raw = course as any;
            const continuedAt = (raw as any)?.continuedAt ?? e.createdAt ?? null;

            return (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isCompleted ? "default" : isPending ? "secondary" : "outline"} className="text-[10px]">
                      {isCompleted ? "Completed" : isPending ? "Pending" : status}
                    </Badge>
                    {(raw as any)?.dotReward > 0 && (
                      <span className="text-[10px] text-primary font-medium">
                        Earn {(raw as any).dotReward} DOT
                      </span>
                    )}
                  </div>
                  {isCompleted && <Award className="size-4 text-gold" />}
                </div>

                <h3 className="font-semibold text-sm">{raw?.title ?? "Course"}</h3>

                <div className="text-xs text-muted-foreground space-y-1">
                  {continuedAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3" />
                      Started {new Date(continuedAt).toLocaleDateString()}
                    </div>
                  )}
                  {(e as any).completedAt && (
                    <div className="flex items-center gap-1.5 text-primary">
                      <Check className="size-3" />
                      Completed {new Date((e as any).completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border">
                  {isCompleted ? (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/certificates" search={{}}>
                        <Award className="size-3.5 mr-1.5 text-gold" /> View certificate
                      </Link>
                    </Button>
                  ) : raw?.whopUrl ? (
                    <Button asChild size="sm" variant="default" className="w-full">
                      <a href={raw.whopUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="size-3.5 mr-1.5" /> Continue on Whop <ExternalLink className="ml-1 size-3" />
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="w-full">
                      Check your Whop account for access
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
