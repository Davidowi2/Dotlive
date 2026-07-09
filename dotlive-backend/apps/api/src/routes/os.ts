/**
 * DOT OS — Builder, challenge, reputation, achievement, activity endpoints.
 *
 *   GET   /api/builder/level              — current level + reputation + next gate
 *   GET   /api/builder/arena              — open challenges + my submissions
 *   POST  /api/challenges                 — founders/admins post a challenge
 *   GET   /api/challenges                 — list open challenges (filter by skill)
 *   GET   /api/challenges/mine            — challenges I posted
 *   POST  /api/challenges/:id/submit      — builder submits work
 *   POST  /api/challenges/:id/review      — founder/admin approves/rejects
 *   GET   /api/reputation/me              — my reputation events
 *   GET   /api/achievements/me            — my achievements
 *   GET   /api/activity/me                — my activity timeline
 *   GET   /api/ai/advisor                 — next-best-action recommendations
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "../db/client.js";
import {
  challenges,
  challengeSubmissions,
  builderLevels,
  achievements,
  activities,
  reputationEvents,
} from "../db/schema.js";
import {
  getBuilderLevel,
  evaluateLevelGates,
  computeReputation,
  awardReputation,
  grantAchievement,
  logActivity,
  aiAdvise,
} from "../lib/os-engine.js";
import { debitWallet, creditWallet } from "../lib/dot.js";
import { userHasRole } from "../lib/auth.js";

const CHALLENGE_SKILLS = [
  "AI",
  "Design",
  "Coding",
  "Marketing",
  "Sales",
  "Finance",
  "Engineering",
  "Operations",
  "Product",
  "Research",
] as const;

const newId = () => crypto.randomUUID();

export async function osRoutes(app: FastifyInstance) {
  /* ------------------- BUILDER LEVEL ------------------- */

  app.get("/builder/level", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const lvl = await getBuilderLevel(sub);
    const gates = await evaluateLevelGates(sub, Math.min(lvl.level + 1, 5));
    return reply.send({ ...lvl, nextLevel: { level: Math.min(lvl.level + 1, 5), gates } });
  });

  app.get("/builder/arena", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const open = await db
      .select()
      .from(challenges)
      .where(eq(challenges.status, "open"))
      .orderBy(desc(challenges.createdAt))
      .limit(30);

    const mySubs = await db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.builderId, sub))
      .orderBy(desc(challengeSubmissions.submittedAt))
      .limit(30);

    const lvl = await getBuilderLevel(sub);
    return reply.send({
      challenges: open,
      mySubmissions: mySubs,
      level: lvl,
    });
  });

  /* ------------------- CHALLENGES ------------------- */

  const challengeCreate = z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(5000),
    skill: z.enum(CHALLENGE_SKILLS),
    rewardDot: z.number().positive().max(1_000_000),
    deadline: z.string().datetime().optional(),
    maxSubmissions: z.number().int().positive().max(100).default(1),
    ventureId: z.string().optional(),
  });

  app.post("/builder/challenges", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    // Allowed posters: founders, admins, capital_partners, community_leaders, vendors
    const allowed = await Promise.all([
      userHasRole(sub, "founder"),
      userHasRole(sub, "admin"),
      userHasRole(sub, "super_admin"),
      userHasRole(sub, "capital_partner"),
      userHasRole(sub, "community_leader"),
      userHasRole(sub, "vendor"),
    ]);
    if (!allowed.some(Boolean)) {
      return reply.code(403).send({ error: "Only founders, admins, capital partners, community leaders, or vendors can post challenges" });
    }
    const parsed = challengeCreate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });

    // Determine posterType from roles (admin > others)
    let posterType = "founder";
    if (allowed[1] || allowed[2]) posterType = "admin";
    else if (allowed[3]) posterType = "capital_partner";
    else if (allowed[4]) posterType = "community";
    else if (allowed[5]) posterType = "company";
    // (university reserved for future)

    // Debit the poster's wallet as escrow for the reward (refund on close).
    try {
      await debitWallet({
        userId: sub,
        amount: parsed.data.rewardDot,
        description: `Escrow for challenge: ${parsed.data.title}`,
        type: "debit",
      });
    } catch (e: any) {
      return reply.code(402).send({ error: e?.message ?? "Insufficient DOT" });
    }

    const id = newId();
    const inserted = await db
      .insert(challenges)
      .values({
        id,
        postedBy: sub,
        posterType,
        title: parsed.data.title,
        description: parsed.data.description,
        skill: parsed.data.skill,
        rewardDot: String(parsed.data.rewardDot),
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        maxSubmissions: parsed.data.maxSubmissions,
        status: "open",
        ventureId: parsed.data.ventureId ?? null,
      } as any)
      .returning();

    await logActivity({
      userId: sub,
      kind: "challenge_posted",
      title: `Posted challenge: ${parsed.data.title}`,
      body: `${parsed.data.rewardDot} DOT reward`,
      refType: "challenge",
      refId: id,
    });

    return reply.send({ challenge: inserted[0] });
  });

  app.get("/builder/challenges", async (req, reply) => {
    const q = req.query as { skill?: string; posterType?: string };
    const filters: any[] = [eq(challenges.status, "open")];
    if (q.skill) filters.push(eq(challenges.skill, q.skill));
    if (q.posterType) filters.push(eq(challenges.posterType, q.posterType));
    const where = filters.length > 1 ? and(...filters) : filters[0];
    const rows = await db
      .select()
      .from(challenges)
      .where(where)
      .orderBy(desc(challenges.createdAt))
      .limit(50);
    return reply.send({ challenges: rows });
  });

  app.get("/builder/challenges/mine", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const posted = await db
      .select()
      .from(challenges)
      .where(eq(challenges.postedBy, sub))
      .orderBy(desc(challenges.createdAt))
      .limit(50);
    const subs = await db
      .select()
      .from(challengeSubmissions)
      .where(eq(challengeSubmissions.builderId, sub))
      .orderBy(desc(challengeSubmissions.submittedAt))
      .limit(50);
    return reply.send({ posted, submissions: subs });
  });

  app.get("/builder/challenges/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    if (row.length === 0) return reply.code(404).send({ error: "Not found" });
    return reply.send({ challenge: row[0] });
  });

  const submissionCreate = z.object({
    content: z.string().min(10).max(5000),
    link: z.string().url().optional(),
  });

  app.post<{ Params: { id: string } }>(
    "/builder/challenges/:id/submit",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const parsed = submissionCreate.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      const c = await db.select().from(challenges).where(eq(challenges.id, req.params.id)).limit(1);
      if (c.length === 0) return reply.code(404).send({ error: "Challenge not found" });
      if (c[0].status !== "open") return reply.code(409).send({ error: "Challenge closed" });

      // Limit duplicates by challenge builderId
      const existing = await db
        .select()
        .from(challengeSubmissions)
        .where(and(eq(challengeSubmissions.challengeId, req.params.id), eq(challengeSubmissions.builderId, sub)))
        .limit(1);
      if (existing.length > 0) return reply.code(409).send({ error: "Already submitted" });

      const id = newId();
      const inserted = await db
        .insert(challengeSubmissions)
        .values({
          id,
          challengeId: req.params.id,
          builderId: sub,
          content: parsed.data.content,
          link: parsed.data.link ?? null,
          status: "pending",
          submittedAt: new Date(),
        } as any)
        .returning();

      await logActivity({
        userId: sub,
        kind: "challenge_submitted",
        title: `Submitted work for: ${c[0].title}`,
        refType: "challenge",
        refId: req.params.id,
      });

      return reply.send({ submission: inserted[0] });
    },
  );

  const reviewBody = z.object({
    status: z.enum(["approved", "rejected"]),
    note: z.string().max(2000).optional(),
  });

  app.post<{ Params: { id: string } }>(
    "/builder/challenges/:id/review",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const isFounder = await userHasRole(sub, "founder");
      const isAdmin = await userHasRole(sub, "admin");
      if (!isFounder && !isAdmin) return reply.code(403).send({ error: "Only founders/admins" });
      const parsed = reviewBody.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      const c = await db.select().from(challenges).where(eq(challenges.id, req.params.id)).limit(1);
      if (c.length === 0) return reply.code(404).send({ error: "Challenge not found" });
      if (c[0].postedBy !== sub && !isAdmin) return reply.code(403).send({ error: "Not your challenge" });

      const subs = await db
        .select()
        .from(challengeSubmissions)
        .where(and(eq(challengeSubmissions.challengeId, req.params.id), eq(challengeSubmissions.status, "pending")))
        .orderBy(desc(challengeSubmissions.submittedAt));
      if (subs.length === 0) return reply.code(409).send({ error: "No pending submissions" });

      // Approve ALL pending submissions of the challenge (or one if maxSubmissions=1 and reviewer specifies)
      const targetId = (req.query as any).submissionId as string | undefined;
      const toProcess = targetId ? subs.filter((s) => s.id === targetId) : subs.slice(0, c[0].maxSubmissions ?? 1);

      const approved: any[] = [];
      for (const s of toProcess) {
        await db
          .update(challengeSubmissions)
          .set({ status: parsed.data.status, reviewedAt: new Date(), reviewNote: parsed.data.note ?? null } as any)
          .where(eq(challengeSubmissions.id, s.id));

        if (parsed.data.status === "approved") {
          // Release escrow to builder
          try {
            await creditWallet({
              userId: s.builderId,
              amount: Number(c[0].rewardDot),
              description: `Challenge reward: ${c[0].title}`,
              type: "credit",
            });
          } catch (e: any) {
            return reply.code(402).send({ error: e?.message ?? "Reward transfer failed" });
          }
          await awardReputation({
            userId: s.builderId,
            delta: 25,
            reason: `Won challenge: ${c[0].title}`,
            refType: "challenge",
            refId: c[0].id,
          });
          await grantAchievement(s.builderId, "challenge_won", "Challenge Won", `Completed: ${c[0].title}`, "Trophy");
          approved.push(s.id);
        }
      }

      // If all approved up to maxSubmissions, close challenge
      const remainingPending = await db
        .select()
        .from(challengeSubmissions)
        .where(and(eq(challengeSubmissions.challengeId, req.params.id), eq(challengeSubmissions.status, "pending")));
      const remainingSlots = Math.max(0, (c[0].maxSubmissions ?? 1) - approved.length);
      if (remainingPending.length === 0 || remainingSlots === 0) {
        await db
          .update(challenges)
          .set({ status: "completed" } as any)
          .where(eq(challenges.id, req.params.id));
        // Refund any leftover escrow if not all slots filled (partial fill)
        const refunded = (c[0].maxSubmissions ?? 1) - approved.length;
        if (refunded > 0) {
          try {
            await creditWallet({
              userId: c[0].postedBy,
              amount: Number(c[0].rewardDot) * refunded,
              description: `Refund for unfilled challenge: ${c[0].title}`,
              type: "credit",
            });
          } catch {}
        }
      }

      return reply.send({ approved });
    },
  );

  /* ------------------- REPUTATION / ACHIEVEMENTS / ACTIVITY ------------------- */

  app.get("/reputation/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const score = await computeReputation(sub);
    const events = await db
      .select()
      .from(reputationEvents)
      .where(eq(reputationEvents.userId, sub))
      .orderBy(desc(reputationEvents.createdAt))
      .limit(50);
    return reply.send({ score, events });
  });

  app.get("/achievements/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, sub))
      .orderBy(desc(achievements.earnedAt));
    return reply.send({ achievements: rows });
  });

  app.get("/activity/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, sub))
      .orderBy(desc(activities.createdAt))
      .limit(50);
    return reply.send({ activities: rows });
  });

  /* ------------------- AI ADVISOR ------------------- */

  app.get("/ai/advisor", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const recs = await aiAdvise(sub);
    return reply.send({ recommendations: recs });
  });
}