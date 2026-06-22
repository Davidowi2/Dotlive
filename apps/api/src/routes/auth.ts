// @ts-nocheck
/**
 * Auth routes: signup, login, logout, me, Google OAuth.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import {
  createUser,
  createSession,
  invalidateSession,
  loadUserWithRoles,
  verifyPassword,
} from "../lib/auth.js";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  /** POST /api/auth/signup */
  app.post("/auth/signup", async (req, reply) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });

    const { email, password, name } = parsed.data;

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const user = await createUser({ email, password, name });
    const sessionId = await createSession(user.id);
    const token = await reply.jwtSign({ sub: user.id, sid: sessionId });
    const fullUser = await loadUserWithRoles(user.id);
    return reply.send({ token, user: fullUser });
  });

  /** POST /api/auth/login */
  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });

    const { email, password } = parsed.data;
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    const user = rows[0];
    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });

    const sessionId = await createSession(user.id);
    const token = await reply.jwtSign({ sub: user.id, sid: sessionId });
    const fullUser = await loadUserWithRoles(user.id);
    return reply.send({ token, user: fullUser });
  });

  /** POST /api/auth/logout */
  app.post("/auth/logout", { preHandler: app.authenticate }, async (req, reply) => {
    const { sid } = req.user as { sub: string; sid: string };
    await invalidateSession(sid);
    return reply.send({ ok: true });
  });

  /** GET /api/auth/me */
  app.get("/auth/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const user = await loadUserWithRoles(sub);
    if (!user) return reply.code(404).send({ error: "User not found" });
    return reply.send({ user });
  });

  /**
   * Google OAuth (Phase 3).
   *
   * GET /api/auth/google            → 302 to Google's consent screen.
   * GET /api/auth/google/callback   → exchanges `code`, upserts user,
   *                                  creates a session, returns the
   *                                  standard {token, user} payload as
   *                                  a query-string redirect to the
   *                                  frontend so the SPA can grab it.
   *
   * Requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in env.
   * If unset, returns 503 with a clear message.
   */
  app.get("/auth/google", async (_req, reply) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return reply.code(503).send({ error: "Google OAuth not configured" });
    }
    const state = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: `${process.env.API_BASE_URL ?? "http://localhost:3001"}/api/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });
    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    "/auth/google/callback",
    async (req, reply) => {
      const { code, error } = req.query;
      if (error) return reply.code(400).send({ error });
      if (!code) return reply.code(400).send({ error: "Missing code" });

      // Exchange code for tokens.
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID ?? "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          redirect_uri: `${process.env.API_BASE_URL ?? "http://localhost:3001"}/api/auth/google/callback`,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        return reply.code(502).send({ error: "Google token exchange failed" });
      }
      const tokens = (await tokenRes.json()) as { access_token: string };

      // Fetch userinfo.
      const uiRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!uiRes.ok) return reply.code(502).send({ error: "Google userinfo failed" });
      const ui = (await uiRes.json()) as {
        id: string;
        email: string;
        name?: string;
        picture?: string;
        verified_email?: boolean;
      };

      // Reject unverified emails — otherwise a Google account
      // holder could sign in as anyone whose email they control.
      if (ui.verified_email !== true) {
        return reply.code(403).send({
          error: "Your Google account email is not verified. " +
                 "Verify it at https://myaccount.google.com then try again.",
        });
      }

      // Upsert user.
      const existing = await db.select().from(users).where(eq(users.email, ui.email.toLowerCase())).limit(1);
      let userId: string;
      if (existing[0]) {
        userId = existing[0].id;
      } else {
        const u = await createUser({
          email: ui.email,
          googleId: ui.id,
          name: ui.name,
          avatarUrl: ui.picture,
        });
        userId = u.id;
      }

      const sessionId = await createSession(userId);
      const jwt = await reply.jwtSign({ sub: userId, sid: sessionId });
      const fullUser = await loadUserWithRoles(userId);

      const frontend = process.env.FRONTEND_URL ?? "http://localhost:5173";
      const params = new URLSearchParams({ token: jwt });
      return reply.redirect(`${frontend}/auth/callback?${params}`);
    }
  );
}
// @ts-nocheck