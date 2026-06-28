/**
 * Wizard state routes — onboarding progress for first-time users.
 *
 *   GET   /api/wizard              get current state (creates row if missing)
 *   POST  /api/wizard/complete     mark the wizard done (timestamp)
 *   POST  /api/wizard/skip         mark skipped with timestamp
 *   POST  /api/wizard/reset        re-open the wizard (clears completedAt)
 *   POST  /api/wizard/step         save current step (so user can resume)
 */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { wizardState } from "../db/schema.js";

export async function wizardRoutes(app: FastifyInstance) {
  const getUserId = (req: FastifyRequest): string => {
    return (req.user as { sub?: string } | undefined)?.sub ?? "";
  };

  /* ============================== GET STATE ============================== */
  app.get(
    "/wizard",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const [row] = await db
        .select()
        .from(wizardState)
        .where(eq(wizardState.userId, userId))
        .limit(1);

      if (!row) {
        // First time — create a row
        const [created] = await db
          .insert(wizardState)
          .values({ userId, lastStep: 0, skippedSteps: [] } as any)
          .returning();
        return reply.send({
          completed: false,
          lastStep: 0,
          skippedSteps: [],
          startedAt: created?.startedAt,
        });
      }

      return reply.send({
        completed: row.completedAt !== null,
        lastStep: row.lastStep,
        skippedSteps: Array.isArray(row.skippedSteps) ? row.skippedSteps : [],
        completedAt: row.completedAt,
        startedAt: row.startedAt,
      });
    },
  );

  /* ============================== COMPLETE ============================== */
  app.post(
    "/wizard/complete",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });
      const now = new Date();

      // UPSERT
      const existing = await db
        .select()
        .from(wizardState)
        .where(eq(wizardState.userId, userId))
        .limit(1);
      if (existing.length === 0) {
        await db
          .insert(wizardState)
          .values({ userId, completedAt: now, lastStep: 7, skippedSteps: [] } as any);
      } else {
        await db
          .update(wizardState)
          .set({ completedAt: now, lastStep: 7 } as any)
          .where(eq(wizardState.userId, userId));
      }

      return reply.send({ ok: true, completedAt: now });
    },
  );

  /* ============================== SKIP ============================== */
  app.post(
    "/wizard/skip",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });
      const now = new Date();
      const body = (req.body ?? {}) as { step?: number };

      const existing = await db
        .select()
        .from(wizardState)
        .where(eq(wizardState.userId, userId))
        .limit(1);
      const skippedSteps: number[] = Array.isArray(existing[0]?.skippedSteps)
        ? (existing[0]!.skippedSteps as any)
        : [];
      if (typeof body.step === "number" && !skippedSteps.includes(body.step)) {
        skippedSteps.push(body.step);
      }

      if (existing.length === 0) {
        await db
          .insert(wizardState)
          .values({
            userId,
            completedAt: now,
            lastStep: typeof body.step === "number" ? body.step + 1 : 0,
            skippedSteps,
          } as any);
      } else {
        await db
          .update(wizardState)
          .set({
            completedAt: now,
            lastStep: typeof body.step === "number" ? body.step + 1 : existing[0]!.lastStep,
            skippedSteps,
          } as any)
          .where(eq(wizardState.userId, userId));
      }

      return reply.send({ ok: true, completedAt: now });
    },
  );

  /* ============================== RESET (re-take from Help) ============================== */
  app.post(
    "/wizard/reset",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const existing = await db
        .select()
        .from(wizardState)
        .where(eq(wizardState.userId, userId))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(wizardState).values({ userId } as any);
      } else {
        await db
          .update(wizardState)
          .set({ completedAt: null, lastStep: 0, skippedSteps: [] } as any)
          .where(eq(wizardState.userId, userId));
      }

      return reply.send({ ok: true, completed: false, lastStep: 0 });
    },
  );

  /* ============================== SAVE STEP ============================== */
  app.post<{ Body: { step?: number } }>(
    "/wizard/step",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });
      const { step } = req.body ?? {};
      if (typeof step !== "number" || step < 0 || step > 7) {
        return reply.code(400).send({ error: "step must be 0-7" });
      }

      const existing = await db
        .select()
        .from(wizardState)
        .where(eq(wizardState.userId, userId))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(wizardState).values({ userId, lastStep: step } as any);
      } else {
        await db
          .update(wizardState)
          .set({ lastStep: step } as any)
          .where(eq(wizardState.userId, userId));
      }

      return reply.send({ ok: true, lastStep: step });
    },
  );
}
