// @ts-nocheck
/**
 * Academy routes: courses, enrollments, completion + DOT reward.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

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
        .values({ courseId: parsed.data.courseId, userId: sub, status: "enrolled" })
        .returning();
      return reply.send({ enrollment: inserted[0] });
    } catch {
      return reply.code(409).send({ error: "Already enrolled" });
    }
  });

  /**
   * POST /api/academy/complete
   *
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
      .set({ status: "completed", completedAt: new Date(), rewardedAt: new Date() })
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
}
// @ts-nocheck