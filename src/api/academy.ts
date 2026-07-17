import { dotApi } from "@/api/client";
/**
 * Academy API — wraps the Fastify /api/academy/* endpoints.
 */
import type { Course, CourseEnrollment } from "@/types/api";

export async function listCourses(): Promise<Course[]> {
  const res = await dotApi.get<{ courses: Course[] }>("/api/academy/courses");
  return res.courses ?? [];
}

export async function getMyEnrollments(): Promise<CourseEnrollment[]> {
  const res = await dotApi.get<{ enrollments: CourseEnrollment[] }>("/api/academy/enrollments");
  return res.enrollments ?? [];
}

export async function enrollInCourse(courseId: string): Promise<CourseEnrollment> {
  const res = await dotApi.post<{ enrollment: CourseEnrollment }>(
    "/api/academy/enroll",
    { courseId }
  );
  return res.enrollment;
}

export async function getCourse(courseId: string): Promise<Course> {
  const res = await dotApi.get<{ course: Course }>(`/api/academy/courses/${courseId}`);
  return res.course;
}

export async function createCheckout(input: {
  productId?: string;
  amountCents: number;
  metadata?: Record<string, any>;
}): Promise<{ url: string }> {
  const res = await dotApi.post<{ url: string }>("/api/checkout", {
    productId: input.productId,
    amountCents: input.amountCents,
    metadata: input.metadata,
  });
  return res;
}

export async function completeCourse(
  courseId: string
): Promise<{ enrollment: CourseEnrollment; dotEarned: number }> {
  return dotApi.post("/api/academy/complete", { courseId });
}
