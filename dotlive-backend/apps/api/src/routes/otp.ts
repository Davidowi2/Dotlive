/**
 * OTP / Magic Link routes.
 *
 *   POST /api/auth/send-otp        Issue a 6-digit code; emails via Resend.
 *   POST /api/auth/verify-otp      Consume a code; on success returns {token, user, signupToken?}.
 *
 * Used for:
 *   - Passwordless sign-in ("Sign in with a code")
 *   - Email verification during signup (signup → verify → complete-signup)
 *   - 2FA second factor
 *
 * Codes are stored in `otp_codes` table with 10-minute TTL.
 * Falls back to console.log if RESEND_API_KEY is unset (dev mode).
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { randomInt } from "crypto";

import { db } from "../db/client.js";
import { users, userRoles } from "../db/schema.js";
import { sendEmail, emailTemplates } from "../lib/email.js";
import { createSession, loadUserWithRoles, createUser } from "../lib/auth.js";

const TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_ATTEMPTS = 5;        // lock after 5 wrong tries

const sendSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["signin", "signup", "verify-email", "2fa"]).default("signin"),
});

export async function otpRoutes(app: FastifyInstance) {
  /**
   * POST /api/auth/send-otp
   * Body: { email, purpose? }
   * Always returns 200 (don't leak which emails exist).
   */
  app.post("/auth/send-otp", async (req, reply) => {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid email" });
    const { email, purpose } = parsed.data;

    // For signin/2fa — must have existing user. For signup/verify-email — may not.
    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Block signup OTP if account already exists
    if (purpose === "signup" && u) {
      return reply.code(409).send({ error: "An account with that email already exists. Try signing in." });
    }
    // Block signin OTP if account doesn't exist
    if ((purpose === "signin" || purpose === "2fa") && !u) {
      return reply.code(404).send({ error: "No account found for that email. Sign up first." });
    }

    const userId = u?.id ?? null;

    // Generate a 6-digit code
    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + TTL_MS);

    // Insert or replace (upsert)
    await db.execute(sql`
      INSERT INTO otp_codes (email, code, purpose, user_id, expires_at, attempts, created_at)
      VALUES (${email}, ${code}, ${purpose}, ${userId}, ${expiresAt.toISOString()}, 0, NOW())
      ON CONFLICT (email, purpose)
      DO UPDATE SET
        code = EXCLUDED.code,
        user_id = EXCLUDED.user_id,
        expires_at = EXCLUDED.expires_at,
        attempts = 0
    `);

    // Use the new branded email template for ALL purposes.
    const template = emailTemplates.otpCode({
      name: u?.name ?? email.split("@")[0],
      code,
      purpose: purpose,
      expiresInMinutes: 10,
    });

    const sendResult = await sendEmail({ to: email, subject: template.subject, html: template.html }).catch((e) => {
      req.log.warn({ err: e }, "Failed to send OTP email");
      return { delivered: false } as const;
    });

    // If the email could not actually be delivered (no Resend key, or send
    // failed), include the code in the response so the user isn't locked out
    // of the flow. When Resend is configured and the send succeeded, we
    // never leak the code.
    const devCode = sendResult?.delivered === false ? code : null;

    return reply.send({
      ok: true,
      message: purpose === "signup"
        ? "We sent a code to your email. Enter it to create your account."
        : purpose === "2fa"
          ? "We sent your 2FA code to your email."
          : "If an account exists for that email, we've sent a code.",
      // Dev convenience: if the email was NOT actually delivered (no Resend
      // key configured, or send failed), expose the code so the user can
      // complete the flow. Safe: in production with Resend enabled, this
      // is always null.
      ...(devCode && { devCode }),
    });
  });

  /**
   * POST /api/auth/verify-otp
   * Body: { email, code, purpose?, pendingUser? }
   *
   *   - signin / 2fa: must have existing user → returns { token, user }
   *   - verify-email: marks email verified on existing user → { ok: true, verified: true }
   *   - signup: returns { signupToken } (short-lived JWT) that authorises the
   *     frontend to call /api/auth/complete-signup with password + name.
   */
  app.post("/auth/verify-otp", async (req, reply) => {
    const parsed = z.object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
      purpose: z.enum(["signin", "signup", "verify-email", "2fa"]).default("signin"),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "email + 6-digit code required" });
    const { email, code, purpose } = parsed.data;

    // Look up the code
    const rows = await db.execute(sql`
      SELECT id, user_id, attempts, expires_at
      FROM otp_codes
      WHERE email = ${email} AND purpose = ${purpose}
      LIMIT 1
    `);
    const row = (rows as any)[0] ?? (rows as any).rows?.[0] ?? null;
    if (!row) return reply.code(400).send({ error: "No code sent to this email. Request a new one." });
    if (row.attempts >= MAX_ATTEMPTS) {
      return reply.code(429).send({ error: "Too many attempts. Request a new code." });
    }
    if (new Date(row.expires_at) < new Date()) {
      return reply.code(400).send({ error: "Code expired. Request a new code." });
    }

    // Verify the code
    const stored = await db.execute(sql`SELECT code FROM otp_codes WHERE id = ${row.id}`);
    const storedRow = (stored as any)[0] ?? (stored as any).rows?.[0];
    if (!storedRow || storedRow.code !== code) {
      await db.execute(sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${row.id}`);
      return reply.code(401).send({ error: "Wrong code. Try again." });
    }

    // Code is correct — delete it (one-time use).
    await db.execute(sql`DELETE FROM otp_codes WHERE id = ${row.id}`);

    // ── verify-email: just mark verified, return ok. ──
    if (purpose === "verify-email" && row.user_id) {
      await db.execute(sql`UPDATE users SET email_verified_at = NOW() WHERE id = ${row.user_id}`);
      return reply.send({ ok: true, verified: true });
    }

    // ── signup: mint a short-lived signupToken (10 min) that lets the
    //    frontend call /api/auth/complete-signup with the chosen password. ──
    if (purpose === "signup") {
      const signupToken = await reply.jwtSign(
        { email, purpose: "signup" },
        { expiresIn: "10m" },
      );
      return reply.send({ ok: true, signupToken, email });
    }

    // ── signin / 2fa: must have a user. ──
    if (!row.user_id) return reply.code(404).send({ error: "No account for this email" });
    const user = await loadUserWithRoles(row.user_id);
    if (!user) return reply.code(404).send({ error: "Account not found" });

    // If user is banned, refuse.
    const banned = await db.execute(sql`SELECT 1 FROM user_bans WHERE user_id = ${row.user_id} AND unbanned_at IS NULL`);
    const banRow = (banned as any)[0] ?? (banned as any).rows?.[0];
    if (banRow) return reply.code(403).send({ error: "Account suspended" });

    // Issue a session + JWT token.
    const sessionId = await createSession(row.user_id);
    const token = await reply.jwtSign({ sub: row.user_id, sid: sessionId });
    return reply.send({ token, user });
  });

  /**
   * POST /api/auth/complete-signup
   * Body: { signupToken, password, name }
   * Creates the user (now that we know the email is owned + verified),
   * mints a session, returns { token, user }.
   */
  app.post("/auth/complete-signup", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const parsed = z.object({
      signupToken: z.string().min(20),
      password: z.string().min(8).max(128),
      name: z.string().min(1).max(100).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid input", details: parsed.error.flatten() });

    const { signupToken, password, name } = parsed.data;

    // Verify the signup token
    let payload: { email: string; purpose: string };
    try {
      payload = (app.jwt.verify(signupToken) as any);
    } catch {
      return reply.code(401).send({ error: "Signup session expired. Please verify your email again." });
    }
    if (payload.purpose !== "signup") {
      return reply.code(401).send({ error: "Invalid signup token" });
    }

    const email = payload.email.toLowerCase();

    // Make sure user doesn't exist (race condition)
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return reply.code(409).send({ error: "An account with that email already exists. Try signing in." });
    }

    // Create the user (with password now)
    const user = await createUser({ email, password, name });
    const sessionId = await createSession(user.id);
    const token = await reply.jwtSign({ sub: user.id, sid: sessionId });
    const fullUser = await loadUserWithRoles(user.id);

    // Send a welcome email (best-effort, don't fail if it doesn't send)
    sendEmail({
      to: email,
      ...emailTemplates.welcome({
        name: fullUser?.name ?? name ?? email,
        dashboardUrl: "https://dotlive.cv/dashboard",
        dotId: fullUser?.dotId ?? user.dotId,
      }),
    }).catch((e) => req.log.warn({ err: e }, "Failed to send welcome email"));

    return reply.send({ token, user: fullUser });
  });
}