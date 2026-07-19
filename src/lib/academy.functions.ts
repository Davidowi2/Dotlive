import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CourseEnrollment } from "@/types/api";

const completeInput = z.object({ courseId: z.string().uuid() });

/**
 * Server-verified course completion + reward.
 *
 * Calls POST /api/academy/complete with our custom JWT auth.
 */
export const completeCourse = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => completeInput.parse(data))
  .handler(async ({ data }) => {
    const token = (await import("@/api/client")).getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `${(await import("@/api/client")).BASE_URL}/api/academy/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ courseId: data.courseId }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `Failed with ${res.status}` }));
      throw new Error((body as { error?: string }).error ?? "Complete failed");
    }

    return (await res.json()) as { enrollment: CourseEnrollment; reward: number; alreadyRewarded?: boolean };
  });
