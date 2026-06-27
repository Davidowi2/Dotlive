/**
 * OTP / Magic Link routes (Sprint D).
 *
 *   POST /api/auth/send-otp        Issue a 6-digit code; emails via Resend.
 *   POST /api/auth/verify-otp      Consume a code; on success returns {token, user}.
 *
 * Used for:
 *   - Passwordless sign-in ("Sign in with a code")
 *   - Email verification on signup (optional)
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
import { createSession, loadUserWithRoles } from "../lib/auth.js";

const TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_ATTEMPTS = 5;        // lock after 5 wrong tries

// We need an `otp_codes` table — define the schema inline if not present
// (the table was added in the 0005 migration as part of extras.ts setup,
// but this route file is self-contained).

const sendSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["signin", "verify-email", "2fa"]).default("signin"),
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

    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    // For "verify-email" we may not have a user yet (signup flow).
    const userId = u?.id ?? null;

    // Generate a 6-digit code
    const code = String(randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + TTL_MS);

    // Insert or replace (upsert)
    await db.execute(sql`
      INSERT INTO otp_codes (email, code, purpose, user_id, expires_at, attempts)
      VALUES (${email}, ${code}, ${purpose}, ${userId}, ${expiresAt.toISOString()}, 0)
      ON CONFLICT (email, purpose)
      DO UPDATE SET
        code = EXCLUDED.code,
        user_id = EXCLUDED.user_id,
        expires_at = EXCLUDED.expires_at,
        attempts = 0,
        created_at = NOW()
    `);

    // Send via Resend if configured; otherwise log to stdout.
    const { subject, html } = purpose === "2fa"
      ? {
          subject: "Your DOT 2FA code",
          html: `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#fafafa;margin:0;padding:32px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #eee">
  <h1 style="margin:0 0 16px;font-size:20px;color:#0a0a0a">Verify it's you</h1>
  <p style="color:#444;font-size:15px;line-height:1.6">Enter this code to finish signing in:</p>
  <div style="margin:24px 0;padding:24px;background:#0a0a0a;color:#fff;border-radius:8px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;font-family:monospace">${code}</div>
  <p style="color:#888;font-size:13px">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
</div></body></html>`,
        }
      : emailTemplates.otpCode({
          name: u?.name ?? email,
          code,
          purpose: purpose === "signin" ? "sign in" : "verify your email",
        });

    await sendEmail({ to: email, subject, html }).catch((e) => {
      req.log.warn({ err: e }, "Failed to send OTP email");
    });

    return reply.send({
      ok: true,
      message: "If an account exists for that email, we've sent a code.",
      // In dev mode (no RESEND_API_KEY), include the code in the response for testing.
      // This is a security leak in prod; we guard with NODE_ENV.
      ...(process.env.NODE_ENV !== "production" && { devCode: code }),
    });
  });

  /**
   * POST /api/auth/verify-otp
   * Body: { email, code, purpose? }
   * Returns { token, user } on success — same shape as /api/auth/login.
   */
  app.post("/auth/verify-otp", async (req, reply) => {
    const parsed = z.object({
      email: z.string().email(),
      code: z.string().regex(/^\d{6}$/),
      purpose: z.enum(["signin", "verify-email", "2fa"]).default("signin"),
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
      return reply.code(400).send({ error: "Code expired. Request a new one." });
    }

    // Verify the code (constant-time comparison would be ideal but codes are short)
    const stored = await db.execute(sql`
      SELECT code FROM otp_codes WHERE id = ${row.id}
    `);
    const storedRow = (stored as any)[0] ?? (stored as any).rows?.[0];
    if (!storedRow || storedRow.code !== code) {
      // Increment attempts
      await db.execute(sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${row.id}`);
      return reply.code(401).send({ error: "Wrong code. Try again." });
    }

    // Code is correct — delete it (one-time use) and resolve the user.
    await db.execute(sql`DELETE FROM otp_codes WHERE id = ${row.id}`);

    // For "verify-email" — if user exists, mark email as verified.
    if (purpose === "verify-email" && row.user_id) {
      await db.execute(sql`UPDATE users SET email_verified_at = NOW() WHERE id = ${row.user_id}`);
      return reply.send({ ok: true, verified: true });
    }

    // For "signin" / "2fa" — must have a user.
    if (!row.user_id) return reply.code(404).send({ error: "No account for this email" });
    const user = await loadUserWithRoles(row.user_id);
    if (!user) return reply.code(404).send({ error: "Account not found" });

    // If user is banned, refuse.
    const banned = await db.execute(sql`SELECT 1 FROM user_bans WHERE user_id = ${row.user_id} AND unbanned_at IS NULL`);
    const banRow = (banned as any)[0] ?? (banned as any).rows?.[0];
    if (banRow) return reply.code(403).send({ error: "Account suspended" });

    // Issue a session + JWT token (same shape as /auth/login).
    const sessionId = await createSession(row.user_id);
    const token = await reply.jwtSign({ sub: row.user_id, sid: sessionId });
    return reply.send({ token, user });
  });
}
