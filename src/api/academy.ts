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

export async function completeCourse(
  courseId: string
): Promise<{ enrollment: CourseEnrollment; dotEarned: number }> {
  return dotApi.post("/api/academy/complete", { courseId });
}
