import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppShell } from "@/components/app/AppShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, Play, Clock, Award, Loader2 } from "lucide-react";
import { getCourse, enrollInCourse, getMyEnrollments } from "@/api/academy";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/academy/course/$id")({
  head: () => ({ meta: [{ title: "Course — DOT Academy" }] }),
  component: CourseDetailPage,
});

function CourseDetailPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["academy-course", id], queryFn: () => getCourse(id), staleTime: 120_000 });
  const enrollmentsQ = useQuery({ queryKey: ["academy-enrollments"], queryFn: getMyEnrollments, staleTime: 60_000 });
  const enrollMutation = useMutation({
    mutationFn: () => enrollInCourse(id),
    onSuccess: () => {
      toast.success("Enrolled");
      enrollmentsQ.refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "Enroll failed"),
  });
  const course = q.data;
  const enrolled = enrollmentsQ.data ?? [];
  const myEnrollment = enrolled.find((e) => e.courseId === id);
  const status = (myEnrollment as any)?.status ?? "none";

  return (
    <AppShell>
      <PageHeader
        title={course?.title ?? "Course"}
        subtitle={course?.description ?? ""}
        action={
          status === "completed" ? (
            <Badge variant="default"><Award className="mr-1 size-3" /> Completed</Badge>
          ) : status === "in_progress" ? (
            <Badge variant="secondary">In progress</Badge>
          ) : (
            <Button size="sm" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
              {enrollMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <><Play className="mr-1.5 size-3.5" /> Enroll</>}
            </Button>
          )
        }
      />
      {q.isLoading ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !course ? (
        <p className="mt-8 text-sm text-destructive">Course not found.</p>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-3">
                {course.dotReward > 0 && (
                  <Badge variant="secondary">Earn {course.dotReward} DOT</Badge>
                )}
                <Badge variant="outline">Level: {course.level ?? "All levels"}</Badge>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Clock className="size-3.5" /> {course.durationMinutes ? `${Math.round(course.durationMinutes/60)}h` : "Self-paced"}
                </span>
              </div>
              {!!course.whopUrl && (
                <Button asChild className="w-full md:w-auto">
                  <a href={course.whopUrl} target="_blank" rel="noopener noreferrer">
                    <GraduationCap className="mr-2 size-4" /> Open on Whop
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enrollment</CardTitle>
              <CardDescription>Track progress and rewards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{status === "none" ? "Not enrolled" : status.replace("_", " ")}</p>
              </div>
              {status !== "none" && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Reward</p>
                  <p className="font-medium text-primary">{course.dotReward} DOT</p>
                </div>
              )}
              {!!course.whopUrl && status === "none" && (
                <p className="text-xs text-muted-foreground">Content is hosted on Whop. Enroll and access via Whop.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
