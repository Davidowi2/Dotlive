/**
 * Capital Partner routes (Sprint B+).
 *
 *   Capital Partners are DIFFERENT from Investors:
 *     - Investor: browses, saves, follows ventures, can vote
 *     - Capital Partner: commits funds, sponsors events, hosts demo tracks,
 *       publishes "Featured Ventures", sees deployment tracker
 *
 *   GET    /api/capital/me                       Capital Partner profile
 *   POST   /api/capital/me                       Create/update profile
 *   GET    /api/capital/portfolio                My committed funds + ventures
 *   POST   /api/capital/commitments              Commit funds to a venture
 *   GET    /api/capital/commitments              List my commitments
 *   GET    /api/capital/featured                 Featured Ventures (public)
 *   POST   /api/capital/featured                 Feature a venture (CP only)
 *   GET    /api/capital/deployments              Deployment tracker (where DOT is deployed)
 *   GET    /api/capital/stats                    KPIs for CP dashboard
 *
 *   All routes require role=capital_partner (or admin/super_admin) UNLESS marked public.
 */

import type { FastifyInstance } from "fastify";
import { eq, and, desc, ilike, sql, inArray, or } from "drizzle-orm";

import { db } from "../db/client.js";
import {
  users, ventures, userRoles, transactions,
} from "../db/schema.js";
import { getUserRoles } from "../lib/auth.js";

/* ────────────── helpers ────────────── */

const requireCpOrAdmin = async (req: any, reply: any) => {
  const id = (req.user as { sub: string }).sub;
  const roles = await getUserRoles(id);
  if (!roles.includes("capital_partner") && !roles.includes("admin") && !roles.includes("super_admin")) {
    return reply.code(403).send({ error: "Capital Partner role required" });
  }
};

