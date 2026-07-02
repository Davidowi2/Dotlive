/**
 * DOT Academy — Whop-powered course catalog with fully custom UI.
 *
 * Architecture:
 *   - Course catalog, course detail, my-learning list all custom UI here.
 *   - Course content + checkout hosted by Whop.
 *   - Whop webhook (POST /api/webhooks/whop) auto-enrolls the buyer via
 *     whopProductId match (see dotlive-backend/apps/api/src/routes/webhooks.ts).
 *   - On Whop "completion" event we call /api/academy/complete → wallet credit.
 *
 * Users see ZERO of Whop until checkout.  The route /academy → catalog,
 * /academy/$id → detail, /academy/learn → my-learning.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Check,
  Trophy,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDotAuth } from "@/contexts/DotAuthContext";
import { formatDot } from "@/lib/constants";
import {
  listCourses,
  getMyEnrollments,
  enrollInCourse,
} from "@/api/academy";
type Course = Awaited<ReturnType<typeof listCourses>>[number];
type Enrollment = Awaited<ReturnType<typeof getMyEnrollments>>[number];

/**
 * Build a Whop checkout URL with DOT-required metadata attached.
 *
 *   ?metadata[user_id]=<our user id>
 *   ?metadata[amount_usd_cents]=<DOT * 100>  (1 DOT = $1 placeholder)
 *
 * The webhook handler reads these two fields to credit the wallet.
 * If `course.dotReward` is unset we fall back to the course id + a
 * safe 100 DOT default so the webhook has something to credit.
 */
function buildWhopUrl(whopUrl: string, userId: string, dot: number): string {
  try {
    const url = new URL(whopUrl);
    url.searchParams.set("metadata[user_id]", userId);
    url.searchParams.set("metadata[amount_usd_cents]", String(Math.max(1, Math.floor(dot * 100))));
    return url.toString();
  } catch {
    // Whop URL is malformed — append as raw query string.
    const sep = whopUrl.includes("?") ? "&" : "?";
    return `${whopUrl}${sep}metadata[user_id]=${encodeURIComponent(userId)}&metadata[amount_usd_cents]=${Math.max(1, Math.floor(dot * 100))}`;
  }
}

export const Route = createFileRoute("/_authenticated/academy")({
  head: () => ({
    meta: [
      { title: "DOT Academy — Courses that move the needle" },
      {
        name: "description",
        content:
          "Learn from operators who've shipped. CATALOG delivered by Whop, progress tracked by DOT, rewards on completion.",
      },
    ],
  }),
  component: AcademyPage,
});

/* -------------------- Page -------------------- */

