import type { FastifyInstance } from "fastify";
import { emailTemplates } from "../lib/email.js";

export async function emailRoutes(app: FastifyInstance) {
  app.get("/email/templates", { preHandler: app.authenticate }, async (_req, reply) => {
    const names = Object.keys(emailTemplates);
    return reply.send({
      count: names.length,
      templates: names,
    } as {
      count: number;
      templates: string[];
    });
  });
}