export async function capitalPartnerRoutes(app: FastifyInstance) {
  /* ════════════════ PROFILE ════════════════ */

  // Public read of CP profile (for "About this sponsor" pages)
  app.get<{ Params: { id: string } }>("/capital-partners/:id", async (req, reply) => {
    const [u] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    if (!u) return reply.code(404).send({ error: "not_found" });
    const roles = await getUserRoles(u.id);
    if (!roles.includes("capital_partner")) {
      return reply.code(404).send({ error: "Not a Capital Partner" });
    }
    // Aggregate stats
    const [cStats] = await db.execute(sql`
      SELECT
        COALESCE(SUM(amount), 0) AS total_deployed_dot
      FROM transactions
      WHERE user_id = ${u.id}
        AND description LIKE '[CAPITAL_COMMIT]%'
    `) as any;
    const [vCount] = await db.execute(sql`
      SELECT COUNT(DISTINCT (description::text))::int AS n
      FROM transactions
      WHERE user_id = ${u.id}
        AND description LIKE '[CAPITAL_COMMIT]%'
    `) as any;
    return reply.send({
      partner: {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        dotId: u.dotId,
        createdAt: u.createdAt,
        totalDeployedDot: Number((cStats as any)?.rows?.[0]?.total_deployed_dot ?? cStats?.total_deployed_dot ?? 0),
        venturesFunded: Number((vCount as any)?.rows?.[0]?.n ?? vCount?.n ?? 0),
      },
    });
  });

  // My profile
  app.get("/capital/me", { preHandler: [app.authenticate, requireCpOrAdmin] }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!u) return reply.code(404).send({ error: "not_found" });
    const roles = await getUserRoles(id);
    return reply.send({
      partner: {
        id: u.id, name: u.name, email: u.email, avatarUrl: u.avatarUrl,
        dotId: u.dotId, createdAt: u.createdAt,
        isCapitalPartner: roles.includes("capital_partner"),
      },
    });
  });

  /* ════════════════ COMMITMENTS (deploy funds) ════════════════ */

  // Public listing of CP commitments to a venture (transparency)
  app.get<{ Params: { id: string } }>("/ventures/:id/commitments", async (req, reply) => {
    const { id: ventureId } = req.params;
    const [v] = await db.select().from(ventures).where(eq(ventures.id, ventureId)).limit(1);
    if (!v) return reply.code(404).send({ error: "Venture not found" });
    const commitments = await db.execute(sql`
      SELECT
        t.id, t.user_id, t.amount, t.description, t.created_at,
        u.name AS partner_name, u.dot_id AS partner_dot_id
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE t.description LIKE '[CAPITAL_COMMIT]%'
        AND t.description LIKE ${`%${ventureId}%`}
      ORDER BY t.created_at DESC
    `);
    const rows = (commitments as any).rows ?? commitments;
    return reply.send({ ventureId, commitments: rows });
  });

  // My commitments (CP view)
  app.get("/capital/commitments", { preHandler: [app.authenticate, requireCpOrAdmin] }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const commitments = await db.execute(sql`
      SELECT t.id, t.amount, t.description, t.created_at,
        SUBSTRING(t.description FROM 'venture=([^ ]+)') AS venture_id
      FROM transactions t
      WHERE t.user_id = ${id}
        AND t.description LIKE '[CAPITAL_COMMIT]%'
      ORDER BY t.created_at DESC
      LIMIT 100
    `);
    const rows = (commitments as any).rows ?? commitments;
    // Resolve venture names
    const ventureIds = rows.map((r: any) => r.venture_id).filter(Boolean);
    const ventureMap = new Map<string, any>();
    if (ventureIds.length > 0) {
      const vs = await db.select().from(ventures).where(inArray(ventures.id, ventureIds as string[]));
      for (const v of vs) ventureMap.set(v.id, v);
    }
    return reply.send({
      commitments: rows.map((r: any) => ({
        id: r.id,
        amount: Number(r.amount),
        venture: r.venture_id ? ventureMap.get(r.venture_id) ?? null : null,
        createdAt: r.created_at,
      })),
    });
  });

  // Commit funds to a venture
  app.post("/capital/commitments", {
    preHandler: [app.authenticate, requireCpOrAdmin],
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
  }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const body = (req.body ?? {}) as { ventureId?: string; amountDot?: number; note?: string };
    if (!body.ventureId || !body.amountDot || body.amountDot <= 0) {
      return reply.code(400).send({ error: "ventureId and amountDot (>0) required" });
    }
    const [v] = await db.select().from(ventures).where(eq(ventures.id, body.ventureId)).limit(1);
    if (!v) return reply.code(404).send({ error: "Venture not found" });

    // Debit CP wallet atomically; fail if insufficient.
    const debit = await db.execute(sql`
      UPDATE wallets SET balance = balance - ${body.amountDot}, updated_at = NOW()
      WHERE user_id = ${id} AND balance >= ${body.amountDot}
      RETURNING balance
    `);
    if (((debit as any).rows ?? []).length === 0) {
      return reply.code(400).send({ error: "Insufficient DOT balance" });
    }

    // Record transaction with a tagged description so we can sum it back
    await db.insert(transactions).values({
      userId: id,
      amount: String(-body.amountDot),
      type: "debit",
      description: `[CAPITAL_COMMIT] venture=${body.ventureId}${body.note ? " note=" + body.note.slice(0, 200) : ""}`,
    } as any);

    // Credit founder's wallet
    await db.execute(sql`
      UPDATE wallets SET balance = balance + ${body.amountDot}, updated_at = NOW()
      WHERE user_id = ${v.userId}
    `);
    await db.insert(transactions).values({
      userId: v.userId,
      amount: String(body.amountDot),
      type: "credit",
      description: `[CAPITAL_RECEIVE] from=${id} venture=${body.ventureId}${body.note ? " note=" + body.note.slice(0, 200) : ""}`,
    } as any);

    const cpBalance = await db.execute(sql`SELECT balance FROM wallets WHERE user_id = ${id}`);
    const founderBalance = await db.execute(sql`SELECT balance FROM wallets WHERE user_id = ${v.userId}`);
    const cpRow = (cpBalance as any)[0] ?? (cpBalance as any).rows?.[0];
    const founderRow = (founderBalance as any)[0] ?? (founderBalance as any).rows?.[0];

    return reply.send({
      ok: true,
      commitment: {
        ventureId: v.id,
        ventureName: v.name,
        amountDot: body.amountDot,
        note: body.note ?? null,
      },
      cpNewBalance: Number(cpRow?.balance ?? 0),
      founderNewBalance: Number(founderRow?.balance ?? 0),
    });
  });

  /* ════════════════ FEATURED VENTURES ════════════════ */

  // Public list of featured ventures (with sponsor info)
  app.get("/capital/featured", async (_req, reply) => {
    // For now: top CPs (those with biggest deployment) get a featured slot per venture
    // Simpler: just return all ventures with capital deployment, ordered by total deployed DESC
    const featured = await db.execute(sql`
      WITH deployment AS (
        SELECT
          SUBSTRING(t.description FROM 'venture=([^ ]+)') AS venture_id,
          SUM(ABS(t.amount)) AS deployed_dot,
          COUNT(DISTINCT t.user_id) AS sponsor_count
        FROM transactions t
        WHERE t.description LIKE '[CAPITAL_COMMIT]%'
        GROUP BY venture_id
      )
      SELECT
        v.id, v.name, v.industry, v.stage, v.country,
        v.funding_goal, v.logo_url,
        COALESCE(d.deployed_dot, 0) AS deployed_dot,
        COALESCE(d.sponsor_count, 0) AS sponsor_count
      FROM ventures v
      LEFT JOIN deployment d ON d.venture_id = v.id
      ORDER BY deployed_dot DESC NULLS LAST, v.created_at DESC
      LIMIT 20
    `);
    const rows = (featured as any).rows ?? featured;
    return reply.send({ featured: rows });
  });

  /* ════════════════ DEPLOYMENT TRACKER ════════════════ */

  // Where my DOT is deployed (sankey-style buckets)
  app.get("/capital/deployments", { preHandler: [app.authenticate, requireCpOrAdmin] }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;

    const [committedTotal] = await db.execute(sql`
      SELECT COALESCE(SUM(ABS(amount)), 0) AS s
      FROM transactions
      WHERE user_id = ${id} AND description LIKE '[CAPITAL_COMMIT]%'
    `) as any;
    const [committedCount] = await db.execute(sql`
      SELECT COUNT(DISTINCT SUBSTRING(description FROM 'venture=([^ ]+)'))::int AS n
      FROM transactions
      WHERE user_id = ${id} AND description LIKE '[CAPITAL_COMMIT]%'
    `) as any;
    const [walletRow] = await db.execute(sql`
      SELECT COALESCE(balance, 0) AS balance
      FROM wallets WHERE user_id = ${id} LIMIT 1
    `) as any;

    return reply.send({
      deployedDot: Number(((committedTotal as any).rows?.[0] ?? committedTotal)?.s ?? 0),
      venturesFunded: Number(((committedCount as any).rows?.[0] ?? committedCount)?.n ?? 0),
      liquidDot: Number(((walletRow as any).rows?.[0] ?? walletRow)?.balance ?? 0),
    });
  });

  /* ════════════════ STATS (KPIs) ════════════════ */

  app.get("/capital/stats", { preHandler: [app.authenticate, requireCpOrAdmin] }, async (req, reply) => {
    const id = (req.user as { sub: string }).sub;
    const [stats] = await db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount END), 0) AS total_inflow,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) END), 0) AS total_outflow,
        COUNT(*) FILTER (WHERE description LIKE '[CAPITAL_COMMIT]%') AS commit_count,
        COUNT(DISTINCT SUBSTRING(description FROM 'venture=([^ ]+)')) FILTER (WHERE description LIKE '[CAPITAL_COMMIT]%') AS ventures_funded
      FROM transactions
      WHERE user_id = ${id}
    `) as any;
    const s = (stats as any).rows?.[0] ?? stats;
    return reply.send({
      totalInflowDot: Number(s?.total_inflow ?? 0),
      totalOutflowDot: Number(s?.total_outflow ?? 0),
      commitCount: Number(s?.commit_count ?? 0),
      venturesFunded: Number(s?.ventures_funded ?? 0),
    });
  });

  /* ════════════════ LIST ALL CAPITAL PARTNERS (for transparency) ════════════════ */

  app.get("/capital-partners", async (_req, reply) => {
    // All users with capital_partner role
    const cpRoles = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.role, "capital_partner"));
    if (cpRoles.length === 0) return reply.send({ partners: [] });
    const cpIds = cpRoles.map((r) => r.userId);
    const cpUsers = await db
      .select({
        id: users.id, name: users.name, email: users.email,
        dotId: users.dotId, avatarUrl: users.avatarUrl, createdAt: users.createdAt,
      })
      .from(users)
      .where(inArray(users.id, cpIds));
    // Get deployment totals per CP
    const deployments = await db.execute(sql`
      SELECT user_id, COALESCE(SUM(ABS(amount)), 0) AS deployed_dot
      FROM transactions
      WHERE description LIKE '[CAPITAL_COMMIT]%'
        AND user_id = ANY(${sql.raw(`ARRAY[${cpIds.map((id) => `'${id}'`).join(",")}]::text[]`)})
      GROUP BY user_id
    `);
    const depRows = (deployments as any).rows ?? deployments;
    const depMap = new Map<string, number>();
    for (const r of depRows) depMap.set(r.user_id, Number(r.deployed_dot));
    return reply.send({
      partners: cpUsers.map((u) => ({
        ...u,
        deployedDot: depMap.get(u.id) ?? 0,
      })),
    });
  });
}