function AcademyPage() {
  const { user } = useDotAuth();
  const courses = useQuery({ queryKey: ["academy-courses"], queryFn: listCourses });
  const enrollments = useQuery({
    queryKey: ["academy-enrollments"],
    queryFn: getMyEnrollments,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero
          enrolledCount={enrollments.data?.length ?? 0}
        />

        <div className="mx-auto max-w-6xl px-6 pb-24">
          <SectionHeading title="My Learning" subtitle="Continue where you left off." />
          <MyLearning enrollments={enrollments.data?.enrollments ?? []} />

          <SectionHeading
            title="Featured Courses"
            subtitle="Hand-picked for African founders. Practical, not theoretical."
          />
          <CatalogGrid
            courses={courses.data ?? []}
            enrollments={enrollments.data ?? []}
            isLoading={courses.isLoading}
          />
        </div>
      </main>
    </div>
  );
}

/* -------------------- Hero -------------------- */

function Hero({ enrolledCount }: { enrolledCount: number }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-card/30 py-20">
      <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none">
        <div className="absolute -left-32 top-20 size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
          <GraduationCap className="size-3.5" />
          DOT Academy
        </div>
        <h1 className="mt-4 font-display font-light leading-[0.95] tracking-tight text-foreground"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}>
          Learn from operators<br />
          who actually shipped.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Each course is delivered via Whop for checkout &amp; content. We track
          your progress here. Complete a course and earn DOT + a
          verifiable certificate.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border pt-6 text-sm">
          <div>
            <p className="font-display text-2xl font-light tabular">{enrolledCount}</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Courses enrolled
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-display text-2xl font-light tabular">100+</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Hours of content
            </p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-display text-2xl font-light tabular">USD</p>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Paid via Whop
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- Section heading -------------------- */

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-16 mb-6 flex items-end justify-between border-b border-border pb-3">
      <div>
        <h2 className="font-display text-2xl font-light tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* -------------------- My Learning -------------------- */

function MyLearning({ enrollments }: { enrollments: Enrollment[] }) {
  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        You haven't enrolled in anything yet. Pick a course below to start.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {enrollments.slice(0, 3).map((e) => (
        <Card key={e.id}>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {e.status === "completed" ? "Completed" : "Enrolled"}
            </p>
            <h3 className="mt-1 font-display text-lg font-light">
              {e.course?.title ?? "Course"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {e.course?.description ?? "—"}
            </p>
            <Button
              variant={e.status === "completed" ? "outline" : "default"}
              size="sm"
              asChild
              className="mt-4"
            >
              <a
                href={e.status === "completed" ? "#" : `/academy/${e.courseId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {e.status === "completed" ? "View certificate" : "Continue"} <ArrowRight className="ml-1 size-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* -------------------- Catalog -------------------- */

function CatalogGrid({
  courses,
  enrollments,
  isLoading,
}: {
  courses: Course[];
  enrollments: Enrollment[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-72 rounded-2xl border border-border bg-card/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <GraduationCap className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-4 font-display text-xl font-light">
          Catalog launching soon
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          The DOT Academy catalog opens with our first cohort of operator-led
          courses. Add your email to be notified.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard
          key={c.id}
          course={c}
          enrollment={enrollments.find((e) => e.courseId === c.id)}
          userId={user?.id}
        />
      ))}
    </div>
  );
}

function CourseCard({
  course,
  enrollment,
  userId,
}: {
  course: Course;
  enrollment?: Enrollment;
  userId?: string;
}) {
  const enrolled = !!enrollment;
  const completed = enrollment?.status === "completed";

  // Build the Whop checkout URL with metadata attached.
  // The webhook handler reads metadata[user_id] + metadata[amount_usd_cents].
  const whopCheckoutUrl =
    course.whopUrl && userId
      ? buildWhopUrl(course.whopUrl, userId, course.dotReward ?? 100)
      : course.whopUrl;

  return (
    <Card className="overflow-hidden">
      {/* Hero image */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/30 via-primary/10 to-card">
        <div className="absolute inset-0 flex items-end p-5">
          <Badge variant="secondary" className="bg-background/80">
            {course.category ?? "Course"}
          </Badge>
        </div>
        {completed && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">
            <Check className="size-3" /> Completed
          </div>
        )}
        {enrolled && !completed && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">
            <Trophy className="size-3" /> Enrolled
          </div>
        )}
      </div>

      <CardContent className="space-y-3 p-5">
        <h3 className="font-display text-lg font-light leading-tight">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>

        {course.dotReward > 0 && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <Sparkles className="size-3.5" />
            Complete to earn {course.dotReward} DOT
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Powered by Whop
          </span>
          <CourseEnrollButton
            course={course}
            enrolled={enrolled}
            completed={completed}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CourseEnrollButton({
  course,
  enrolled,
  completed,
}: {
  course: Course;
  enrolled: boolean;
  completed: boolean;
}) {
  const qc = useQueryClient();
  const mut = useMutation({ mutationFn: () => enrollInCourse(course.id) });

  const [enrolledJustNow, setEnrolledJustNow] = useState(false);

  if (completed) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link to="/certificates">View certificate</Link>
      </Button>
    );
  }

  // If course has a Whop URL → send user to Whop checkout (with metadata).
  if (course.whopUrl && !enrolled && !enrolledJustNow) {
    return (
      <Button
        variant="default"
        size="sm"
        asChild
      >
        <a href={whopCheckoutUrl} target="_blank" rel="noopener noreferrer">
          Enroll on Whop <ExternalLink className="ml-1 size-3.5" />
        </a>
      </Button>
    );
  }

  // If user is enrolled (via webhook), show Continue / Complete.
  if (enrolled) {
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <a
          href={whopCheckoutUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Continue learning <ChevronRight className="ml-1 size-3.5" />
        </a>
      </Button>
    );
  }

  // No Whop URL → mock enroll inline (admin preview / free tier).
  return (
    <Button
      size="sm"
      variant="default"
      disabled={mut.isPending}
      onClick={async () => {
        await mut.mutateAsync();
        setEnrolledJustNow(true);
        qc.invalidateQueries({ queryKey: ["academy-enrollments"] });
      }}
    >
      {enrolledJustNow ? "Enrolled ✓" : "Enroll"}
    </Button>
  );
}
