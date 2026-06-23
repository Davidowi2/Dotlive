/**
 * Module augmentation so `app.authenticate` is typed.
 * Without this, every use of `app.authenticate` requires a
 * `(app as any).authenticate` cast.
 *
 * Import this file for its side effects:
 *   import "./types/fastify.d.js";
 */
import "fastify";
import "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: any, reply: any) => Promise<void>;
  }
  interface FastifyRequest {
    jwtVerify: () => Promise<void>;
  }
}
