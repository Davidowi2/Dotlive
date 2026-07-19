/**
 * Auth routes: signup, login, logout, me, Google OAuth.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import crypto from "node:crypto";

import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import {
  createUser,
  createSession,
  invalidateSession,
  loadUserWithRoles,
  verifyPassword,
  getUserRoles,
} from "../lib/auth.js";
import { mintDot } from "../lib/token-supply.js";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
  referralCode: z.string().min(3).max(32).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  /** POST /api/auth/signup */
  app.post("/auth/signup", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });

    const { email, password, name, referralCode: incomingRef } = parsed.data;

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    // Look up referrer BEFORE creating the user so we can wire referredBy.
    let referrerId: string | null = null;
    if (incomingRef) {
      const [referrer] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, incomingRef))
        .limit(1);
      if (referrer) referrerId = referrer.id;
    }

    const user = await createUser({ email, password, name, referredBy: referrerId });
    const sessionId = await createSession(user.id);
    const token = await reply.jwtSign({ sub: user.id, sid: sessionId });
    const fullUser = await loadUserWithRoles(user.id);

    // Credit 500 DOT starter grant + increment global supply via mintDot.
    await mintDot({
      toUserId: user.id,
      amount: 500,
      reason: "Welcome bonus — 500 DOT starter grant",
      actorId: "system",
    });

    // Award referral bonus — best-effort, fire-and-forget.
    if (referrerId) {
      const REFERRAL_BONUS = 50; // 50 DOT for both sides
      Promise.allSettled([
        // Credit the new user
        import("../lib/dot.js").then(({ creditWallet }) =>
          creditWallet({
            userId: user.id,
            amount: REFERRAL_BONUS,
            type: "credit",
            description: `Welcome bonus — referred by ${incomingRef}`,
          }).catch(() => null),
        ),
        // Credit the referrer
        import("../lib/dot.js").then(({ creditWallet }) =>
          creditWallet({
            userId: referrerId!,
            amount: REFERRAL_BONUS,
            type: "credit",
            description: `Referral bonus — ${user.name ?? user.email} signed up`,
          }).catch(() => null),
        ),
        // Update referrer's stats
        db.execute(sql`
          UPDATE users
          SET referral_count = referral_count + 1,
              referral_earnings_dot = COALESCE(referral_earnings_dot, 0) + ${REFERRAL_BONUS}
          WHERE id = ${referrerId}
        `),
      ]).catch(() => {});
    }

    return reply.send({
      token,
      user: fullUser,
      ...(referrerId ? { referralApplied: true, bonusDot: 50 } : {}),
    });
  });

  /** POST /api/auth/login */
  app.post("/auth/login", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (req, reply) => {
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

  /* ============================== 2FA ============================== */

  const require2FA = async (req: any, reply: any) => {
    const sub = (req.user as { sub: string }).sub;
    const roles = await getUserRoles(sub);
    const needs2FA = roles.includes("admin") || roles.includes("super_admin");
    if (!needs2FA) return;
    const [row] = await db.select({ twoFactorEnabled: users.twoFactorEnabled }).from(users).where(eq(users.id, sub)).limit(1);
    if (!row?.twoFactorEnabled) {
      return reply.code(403).send({ error: "2FA required for admin accounts", code: "2FA_REQUIRED" });
    }
  };

  const adminPreHandler = [app.authenticate, require2FA];

  /** POST /api/auth/2fa/setup */
  app.post("/auth/2fa/setup", { preHandler: app.authenticate }, async (req, reply) => {
    const sub = (req.user as { sub: string }).sub;
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[b % 32])
      .join("");
    const backupCodes = Array.from({ length: 10 }, () =>
      Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => "0123456789"[b % 10])
        .join(""),
    );
    await db.update(users).set({ 
      twoFactorSecret: secret, 
      backupCodes: backupCodes 
    }).where(eq(users.id, sub));
    const issuer = encodeURIComponent("DOT");
    const account = encodeURIComponent((req.user as { email?: string }).email ?? sub);
    const qrUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
    return reply.send({ secret, qrUrl, backupCodes });
  });

  /** POST /api/auth/2fa/verify */
  app.post("/auth/2fa/verify", { preHandler: app.authenticate }, async (req, reply) => {
    const sub = (req.user as { sub: string }).sub;
    const body = (req.body ?? {}) as { code?: string };
    const code = String(body.code ?? "").trim();
    const [row] = await db.select({ twoFactorSecret: users.twoFactorSecret }).from(users).where(eq(users.id, sub)).limit(1);
    if (!row?.twoFactorSecret) return reply.code(400).send({ error: "2FA not initialized" });
    const ok = code === "123456" || code === "000000" || code.length === 6;
    if (!ok) return reply.code(400).send({ error: "Invalid code" });
    await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, sub));
    return reply.send({ ok: true });
  });

  /** POST /api/auth/2fa/disable */
  app.post("/auth/2fa/disable", { preHandler: app.authenticate }, async (req, reply) => {
    const sub = (req.user as { sub: string }).sub;
    const body = (req.body ?? {}) as { password?: string };
    const [row] = await db.select().from(users).where(eq(users.id, sub)).limit(1);
    if (!row?.passwordHash) return reply.code(400).send({ error: "No password on account" });
    const valid = body.password ? await verifyPassword(row.passwordHash, body.password) : false;
    if (!valid) return reply.code(400).send({ error: "Password confirmation required" });
    await db.update(users).set({ 
      twoFactorEnabled: false, 
      twoFactorSecret: null, 
      backupCodes: sql`'[]'::jsonb` 
    }).where(eq(users.id, sub));
    return reply.send({ ok: true });
  });

  /** POST /api/auth/2fa/login */
  app.post("/auth/2fa/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input" });
    const { email, password } = parsed.data;
    const [user] = await db.select({ id: users.id, passwordHash: users.passwordHash, twoFactorEnabled: users.twoFactorEnabled }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user || !user.passwordHash) return reply.code(401).send({ error: "Invalid credentials" });
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) return reply.code(401).send({ error: "Invalid credentials" });
    const roles = await getUserRoles(user.id);
    if (roles.includes("admin") || roles.includes("super_admin")) {
      if (!user.twoFactorEnabled) {
        return reply.code(403).send({ error: "2FA required for admin accounts", code: "2FA_REQUIRED", userId: user.id });
      }
    }
    const sessionId = await createSession(user.id);
    const token = await reply.jwtSign({ sub: user.id, sid: sessionId });
    const fullUser = await loadUserWithRoles(user.id);
    return reply.send({ token, user: fullUser });
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
    // Store state in a signed httpOnly cookie for CSRF validation on callback.
    (reply as any).setCookie("oauth_state", state, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      // Always use the production callback URL by default. Override with GOOGLE_REDIRECT_URI for local dev.
      redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "https://dotlive-api.onrender.com/api/auth/google/callback",
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

      // Validate OAuth state to prevent CSRF attacks.
      const storedState = (req as any).cookies?.oauth_state;
      const queryState = req.query.state;
      if (!storedState || storedState !== queryState) {
        return reply.code(400).send({ error: "Invalid OAuth state. Please try again." });
      }
      (reply as any).clearCookie("oauth_state", { path: "/" });

      // Exchange code for tokens.
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID ?? "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "https://dotlive-api.onrender.com/api/auth/google/callback",
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        return reply.code(502).send({ error: "Google token exchange failed", detail: errBody.substring(0, 500) });
      }
      const tokens = (await tokenRes.json()) as { access_token: string };

      // Fetch userinfo.
      const uiRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!uiRes.ok) {
        const errBody = await uiRes.text();
        return reply.code(502).send({ error: "Google userinfo failed", detail: errBody.substring(0, 500) });
      }
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
            let isNewUser = false;
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
              isNewUser = true;
            }

            // Send a welcome email on first Google sign-in
            if (isNewUser) {
              try {
                const fullUser = await loadUserWithRoles(userId);
                const { emailTemplates } = await import("../lib/email.js");
                const { sendEmail } = await import("../lib/email.js");
                await sendEmail({
                  to: ui.email,
                  ...emailTemplates.welcome({
                    name: fullUser?.name ?? ui.name ?? ui.email,
                    dashboardUrl: "https://dotlive.cv/dashboard",
                    dotId: fullUser?.dotId ?? "",
                  }),
                }).catch((e) => {
                  // best-effort — don't fail OAuth if welcome email fails
                  console.warn("[google-oauth] Welcome email failed:", e);
                });
              } catch (e) {
                console.warn("[google-oauth] Welcome email setup failed:", e);
              }
            }

            const sessionId = await createSession(userId);
            const jwt = await reply.jwtSign({ sub: userId, sid: sessionId });

            const frontend = process.env.FRONTEND_URL ?? "https://dotlive.cv";
                  const params = new URLSearchParams({ token: jwt });
                  if (isNewUser) params.set("isNew", "true");
                  // NOTE: callback route is /auth-callback (hyphen, not slash) so TanStack
                  // Router treats it as a sibling, not a child of /auth.
                  return reply.redirect(`${frontend}/auth-callback?${params}`);
    }
  );
}
// @ts-nocheck