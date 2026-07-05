/**
 * Stakes routes: list, create stake, unstake, claim rewards.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

import { db } from "../db/client.js";
import { stakes } from "../db/schema.js";
import { createStake, unstake, claimRewards, listStakes } from "../lib/staking.js";

export async function stakesRoutes(app: FastifyInstance) {
  app.get("/stakes", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const rows = await listStakes(sub);
    return reply.send({ stakes: rows });
  });

  app.post("/stakes", {
    preHandler: app.authenticate,
    config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const schema = z.object({
      targetType: z.enum(["venture", "gig"]),
      targetId: z.string().min(1),
      amount: z.number().positive().max(1_000_000),
      metadata: z.record(z.string(), z.any()).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    try {
      const result = await createStake({
        userId: sub,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        amount: parsed.data.amount,
        metadata: parsed.data.metadata,
      });
      return reply.send(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stake failed";
      if (msg === "Insufficient balance") return reply.code(402).send({ error: msg });
      return reply.code(400).send({ error: msg });
    }
  });

  app.post("/stakes/:id/unstake", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    try {
      const result = await unstake({ userId: sub, stakeId: id });
      return reply.send(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unstake failed";
      return reply.code(400).send({ error: msg });
    }
  });

  app.post("/stakes/:id/claim", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const { id } = req.params as { id: string };
    try {
      const result = await claimRewards({ userId: sub, stakeId: id });
      return reply.send(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Claim failed";
      return reply.code(400).send({ error: msg });
    }
  });
}
