/**
 * Academy routes: courses, enrollments, completion + DOT reward.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { courses, courseEnrollments } from "../db/schema.js";
import { creditWallet } from "../lib/dot.js";

export async function academyRoutes(app: FastifyInstance) {
  /** GET /api/academy/courses */
  app.get("/academy/courses", async (_req, reply) => {
    const rows = await db
      .select()
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(desc(courses.createdAt));
    return reply.send({
      courses: rows.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        whopUrl: c.whopUrl,
        dotReward: c.dotReward,
        vantageBoost: c.vantageBoost,
      })),
    });
  });

  /** POST /api/academy/enroll */
  app.post("/academy/enroll", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = z.object({ courseId: z.string().uuid() }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const course = await db.select().from(courses).where(eq(courses.id, parsed.data.courseId)).limit(1);
    if (course.length === 0) return reply.code(404).send({ error: "Course not found" });

    try {
      const inserted = await db
        .insert(courseEnrollments)
        .values({ courseId: parsed.data.courseId, userId: sub, status: "enrolled" } as any)
        .returning();
      return reply.send({ enrollment: inserted[0] });
    } catch {
      return reply.code(409).send({ error: "Already enrolled" });
    }
  });

  /**
   * POST /api/academy/complete
   * Idempotent: completing an already-rewarded enrollment is a
   * no-op. Reward = course.dotReward DOT credited to the wallet.
   */
  app.post("/academy/complete", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const parsed = z.object({ courseId: z.string().uuid() }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const enroll = await db
      .select()
      .from(courseEnrollments)
      .where(and(eq(courseEnrollments.courseId, parsed.data.courseId), eq(courseEnrollments.userId, sub)))
      .limit(1);
    if (enroll.length === 0) return reply.code(404).send({ error: "Not enrolled" });
    if (enroll[0].rewardedAt) return reply.send({ enrollment: enroll[0], alreadyRewarded: true });

    const course = await db.select().from(courses).where(eq(courses.id, parsed.data.courseId)).limit(1);
    const reward = course[0]?.dotReward ?? 0;

    await db
      .update(courseEnrollments)
      .set({ status: "completed", completedAt: new Date(), rewardedAt: new Date() } as any)
      .where(eq(courseEnrollments.id, enroll[0].id));

    if (reward > 0) {
      await creditWallet({
        userId: sub,
        amount: reward,
        type: "Course Reward",
        description: `Reward for course ${parsed.data.courseId}`,
      });
    }

    const updated = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, enroll[0].id)).limit(1);
    return reply.send({ enrollment: updated[0], reward });
  });

  /** GET /api/academy/enrollments — current user's enrollments with course info */
  app.get("/academy/enrollments", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db.execute(sql`
      SELECT
        e.id, e.user_id AS "userId", e.course_id AS "courseId",
        e.status, e.created_at AS "createdAt",
        c.title AS "courseTitle", c.description AS "courseDescription"
      FROM course_enrollments e
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ${sub}
      ORDER BY e.created_at DESC
    `);
    const enrollments = ((rows as any).rows ?? []).map((r: any) => ({
      id: r.id,
      userId: r.userId,
      courseId: r.courseId,
      progressPct: 0,
      completedAt: null,
      createdAt: r.createdAt,
      status: r.status,
      course: r.courseTitle
        ? {
            id: r.courseId,
            title: r.courseTitle,
            description: r.courseDescription ?? undefined,
            moduleCount: 0,
          }
        : undefined,
    }));
    return reply.send({ enrollments });
  });

  /* ------------------------------------------------------------------ *
   *  ADMIN: Course management (list all, create, update, delete)
   * ------------------------------------------------------------------ */
  /** GET /api/admin/courses — list all courses including unpublished. */
  app.get(
    "/admin/courses",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok =
        (await userHasRole(sub, "admin")) ||
        (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });
      const rows = await db.select().from(courses).orderBy(desc(courses.createdAt));
      return reply.send({ courses: rows });
    }
  );

  /** POST /api/admin/courses — create a new course. */
  app.post(
    "/admin/courses",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok =
        (await userHasRole(sub, "admin")) ||
        (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });

      const parsed = z
        .object({
          title: z.string().min(1).max(200),
          description: z.string().max(2000).optional().nullable(),
          category: z.string().max(100).optional().nullable(),
          whopUrl: z.string().url().optional().nullable().or(z.literal("")),
          whopProductId: z.string().max(200).optional().nullable().or(z.literal("")),
          dotReward: z.number().int().nonnegative().max(1_000_000).optional(),
          vantageBoost: z.number().int().min(0).max(500).optional(),
          isPublished: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
      }

      const inserted = await db
        .insert(courses)
        .values({
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          category: parsed.data.category ?? null,
          whopUrl: parsed.data.whopUrl || null,
          whopProductId: parsed.data.whopProductId || null,
          dotReward: parsed.data.dotReward ?? 0,
          vantageBoost: parsed.data.vantageBoost ?? 0,
          isPublished: parsed.data.isPublished ?? false,
        } as any)
        .returning();
      return reply.send({ course: inserted[0] });
    }
  );

  /** PATCH /api/admin/courses/:id — partial update. */
  app.patch<{ Params: { id: string } }>(
    "/admin/courses/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok =
        (await userHasRole(sub, "admin")) ||
        (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });

      const parsed = z
        .object({
          title: z.string().min(1).max(200).optional(),
          description: z.string().max(2000).nullable().optional(),
          category: z.string().max(100).nullable().optional(),
          whopUrl: z.string().url().nullable().or(z.literal("")).optional(),
          whopProductId: z.string().max(200).nullable().or(z.literal("")).optional(),
          dotReward: z.number().int().nonnegative().max(1_000_000).optional(),
          vantageBoost: z.number().int().min(0).max(500).optional(),
          isPublished: z.boolean().optional(),
        })
        .safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input", details: parsed.error.issues });
      }

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      const PATCHABLE = [
        "title", "description", "category", "whopUrl", "whopProductId",
        "dotReward", "vantageBoost", "isPublished",
      ] as const;
      for (const k of PATCHABLE) {
        if ((parsed.data as any)[k] !== undefined) (updates as any)[k] = (parsed.data as any)[k];
      }
      const updated = await db
        .update(courses)
        .set(updates as any)
        .where(eq(courses.id, req.params.id))
        .returning();
      if (updated.length === 0) return reply.code(404).send({ error: "Course not found" });
      return reply.send({ course: updated[0] });
    }
  );

  /** DELETE /api/admin/courses/:id — permanent delete (cascades to enrollments). */
  app.delete<{ Params: { id: string } }>(
    "/admin/courses/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const { userHasRole } = await import("../lib/auth.js");
      const ok =
        (await userHasRole(sub, "admin")) ||
        (await userHasRole(sub, "super_admin"));
      if (!ok) return reply.code(403).send({ error: "Operator only" });

      const deleted = await db
        .delete(courses)
        .where(eq(courses.id, req.params.id))
        .returning();
      if (deleted.length === 0) return reply.code(404).send({ error: "Course not found" });
      return reply.send({ ok: true, deleted: deleted[0] });
    }
  );
}
// @ts-nocheck