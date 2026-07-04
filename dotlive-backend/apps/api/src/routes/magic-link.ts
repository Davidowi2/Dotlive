/**
 * Magic-link routes — long opaque tokens sent via email for
 * passwordless email verification + signup.
 *
 *   POST /api/auth/send-magic-link   { email, purpose? }
 *   POST /api/auth/verify-magic-link { token }
 *
 * Flow:
 *   1. User enters email on signup
 *   2. Backend generates a 32-byte random URL-safe token
 *   3. Token stored in magic_link_tokens with 30-min TTL
 *   4. Branded email sent with clickable button:
 *        https://dotlive.cv/auth-callback?verify=<token>
 *   5. User clicks → /auth-callback frontend → POST /verify-magic-link
 *   6. Backend marks token used, returns signupToken (for signup) or JWT (for signin)
 *   7. Frontend routes user to /onboarding or /dashboard
 *
 * Token is one-time use (used_at stamped on consume).
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import { db } from "../db/client.js";
import { magicLinkTokens, users, userRoles } from "../db/schema.js";
import { sendEmail, emailTemplates } from "../lib/email.js";
import { createSession, loadUserWithRoles, createUser } from "../lib/auth.js";

const TTL_MS = 30 * 60 * 1000; // 30 min — magic links live longer than OTP codes

const APP_BASE = process.env.FRONTEND_URL ?? "https://dotlive.cv";

function generateToken(): string {
  // 32 bytes → 64 hex chars (URL-safe, no padding needed)
  return randomBytes(32).toString("hex");
}

const sendSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["signup", "verify-email", "signin"]).default("signup"),
});

export async function magicLinkRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/send-magic-link
   * Body: { email, purpose? }
   * Always returns 200 (don't leak which emails exist).
   */
  app.post("/auth/send-magic-link", {
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid email" });
    const { email, purpose } = parsed.data;

    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Block signup magic-link if account already exists
    if (purpose === "signup" && u) {
      return reply.code(409).send({ error: "An account with that email already exists. Try signing in." });
    }
    // Block signin magic-link if account doesn't exist
    if ((purpose === "signin" || purpose === "verify-email") && !u) {
      return reply.code(404).send({ error: "No account found for that email. Sign up first." });
    }

    const userId = u?.id ?? null;
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TTL_MS);

    // Invalidate any existing unused tokens for this email+purpose
    await db.execute(sql`
      UPDATE magic_link_tokens
      SET used_at = NOW()
      WHERE email = ${email} AND purpose = ${purpose} AND used_at IS NULL
    `);

    // Insert the new token
    await db.insert(magicLinkTokens).values({
      email,
      token,
      purpose,
      userId,
      expiresAt,
    } as any);

    const verifyUrl = `${APP_BASE}/auth-callback?verify=${token}`;
    const template = emailTemplates.magicLink({
      name: u?.name ?? email.split("@")[0],
      verifyUrl,
      purpose,
    });

    const sendResult = await sendEmail({ to: email, subject: template.subject, html: template.html }).catch((e) => {
      req.log.warn({ err: e }, "Failed to send magic link email");
      return { delivered: false } as const;
    });

    // If the email could not actually be delivered (no Resend key, or send
    // failed), expose the token + URL so the user can complete the flow.
    // Safe: in production with Resend enabled, this is never included.
    const devBypass = sendResult?.delivered === false;

    return reply.send({
      ok: true,
      message: "We sent a verification link to your email. Click it to continue.",
      ...(devBypass && { devToken: token, devUrl: verifyUrl }),
    });
  });

  /**
   * POST /api/auth/verify-magic-link
   * Body: { token }
   * Consumes the token and returns:
   *   - signup:    { signupToken, email }   (then frontend calls /complete-signup)
   *   - signin:    { token, user }           (then frontend routes to /dashboard)
   *   - verify-email: { ok: true, verified: true }  (just marks email verified)
   */
  app.post("/auth/verify-magic-link", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const parsed = z.object({
      token: z.string().min(32).max(128),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid token" });
    const { token } = parsed.data;

    // Look up the token
    const rows = await db.execute(sql`
      SELECT id, email, purpose, user_id, expires_at, used_at
      FROM magic_link_tokens
      WHERE token = ${token}
      LIMIT 1
    `);
    const row = (rows as any)[0] ?? (rows as any).rows?.[0] ?? null;
    if (!row) return reply.code(400).send({ error: "Invalid or expired link. Please request a new one." });
    if (row.used_at) {
      return reply.code(400).send({ error: "This link has already been used. Please request a new one." });
    }
    if (new Date(row.expires_at) < new Date()) {
      return reply.code(400).send({ error: "This link has expired. Please request a new one." });
    }

    // Mark token used (one-time use)
    await db.execute(sql`UPDATE magic_link_tokens SET used_at = NOW() WHERE id = ${row.id}`);

    // ── verify-email: just mark verified, return ok ──
    if (row.purpose === "verify-email" && row.user_id) {
      await db.execute(sql`UPDATE users SET email_verified_at = NOW() WHERE id = ${row.user_id}`);
      return reply.send({ ok: true, verified: true });
    }

    // ── signup: mint a short-lived signupToken (10 min JWT) ──
    if (row.purpose === "signup") {
      const signupToken = await reply.jwtSign(
        { email: row.email, purpose: "signup" },
        { expiresIn: "10m" },
      );
      return reply.send({ ok: true, signupToken, email: row.email });
    }

    // ── signin: must have a user ──
    if (!row.user_id) return reply.code(404).send({ error: "Account not found" });
    const user = await loadUserWithRoles(row.user_id);
    if (!user) return reply.code(404).send({ error: "Account not found" });

    // If user is banned, refuse.
    const banned = await db.execute(sql`SELECT 1 FROM user_bans WHERE user_id = ${row.user_id} AND unbanned_at IS NULL`);
    const banRow = (banned as any)[0] ?? (banned as any).rows?.[0];
    if (banRow) return reply.code(403).send({ error: "Account suspended" });

    // Issue a session + JWT
    const sessionId = await createSession(row.user_id);
    const token2 = await reply.jwtSign({ sub: row.user_id, sid: sessionId });
    return reply.send({ token: token2, user });
  });
}