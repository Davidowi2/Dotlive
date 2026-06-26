/**
 * Sprint B extras — fill in orphaned frontend endpoints.
 *
 *   GET  /api/community                     → current user's community (singular)
 *   POST /api/community/join                → join a community by code
 *   GET  /api/community/my                  → my community
 *   GET  /api/community/referral-code       → my community referral code
 *   POST /api/auth/forgot-password          → issue a password reset token (Resend email)
 *   POST /api/auth/reset-password           → consume a password reset token
 *   GET  /api/ventures/my                   → my ventures
 *   GET  /api/pitchathons/applications/me   → my pitchathon applications
 *   GET  /api/admin/audit                   → admin audit log
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  users, ventures, communities, communityMembers, communityReferralCodes,
  pitchathonApplications, pitchathons, adminAuditLog,
} from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import { sendEmail } from "../lib/email.js";

export async function extrasRoutes(app: FastifyInstance) {
  /* ════════════════ COMMUNITY (singular) ════════════════ */

  app.get("/community", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const rows = await db.execute(sql`
      SELECT
        c.id, c.name, c.slug, c.tier, c.member_count, c.created_at,
        m.role AS my_role, m.joined_at
      FROM community_members m
      JOIN communities c ON c.id = m.community_id
      WHERE m.user_id = ${id}
      ORDER BY m.joined_at DESC
      LIMIT 1
    `);
    const r = (rows as any)[0] ?? (rows as any).rows?.[0] ?? null;
    if (!r) return reply.send({ community: null });
    return reply.send({
      community: {
        id: r.id, name: r.name, slug: r.slug, tier: r.tier,
        memberCount: Number(r.member_count ?? 0),
        myRole: r.my_role, joinedAt: r.joined_at,
      },
    });
  });

  app.get("/community/my", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const rows = await db.execute(sql`
      SELECT
        c.id, c.name, c.slug, c.tier, c.member_count,
        m.role AS my_role, m.joined_at
      FROM community_members m
      JOIN communities c ON c.id = m.community_id
      WHERE m.user_id = ${id}
      ORDER BY m.joined_at DESC
    `);
    const list = (rows as any)[0] ?? (rows as any).rows ?? [];
    const arr = Array.isArray(list) ? list : [list];
    return reply.send({
      communities: arr.map((r: any) => ({
        id: r.id, name: r.name, slug: r.slug, tier: r.tier,
        memberCount: Number(r.member_count ?? 0),
        myRole: r.my_role, joinedAt: r.joined_at,
      })),
    });
  });

  const joinSchema = z.object({ code: z.string().min(3).max(80) });
  app.post("/community/join", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "code required" });
    const code = parsed.data.code.trim().toUpperCase();
    // Find community by referral code
    const refs = await db.execute(sql`
      SELECT community_id FROM community_referral_codes WHERE code = ${code}
    `);
    const refRow = (refs as any)[0] ?? (refs as any).rows?.[0];
    if (!refRow) return reply.code(404).send({ error: "Invalid code" });
    const communityId = refRow.community_id;
    // Check not already member
    const existing = await db.execute(sql`
      SELECT 1 FROM community_members WHERE user_id = ${id} AND community_id = ${communityId}
    `);
    const ex = (existing as any)[0] ?? (existing as any).rows?.[0];
    if (ex) return reply.code(409).send({ error: "Already a member" });
    await db.execute(sql`
      INSERT INTO community_members (user_id, community_id, role)
      VALUES (${id}, ${communityId}, 'member')
    `);
    await db.execute(sql`UPDATE communities SET member_count = member_count + 1 WHERE id = ${communityId}`);
    return reply.send({ ok: true, communityId });
  });

  app.get("/community/referral-code", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const rows = await db.execute(sql`
      SELECT crc.code, crc.community_id, c.name
      FROM community_members m
      JOIN community_referral_codes crc ON crc.community_id = m.community_id
      JOIN communities c ON c.id = m.community_id
      WHERE m.user_id = ${id}
      ORDER BY m.joined_at ASC
      LIMIT 1
    `);
    const r = (rows as any)[0] ?? (rows as any).rows?.[0] ?? null;
    if (!r) return reply.send({ code: null });
    return reply.send({
      code: r.code,
      communityId: r.community_id,
      communityName: r.name,
    });
  });

  /* ════════════════ PASSWORD RESET ════════════════ */

  const forgotSchema = z.object({ email: z.string().email() });
  app.post("/auth/forgot-password", async (req, reply) => {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid email" });
    const { email } = parsed.data;
    // Always return 200 to prevent user enumeration
    const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (u) {
      // Generate a reset token (16 bytes random hex)
      const token = require("crypto").randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
      await db.execute(sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (${u.id}, ${token}, ${expiresAt.toISOString()})
      `);
      // Email the reset link
      const resetUrl = `${process.env.FRONTEND_URL ?? "https://dotlive.cv"}/auth?resetToken=${token}`;
      await sendEmail({
        to: u.email,
        subject: "Reset your DOT password",
        html: `<p>Hi ${u.name ?? ""},</p>
<p>Click below to reset your password. The link expires in 30 minutes.</p>
<p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#0a0a0a;color:#fff;border-radius:8px;text-decoration:none">Reset password</a></p>
<p>If you didn't request this, ignore this email.</p>`,
      }).catch((e) => {
        // Don't fail the request if email fails; log it.
        req.log.warn({ err: e }, "Failed to send password reset email");
      });
    }
    return reply.send({ ok: true, message: "If an account exists for that email, we've sent a reset link." });
  });

  const resetSchema = z.object({
    token: z.string().min(20),
    newPassword: z.string().min(8).max(128),
  });
  app.post("/auth/reset-password", async (req, reply) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Token + newPassword (≥8 chars) required" });
    const { token, newPassword } = parsed.data;
    const rows = await db.execute(sql`
      SELECT user_id, expires_at, used_at FROM password_reset_tokens
      WHERE token = ${token}
      LIMIT 1
    `);
    const row = (rows as any)[0] ?? (rows as any).rows?.[0];
    if (!row) return reply.code(400).send({ error: "Invalid token" });
    if (row.used_at) return reply.code(400).send({ error: "Token already used" });
    if (new Date(row.expires_at) < new Date()) return reply.code(400).send({ error: "Token expired" });
    const hashed = await hashPassword(newPassword);
    await db.execute(sql`UPDATE users SET password_hash = ${hashed}, updated_at = NOW() WHERE id = ${row.user_id}`);
    await db.execute(sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ${token}`);
    return reply.send({ ok: true });
  });

  /* ════════════════ VENTURES /MY ════════════════ */

  app.get("/ventures/my", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const rows = await db.select().from(ventures).where(eq(ventures.userId, id)).orderBy(desc(ventures.createdAt));
    return reply.send({ ventures: rows });
  });

  /* ════════════════ PITCHATHONS APPLICATIONS /ME ════════════════ */

  app.get("/pitchathons/applications/me", { preHandler: app.authenticate }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const rows = await db
      .select()
      .from(pitchathonApplications)
      .where(eq(pitchathonApplications.founderId, id))
      .orderBy(desc(pitchathonApplications.createdAt));
    return reply.send({ applications: rows });
  });

  /* ════════════════ ADMIN AUDIT LOG ════════════════ */

  app.get<{ Querystring: { limit?: string; actor?: string } }>(
    "/admin/audit",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const id = (req.user as { sub: string }).sub;
      const roles = (await db.select({ role: require("../db/schema.js").userRoles.role })
        .from(require("../db/schema.js").userRoles)
        .where(eq(require("../db/schema.js").userRoles.userId, id))) as any;
      const roleList = roles.map((r: any) => r.role);
      if (!roleList.includes("admin") && !roleList.includes("super_admin")) {
        return reply.code(403).send({ error: "Admin only" });
      }
      const limit = Math.min(parseInt(req.query.limit ?? "100", 10) || 100, 500);
      const actor = req.query.actor;
      const where = actor ? sql`actor_user_id = ${actor}` : sql`TRUE`;
      const rows = await db.execute(sql`
        SELECT a.id, a.action, a.target_user_id, a.target_role, a.metadata,
               a.ip, a.user_agent, a.created_at, u.email AS actor_email
        FROM admin_audit_log a
        LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE ${where}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
      `);
      const list = (rows as any) ?? (rows as any).rows ?? [];
      return reply.send({ entries: Array.isArray(list) ? list : [list] });
    }
  );
}
