// @ts-nocheck
/**
 * Upload routes.
 *
 * Per the deployment decision:
 *  - GET  /api/upload/sign           → returns a Cloudinary signature
 *      for the frontend to upload images directly (avatars, logos).
 *  - POST /api/upload/document       → accepts a multipart upload and
 *      streams it to Cloudinary (pitch decks, PDFs).
 *
 * Frontend decides which to use based on file type.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { signDirectUpload, uploadDocument } from "../lib/cloudinary.js";

const signSchema = z.object({
  folder: z.enum(["avatars", "ventures", "services", "community", "misc"]),
});

export async function uploadRoutes(app: FastifyInstance) {
  /** GET /api/upload/sign */
  app.get<{ Querystring: { folder?: string } }>(
    "/upload/sign",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const parsed = signSchema.safeParse(req.query);
      if (!parsed.success) return reply.code(400).send({ error: "Invalid folder" });

      const { sub } = req.user as { sub: string };
      try {
        const payload = await signDirectUpload({
          folder: `${parsed.data.folder}/${sub}`,
          userId: sub,
        });
        return reply.send(payload);
      } catch (e) {
        return reply.code(503).send({
          error: "Cloudinary not configured",
          details: e instanceof Error ? e.message : "unknown",
        });
      }
    }
  );

  /** POST /api/upload/document — multipart */
  app.post("/upload/document", { preHandler: app.authenticate }, async (req, reply) => {
    if (!req.isMultipart()) return reply.code(400).send({ error: "Expected multipart/form-data" });
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: "Missing file" });

    const folder = (file.fields.folder as any)?.value ?? "misc";
    const allowedFolders = ["pitch-decks", "documents", "misc"];
    if (!allowedFolders.includes(folder)) {
      return reply.code(400).send({ error: `folder must be one of ${allowedFolders.join(", ")}` });
    }

    const buf = await file.toBuffer();
    if (buf.byteLength > 25 * 1024 * 1024) {
      return reply.code(413).send({ error: "File too large (max 25 MB)" });
    }

    try {
      const out = await uploadDocument(buf, folder, file.filename);
      return reply.send(out);
    } catch (e) {
      return reply.code(503).send({
        error: "Upload failed",
        details: e instanceof Error ? e.message : "unknown",
      });
    }
  });
}
// @ts-nocheck