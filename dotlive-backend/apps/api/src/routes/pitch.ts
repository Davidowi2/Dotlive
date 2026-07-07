/**
 * Pitch Deck routes — Session 12.
 *
 * Manages pitch decks for ventures, version history, and leaderboard scoring.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc, asc } from "drizzle-orm";

import { db } from "../db/client.js";
import { pitchDecks, ventures, pitchathonApplications, pitchathonScores } from "../db/schema.js";

export async function pitchRoutes(app: FastifyInstance) {
  /**
   * GET /api/pitch-decks — List all pitch decks for the authenticated user's ventures.
   */
  app.get(
    "/pitch-decks",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };

      try {
        // Get user's ventures
        const userVentures = await db
          .select({ id: ventures.id })
          .from(ventures)
          .where(eq(ventures.userId, sub));

        const ventureIds = userVentures.map((v) => v.id);
        if (ventureIds.length === 0) {
          return reply.send({ pitchDecks: [] });
        }

        // Get pitch decks for those ventures
        const decks = await db
          .select()
          .from(pitchDecks)
          .where(eq(pitchDecks.ventureId, ventureIds[0]))
          .orderBy(desc(pitchDecks.updatedAt));

        // For multiple ventures, query each (simplified for now)
        const allDecks = [];
        for (const id of ventureIds) {
          const deckRows = await db
            .select()
            .from(pitchDecks)
            .where(eq(pitchDecks.ventureId, id))
            .orderBy(desc(pitchDecks.updatedAt));
          allDecks.push(...deckRows);
        }

        return reply.send({ pitchDecks: allDecks });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to list pitch decks" });
      }
    }
  );

  /**
   * GET /api/pitch-decks/:id — Get a single pitch deck (public or owned).
   */
  app.get<{ Params: { id: string } }>(
    "/pitch-decks/:id",
    async (req, reply) => {
      const { sub } = req.user as { sub: string } | undefined;

      try {
        const deck = await db
          .select()
          .from(pitchDecks)
          .where(eq(pitchDecks.id, req.params.id))
          .limit(1);

        if (deck.length === 0) {
          return reply.code(404).send({ error: "Pitch deck not found" });
        }

        const deckRow = deck[0];

        // Check ownership or public
        const venture = await db
          .select()
          .from(ventures)
          .where(eq(ventures.id, deckRow.ventureId))
          .limit(1);

        if (venture.length === 0) {
          return reply.code(404).send({ error: "Venture not found" });
        }

        const isOwner = sub && venture[0].userId === sub;
        if (!deckRow.isPublic && !isOwner) {
          return reply.code(403).send({ error: "Access denied" });
        }

        return reply.send({ pitchDeck: deckRow });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to get pitch deck" });
      }
    }
  );

  /**
   * POST /api/pitch-decks — Create a new pitch deck.
   * Body: { ventureId, title, description?, url }
   */
  app.post(
    "/pitch-decks",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };

      const parsed = z
        .object({
          ventureId: z.string().uuid(),
          title: z.string().min(1).max(200),
          description: z.string().max(2000).optional(),
          url: z.string().url(),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input" });
      }

      try {
        // Verify ownership of venture
        const venture = await db
          .select()
          .from(ventures)
          .where(eq(ventures.id, parsed.data.ventureId))
          .limit(1);

        if (venture.length === 0) {
          return reply.code(404).send({ error: "Venture not found" });
        }

        if (venture[0].userId !== sub) {
          return reply.code(403).send({ error: "Not your venture" });
        }

        const inserted = await db
          .insert(pitchDecks)
          .values({
            ventureId: parsed.data.ventureId,
            title: parsed.data.title,
            description: parsed.data.description ?? null,
            url: parsed.data.url,
            version: 1,
            isPublic: false,
          } as any)
          .returning();

        return reply.send({ pitchDeck: inserted[0] });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to create pitch deck" });
      }
    }
  );

  /**
   * PUT /api/pitch-decks/:id — Update a pitch deck.
   * Body: { title?, description?, url?, isPublic? }
   */
  app.put<{ Params: { id: string } }>(
    "/pitch-decks/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };

      const parsed = z
        .object({
          title: z.string().min(1).max(200).optional(),
          description: z.string().max(2000).optional(),
          url: z.string().url().optional(),
          isPublic: z.boolean().optional(),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input" });
      }

      try {
        // Verify ownership
        const deck = await db
          .select()
          .from(pitchDecks)
          .where(eq(pitchDecks.id, req.params.id))
          .limit(1);

        if (deck.length === 0) {
          return reply.code(404).send({ error: "Pitch deck not found" });
        }

        const venture = await db
          .select()
          .from(ventures)
          .where(eq(ventures.id, deck[0].ventureId))
          .limit(1);

        if (venture.length === 0 || venture[0].userId !== sub) {
          return reply.code(403).send({ error: "Not your pitch deck" });
        }

        const updateData: any = { updatedAt: new Date() };
        if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
        if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
        if (parsed.data.url !== undefined) {
          updateData.url = parsed.data.url;
          // Increment version on URL change
          updateData.version = (deck[0].version ?? 1) + 1;
        }
        if (parsed.data.isPublic !== undefined) updateData.isPublic = parsed.data.isPublic;

        const updated = await db
          .update(pitchDecks)
          .set(updateData)
          .where(eq(pitchDecks.id, req.params.id))
          .returning();

        return reply.send({ pitchDeck: updated[0] });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to update pitch deck" });
      }
    }
  );

  /**
   * DELETE /api/pitch-decks/:id — Delete a pitch deck.
   */
  app.delete<{ Params: { id: string } }>(
    "/pitch-decks/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };

      try {
        const deck = await db
          .select()
          .from(pitchDecks)
          .where(eq(pitchDecks.id, req.params.id))
          .limit(1);

        if (deck.length === 0) {
          return reply.code(404).send({ error: "Pitch deck not found" });
        }

        const venture = await db
          .select()
          .from(ventures)
          .where(eq(ventures.id, deck[0].ventureId))
          .limit(1);

        if (venture.length === 0 || venture[0].userId !== sub) {
          return reply.code(403).send({ error: "Not your pitch deck" });
        }

        await db.delete(pitchDecks).where(eq(pitchDecks.id, req.params.id));

        return reply.send({ success: true });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to delete pitch deck" });
      }
    }
  );

  /**
   * GET /api/pitch-decks/:id/versions — Get version history of a pitch deck.
   */
  app.get<{ Params: { id: string } }>(
    "/pitch-decks/:id/versions",
    async (req, reply) => {
      try {
        const deck = await db
          .select()
          .from(pitchDecks)
          .where(eq(pitchDecks.id, req.params.id))
          .limit(1);

        if (deck.length === 0) {
          return reply.code(404).send({ error: "Pitch deck not found" });
        }

        const deckRow = deck[0];

        // For now, return current version as history
        // In production, you could track versions separately
        return reply.send({
          versions: [
            {
              version: deckRow.version,
              url: deckRow.url,
              title: deckRow.title,
              updatedAt: deckRow.updatedAt,
            },
          ],
        });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to get versions" });
      }
    }
  );

  /**
   * GET /api/pitchathons/:id/leaderboard — Enhanced pitchathon leaderboard with scores.
   * (Enhanced version from pitchathons.ts)
   */
  app.get<{ Params: { id: string } }>(
    "/pitchathons/:id/leaderboard-enhanced",
    async (req, reply) => {
      try {
        // Get all applications with their average score
        const apps = await db
          .select()
          .from(pitchathonApplications)
          .where(eq(pitchathonApplications.pitchathonId, req.params.id));

        const rows: any[] = [];
        for (const a of apps) {
          const scores = await db
            .select()
            .from(pitchathonScores)
            .where(eq(pitchathonScores.applicationId, a.id));

          const avg = scores.length
            ? Math.round((scores.reduce((s, r) => s + r.score, 0) / scores.length) * 10) / 10
            : 0;

          rows.push({
            application: a,
            scoreCount: scores.length,
            avgScore: avg,
            scores: scores, // Include individual scores
          });
        }

        rows.sort((x, y) => {
          // Sort by avg score descending, then by application date
          if (y.avgScore !== x.avgScore) return y.avgScore - x.avgScore;
          return new Date(y.application.createdAt).getTime() - new Date(x.application.createdAt).getTime();
        });

        return reply.send({ leaderboard: rows });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to get leaderboard" });
      }
    }
  );
}
