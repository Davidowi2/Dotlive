/**
 * DOT Academy — Whop-powered course catalog.
 *
 * Architecture (product-ready):
 * - DOT shows catalog, tracks progress, issues DOT rewards + certificates
 * - Whop hosts ALL content: videos, modules, assessments
 * - User journey: Browse on DOT → Buy on Whop → Content on Whop → DOT tracks completion
 *
 * Flow:
 * 1. User clicks "Enroll on Whop" → goes to Whop checkout
 * 2. Whop fires checkout.completed webhook → DOT auto-enrolls + credits wallet
 * 3. User completes course on Whop → Whop fires completion webhook → DOT mints certificate
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap, Sparkles, ExternalLink, ArrowRight,
  Check, Trophy, Play, BookOpen, Award, Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { listCourses, getMyEnrollments, enrollInCourse } from "@/api/academy";

type Course = Awaited<ReturnType<typeof listCourses>>[number];
type Enrollment = Awaited<ReturnType<typeof getMyEnrollments>>[number];

/** Append metadata to Whop URL so the webhook can credit the right user */
function whopUrl(url: string, userId?: string, dotReward = 100): string {
  if (!userId) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("metadata[user_id]", userId);
    u.searchParams.set("metadata[amount_usd_cents]", String(Math.max(1, Math.floor(dotReward * 100))));
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}metadata[user_id]=${encodeURIComponent(userId)}&metadata[amount_usd_cents]=${dotReward * 100}`;
  }
}

export const Route = createFileRoute("/_authenticated/academy")({
  head: () => ({
    meta: [
      { title: "DOT Academy" },
      { name: "description", content: "Courses for African founders. Complete to earn DOT rewards." },
    ],
  }),
  component: AcademyPage,
});

function AcademyPage() {
  const { user } = useDotAuth();
  const coursesQ = useQuery({ queryKey: ["academy-courses"], queryFn: listCourses, staleTime: 120_000 });
  const enrollmentsQ = useQuery({ queryKey: ["academy-enrollments"], queryFn: getMyEnrollments, staleTime: 60_000 });

  const enrolled = enrollmentsQ.data ?? [];
  const courses = coursesQ.data ?? [];
  const completedCount = enrolled.filter(e => e.status === "completed").length;

  return (
    <AppShell>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/50 p-8 mb-8">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
          <GraduationCap className="size-3.5" /> DOT Academy
        </div>
        <h1 className="font-display font-light tracking-tight" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
          Learn. Complete. Earn DOT.
        </h1>
        <p className="mt-2 text-muted-foreground max-w-xl">
          Courses built for African founders. Content lives on Whop — buy there, track progress here. Complete a course and earn DOT rewards + a verifiable certificate.
        </p>
        <div className="mt-5 flex flex-wrap gap-6 text-sm border-t border-border pt-5">
          <div>
            <p className="font-display text-2xl font-light tabular">{courses.length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Courses available</p>
          </div>
          <div className="h-8 w-px bg-border self-center" />
          <div>
            <p className="font-display text-2xl font-light tabular">{enrolled.length}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Enrolled</p>
          </div>
          <div className="h-8 w-px bg-border self-center" />
          <div>
            <p className="font-display text-2xl font-light tabular text-primary">{completedCount}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Completed</p>
          </div>
        </div>
      </section>

      {/* ── My Learning ── */}
      {enrolled.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-light tracking-tight mb-4">My Learning</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrolled.slice(0, 3).map(e => {
              const course = courses.find(c => c.id === e.courseId);
              const continueUrl = course?.whopUrl
                ? whopUrl(course.whopUrl, user?.id, course.dotReward ?? 100)
                : "#";
              return (
                <div key={e.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={e.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                      {e.status === "completed" ? "✓ Completed" : "In progress"}
                    </Badge>
                    {e.status === "completed" && <Award className="size-4 text-gold" />}
                  </div>
                  <h3 className="font-semibold text-sm">{e.course?.title ?? "Course"}</h3>
                  {e.status === "completed" ? (
                    <Button size="sm" variant="outline" asChild className="w-full">
                      <Link to="/certificates"><Award className="size-3.5 mr-1.5" /> View certificate</Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="default" asChild className="w-full">
                      <a href={continueUrl} target="_blank" rel="noopener noreferrer">
                        <Play className="size-3.5 mr-1.5" /> Continue on Whop <ExternalLink className="ml-1 size-3" />
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Catalog ── */}
      <section>
        <div className="flex items-end justify-between mb-5 border-b border-border pb-3">
          <div>
            <h2 className="font-display text-xl font-light tracking-tight">Course Catalog</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Content hosted on Whop · tracked + rewarded on DOT</p>
          </div>
        </div>

        {coursesQ.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4].map(i => <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted/40" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <GraduationCap className="mx-auto size-8 text-muted-foreground/50 mb-3" />
            <p className="font-display text-lg font-light">No courses yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Courses will appear here once added. Operators can add them at <Link to="/admin/courses" className="text-primary hover:underline">/admin/courses</Link>.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(c => (
              <CourseCard
                key={c.id}
                course={c}
                enrollment={enrolled.find(e => e.courseId === c.id)}
                userId={user?.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ── */}
      <section className="mt-12 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-base font-semibold mb-4">How DOT Academy works</h3>
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          {[
            { icon: BookOpen, step: "1", title: "Browse & buy", desc: "Find a course here, purchase it on Whop. Your Whop account is where the content lives." },
            { icon: Play, step: "2", title: "Learn on Whop", desc: "Watch videos, complete modules, and finish assessments — all inside Whop's platform." },
            { icon: Award, step: "3", title: "Earn on DOT", desc: "When you complete a course, DOT automatically credits your wallet and issues a certificate." },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {step}
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

/* ── Course Card ── */
function CourseCard({ course, enrollment, userId }: {
  course: Course;
  enrollment?: Enrollment;
  userId?: string;
}) {
  const enrolled = !!enrollment;
  const completed = enrollment?.status === "completed";
  const qc = useQueryClient();
  const mut = useMutation({ mutationFn: () => enrollInCourse(course.id) });
  const [justEnrolled, setJustEnrolled] = useState(false);

  // Build Whop URL with user metadata for webhook tracking
  const checkoutUrl = course.whopUrl
    ? whopUrl(course.whopUrl, userId, course.dotReward ?? 100)
    : null;

  const hasCoverImage = !!(course as any).coverImageUrl;

  return (
    <div className={cn(
      "group flex flex-col rounded-2xl border border-border bg-card overflow-hidden",
      "transition-all hover:border-primary/40 hover:shadow-md"
    )}>
      {/* Cover image or gradient */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/5 to-card">
        {hasCoverImage && (
          <img
            src={(course as any).coverImageUrl}
            alt={course.title}
            className="absolute inset-0 size-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="absolute inset-0 flex items-end p-3 bg-gradient-to-t from-black/40 to-transparent">
          <Badge variant="secondary" className="bg-background/90 text-[10px]">
            {course.category ?? "Course"}
          </Badge>
        </div>
        {completed && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
            <Check className="size-2.5" /> Done
          </div>
        )}
        {enrolled && !completed && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium">
            <Trophy className="size-2.5 text-gold" /> Enrolled
          </div>
        )}
        {/* Video indicator */}
        {!hasCoverImage && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex size-12 items-center justify-center rounded-full bg-background/80">
              <Play className="size-5 text-primary ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 space-y-2">
        <h3 className="font-display text-base font-semibold leading-tight line-clamp-2">
          {course.title}
        </h3>

        {course.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{course.description}</p>
        ) : (
          <p className="text-xs text-muted-foreground/50 italic flex-1">No description</p>
        )}

        {course.dotReward > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <Sparkles className="size-3" />
            Earn {course.dotReward} DOT on completion
          </div>
        )}

        {/* CTA */}
        <div className="pt-3 border-t border-border">
          {completed ? (
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link to="/certificates">
                <Award className="size-3.5 mr-1.5 text-gold" /> View certificate
              </Link>
            </Button>
          ) : enrolled || justEnrolled ? (
            <Button size="sm" variant="default" asChild className="w-full">
              <a href={checkoutUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                <Play className="size-3.5 mr-1.5" /> Continue on Whop <ExternalLink className="ml-1 size-3" />
              </a>
            </Button>
          ) : checkoutUrl ? (
            <Button size="sm" variant="hero" asChild className="w-full">
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                Enroll on Whop <ExternalLink className="ml-1 size-3.5" />
              </a>
            </Button>
          ) : (
            // Free course — no Whop URL
            <Button
              size="sm"
              variant="default"
              className="w-full"
              disabled={mut.isPending}
              onClick={async () => {
                await mut.mutateAsync();
                setJustEnrolled(true);
                qc.invalidateQueries({ queryKey: ["academy-enrollments"] });
              }}
            >
              {justEnrolled ? <><Check className="size-3.5 mr-1.5" /> Enrolled</> : "Enroll free"}
            </Button>
          )}
        </div>

        <p className="text-[10px] text-center text-muted-foreground/60">
          {checkoutUrl ? "Content hosted on Whop · Progress tracked on DOT" : "Free course · Tracked on DOT"}
        </p>
      </div>
    </div>
  );
}
