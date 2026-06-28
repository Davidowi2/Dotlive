/**
 * Certificates routes — credentials issued by the platform.
 *
 *   GET   /api/certificates/me              current user's certificates
 *   GET   /api/certificates/:id              get one
 *   GET   /api/certificates/:id/download     returns the cert as JSON
 *                                             (frontend can render a
 *                                             print-friendly view)
 *   POST  /api/certificates/seed             dev-only: insert 3 demo certs
 */
import type { FastifyInstance, FastifyRequest } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { certificates } from "../db/schema.js";

export async function certificatesRoutes(app: FastifyInstance) {
  const getUserId = (req: FastifyRequest): string => {
    return (req.user as { sub?: string } | undefined)?.sub ?? "";
  };

  /* ============================== LIST ============================== */
  app.get(
    "/certificates/me",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const rows = await db
        .select()
        .from(certificates)
        .where(eq(certificates.userId, userId))
        .orderBy(desc(certificates.issuedAt))
        .limit(100);

      return reply.send({ certificates: rows });
    },
  );

  /* ============================== GET ONE ============================== */
  app.get<{ Params: { id: string } }>(
    "/certificates/:id",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const [row] = await db
        .select()
        .from(certificates)
        .where(and(eq(certificates.id, req.params.id), eq(certificates.userId, userId)))
        .limit(1);
      if (!row) return reply.code(404).send({ error: "Certificate not found" });
      return reply.send({ certificate: row });
    },
  );

  /* ============================== DOWNLOAD (JSON) ============================== */
  app.get<{ Params: { id: string } }>(
    "/certificates/:id/download",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const [row] = await db
        .select()
        .from(certificates)
        .where(and(eq(certificates.id, req.params.id), eq(certificates.userId, userId)))
        .limit(1);
      if (!row) return reply.code(404).send({ error: "Certificate not found" });

      // Return as a downloadable JSON; the frontend renders it print-friendly.
      reply.header("Content-Disposition", `attachment; filename="DOT-${row.credentialId}.json"`);
      return reply.send({
        platform: "DOT",
        credentialId: row.credentialId,
        title: row.title,
        courseId: row.courseId,
        issuer: row.issuer,
        issuedAt: row.issuedAt,
        score: row.score,
        level: row.level,
        recipientId: userId,
        meta: row.meta,
      });
    },
  );

  /* ============================== SEED (dev) ============================== */
  app.post(
    "/certificates/seed",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const userId = getUserId(req);
      if (!userId) return reply.code(401).send({ error: "Unauthenticated" });

      const seeds = [
        { title: "LEAPFROG Founder Foundations", courseId: "dot-academy-leapfrog", issuer: "DOT Academy", score: 92, dotEarned: 500, level: "Foundations", credentialId: `DOT-FF-${new Date().getFullYear()}-${userId.slice(0, 6).toUpperCase()}` },
        { title: "Venture Design Thinking", courseId: "dot-academy-vdt", issuer: "DOT Academy", score: 88, dotEarned: 750, level: "Intermediate", credentialId: `DOT-VDT-${new Date().getFullYear()}-${userId.slice(0, 6).toUpperCase()}` },
        { title: "Customer Discovery Mastery", courseId: "dot-academy-cdm", issuer: "DOT Academy", score: 95, dotEarned: 1000, level: "Advanced", credentialId: `DOT-CDM-${new Date().getFullYear()}-${userId.slice(0, 6).toUpperCase()}` },
      ];

      const created: any[] = [];
      for (const s of seeds) {
        const [row] = await db
          .insert(certificates)
          .values({
            userId,
            title: s.title,
            courseId: s.courseId,
            issuer: s.issuer,
            issuedAt: new Date(),
            score: s.score,
            dotEarned: s.dotEarned,
            level: s.level,
            credentialId: s.credentialId,
            meta: { version: "1.0", source: "academy_seed" },
          } as any)
          .onConflictDoNothing()
          .returning();
        if (row) created.push(row);
      }
      return reply.send({ ok: true, created: created.length });
    },
  );
}
