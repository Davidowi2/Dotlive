/**
 * Community Challenges routes.
 */
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  communities,
  communityMembers,
  communityChallenges,
  communityChallengeSubmissions,
} from "../db/schema.js";
import { debitWallet, creditWallet } from "../lib/dot.js";
import { notify } from "../lib/notify.js";

// Helper: get single row or null.
async function one<T>(p: Promise<T[]>): Promise<T | null> {
  const r = await p;
  return r[0] ?? null;
}

export async function challengeRoutes(app: FastifyInstance) {
  const getUserId = (req: any): string =>
    (req.user as { sub?: string } | undefined)?.sub ?? "";

  async function isCommunityLeader(communityId: string, userId: string) {
    const c = await one(db
      .select({ leaderId: communities.leaderId })
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1));
    return !!c && c.leaderId === userId;
  }

  async function isCommunityMember(communityId: string, userId: string) {
    const m = await one(db
      .select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.founderId, userId),
        eq(communityMembers.status, "active"),
      ))
      .limit(1));
    return !!m;
  }

  async function getChallenge(id: string) {
    return one(db
      .select()
      .from(communityChallenges)
      .where(eq(communityChallenges.id, id))
      .limit(1));
  }

  /* -------------------- LIST -------------------- */
  app.get("/challenges", async (req, reply) => {
    const q = req.query as { communityId?: string; status?: string };
    if (!q.communityId) return reply.code(400).send({ error: "communityId required" });
    const filters: any[] = [eq(communityChallenges.communityId, q.communityId)];
    if (q.status) filters.push(eq(communityChallenges.status, q.status));
    const rows = await db
      .select()
      .from(communityChallenges)
      .where(and(...filters))
      .orderBy(desc(communityChallenges.createdAt));
    return reply.send({ challenges: rows });
  });

  /* -------------------- DETAIL -------------------- */
  app.get<{ Params: { id: string } }>("/challenges/:id", async (req, reply) => {
    const c = await getChallenge(req.params.id);
    if (!c) return reply.code(404).send({ error: "Not found" });
    const submissions = await db
      .select()
      .from(communityChallengeSubmissions)
      .where(eq(communityChallengeSubmissions.challengeId, req.params.id))
      .orderBy(asc(communityChallengeSubmissions.submittedAt));
    return reply.send({ challenge: c, submissions });
  });

  /* -------------------- CREATE (escrow prize) -------------------- */
  const createSchema = z.object({
    communityId: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(4000),
    prizeDot: z.number().positive(),
    maxWinners: z.number().int().min(1).max(100).default(1),
    deadline: z.string().datetime(),
  });

  app.post("/challenges", { preHandler: app.authenticate }, async (req, reply) => {
    const userId = getUserId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const isLeader = await isCommunityLeader(parsed.data.communityId, userId);
    if (!isLeader) return reply.code(403).send({ error: "Only the community leader can post challenges" });

    const prizeTotal = parsed.data.prizeDot * parsed.data.maxWinners;
    try {
      await debitWallet({
        userId,
        amount: prizeTotal,
        type: "Challenge Escrow",
        description: `Escrow for challenge '${parsed.data.title}' (${parsed.data.maxWinners} winners × ${parsed.data.prizeDot})`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Escrow failed";
      if (msg === "Insufficient balance") return reply.code(402).send({ error: msg });
      return reply.code(500).send({ error: msg });
    }

    const inserted = await db
      .insert(communityChallenges)
      .values({
        communityId: parsed.data.communityId,
        postedByUserId: userId,
        title: parsed.data.title,
        description: parsed.data.description,
        prizeDot: String(parsed.data.prizeDot),
        prizeTotalDot: String(prizeTotal),
        deadline: new Date(parsed.data.deadline),
        maxWinners: parsed.data.maxWinners,
        status: "open",
        escrowReference: `escrow-${Date.now()}`,
      } as any)
      .returning();

    // Notify members.
    try {
      const members = await db
        .select({ founderId: communityMembers.founderId })
        .from(communityMembers)
        .where(and(
          eq(communityMembers.communityId, parsed.data.communityId),
          eq(communityMembers.status, "active"),
        ));
      for (const m of members) {
        if (m.founderId === userId) continue;
        await notify({
          userId: m.founderId,
          type: "system",
          title: `New challenge: ${parsed.data.title}`,
          body: `${parsed.data.prizeDot} DOT prize pool · ${parsed.data.maxWinners} winner(s). Submit your entry before ${new Date(parsed.data.deadline).toLocaleDateString()}.`,
          link: "/communities",
          icon: "Trophy",
        });
      }
    } catch { /* best-effort */ }

    return reply.send({ challenge: inserted[0] });
  });

  /* -------------------- SUBMIT ENTRY -------------------- */
  const submitSchema = z.object({
    body: z.string().min(1).max(4000),
    attachmentUrl: z.string().url().optional(),
  });

  app.post<{ Params: { id: string } }>(
    "/challenges/:id/submit",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = getUserId(req);
      const c = await getChallenge(req.params.id);
      if (!c) return reply.code(404).send({ error: "Challenge not found" });
      if (c.status !== "open") return reply.code(400).send({ error: "Challenge closed" });
      if (new Date(c.deadline) < new Date()) {
        return reply.code(400).send({ error: "Deadline passed" });
      }

      const member = await isCommunityMember(c.communityId, userId);
      if (!member) return reply.code(403).send({ error: "Not a community member" });

      const parsed = submitSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      try {
        const inserted = await db
          .insert(communityChallengeSubmissions)
          .values({
            challengeId: req.params.id,
            userId,
            body: parsed.data.body,
            attachmentUrl: parsed.data.attachmentUrl ?? null,
            status: "submitted",
          } as any)
          .returning();
        return reply.send({ submission: inserted[0] });
      } catch {
        return reply.code(409).send({ error: "Already submitted" });
      }
    },
  );

  /* -------------------- AWARD WINNERS -------------------- */
  const awardSchema = z.object({
    winnerUserIds: z.array(z.string()).min(1).max(100),
  });

  app.post<{ Params: { id: string } }>(
    "/challenges/:id/award",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = getUserId(req);
      const parsed = awardSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

      const c = await getChallenge(req.params.id);
      if (!c) return reply.code(404).send({ error: "Not found" });

      const isLeader = await isCommunityLeader(c.communityId, userId);
      if (!isLeader) return reply.code(403).send({ error: "Only the leader can award" });

      if (parsed.data.winnerUserIds.length > c.maxWinners) {
        return reply.code(400).send({ error: `Only ${c.maxWinners} winner(s) allowed` });
      }

      const prizePerWinner = Number(c.prizeDot);
      const winningRank: Record<string, number> = {};
      parsed.data.winnerUserIds.forEach((u, i) => (winningRank[u] = i + 1));

      for (const winnerId of parsed.data.winnerUserIds) {
        try {
          await creditWallet({
            userId: winnerId,
            amount: prizePerWinner,
            type: "Challenge Prize",
            description: `Won challenge '${c.title}' (rank ${winningRank[winnerId]})`,
            reference: `challenge:${c.id}:${winnerId}`,
          });
        } catch (e) {
          app.log?.error?.({ err: e, winnerId }, "failed to credit challenge winner");
        }
        await db
          .update(communityChallengeSubmissions)
          .set({
            status: "winner",
            winningRank: winningRank[winnerId],
            payoutDot: String(prizePerWinner),
            decidedAt: new Date(),
          } as any)
          .where(and(
            eq(communityChallengeSubmissions.challengeId, c.id),
            eq(communityChallengeSubmissions.userId, winnerId),
          ));

        await notify({
          userId: winnerId,
          type: "community_challenge_won",
          title: `You won ${prizePerWinner} DOT!`,
          body: `Congrats on '${c.title}' (rank ${winningRank[winnerId]}). Funds are in your wallet.`,
          link: "/communities",
          icon: "Trophy",
          sendEmail: true,
        });

        // Mint a "challenge won" certificate.
        try {
          const { mintCertificate } = await import("../lib/cert.js");
          await mintCertificate(app, {
            userId: winnerId,
            source: "challenge",
            sourceId: c.id,
            title: `Challenge: ${c.title}`,
            issuer: c.communityId
              ? "DOT Community Challenge"
              : "DOT Challenge",
            level: winningRank[winnerId] === 1 ? "Gold" : "Silver",
            score: winningRank[winnerId] === 1 ? 100 : 80,
            dotReward: 0, // prize already paid out via creditWallet above
            meta: { rank: winningRank[winnerId], challengeId: c.id },
          });
        } catch (e) {
          app.log?.error?.({ err: e }, "challenge cert mint failed");
        }
      }

      // Mark non-winners refused.
      const allSubs = await db
        .select({ id: communityChallengeSubmissions.id, userId: communityChallengeSubmissions.userId })
        .from(communityChallengeSubmissions)
        .where(eq(communityChallengeSubmissions.challengeId, c.id));
      for (const s of allSubs) {
        if (!parsed.data.winnerUserIds.includes(s.userId)) {
          await db
            .update(communityChallengeSubmissions)
            .set({ status: "refused", decidedAt: new Date() } as any)
            .where(eq(communityChallengeSubmissions.id, s.id));
        }
      }

      await db
        .update(communityChallenges)
        .set({ status: "awarded", updatedAt: new Date() } as any)
        .where(eq(communityChallenges.id, c.id));

      return reply.send({ ok: true, awarded: parsed.data.winnerUserIds.length });
    },
  );

  /* -------------------- CANCEL (refund) -------------------- */
  app.post<{ Params: { id: string } }>(
    "/challenges/:id/cancel",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const userId = getUserId(req);
      const c = await getChallenge(req.params.id);
      if (!c) return reply.code(404).send({ error: "Not found" });

      const isLeader = await isCommunityLeader(c.communityId, userId);
      if (!isLeader) return reply.code(403).send({ error: "Only the leader can cancel" });

      if (c.status === "awarded") {
        return reply.code(400).send({ error: "Cannot cancel after awarding" });
      }
      const remainingPrize = Number(c.prizeTotalDot);
      if (remainingPrize > 0) {
        try {
          await creditWallet({
            userId,
            amount: remainingPrize,
            type: "Challenge Refund",
            description: `Refund of escrow for cancelled challenge '${c.title}'`,
            reference: `challenge-refund:${c.id}`,
          });
        } catch (e) {
          app.log?.error?.({ err: e }, "challenge refund failed");
        }
      }
      await db
        .update(communityChallenges)
        .set({ status: "cancelled", updatedAt: new Date() } as any)
        .where(eq(communityChallenges.id, c.id));
      return reply.send({ ok: true });
    },
  );
}