import type { FastifyInstance } from "fastify";
import { eq, sql, desc, and, isNotNull, count, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, referrals, wallets, founderProfiles } from "../db/schema.js";
import { generateReferralCode } from "../lib/auth.js";

const REWARD_AMOUNT = 10; // DOT per completed referral

/**
 * Referral system routes.
 *
 *   GET  /api/referrals/my          — get my referral stats and list (paginated)
 *   GET  /api/referrals/leaderboard — top referrers by completed referrals
 *   GET  /api/referrals/:code       — validate referral code (public)
 *   POST /api/referrals/claim/:id   — claim reward for completed referral
 *   POST /api/referrals/generate    — generate replacement referral code
 */
export async function referralRoutes(app: FastifyInstance) {
  /** GET /api/referrals/my — User's referral stats and list */
  app.get<{
    Querystring: { status?: string; limit?: string; offset?: string };
  }>("/referrals/my", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };
    const status = req.query.status as string | undefined;
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? "50"), 1), 100);
    const offset = Math.max(parseInt(req.query.offset ?? "0"), 0);

    // Validate status param
    if (status && !["pending", "completed", "rewarded"].includes(status)) {
      return reply.code(400).send({ error: "Invalid status parameter" });
    }

    // Get referrer info
    const [referrer] = await db
      .select({
        id: users.id,
        name: users.name,
        referralCode: users.referralCode,
        referralCount: users.referralCount,
        referralEarningsDot: users.referralEarningsDot,
      })
      .from(users)
      .where(eq(users.id, sub));

    if (!referrer) return reply.code(404).send({ error: "User not found" });

    // Build where conditions
    const whereConditions = status
      ? and(eq(referrals.referrerId, sub), eq(referrals.status, status))
      : eq(referrals.referrerId, sub);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ total: count() })
      .from(referrals)
      .where(whereConditions);

    const total = totalResult.total;

    // Get paginated results, ordered by most recent
    const referralsList = await db
      .select({
        id: referrals.id,
        refereeId: referrals.refereeId,
        refereeName: users.name,
        refereeEmail: users.email,
        vantageScore: sql<number>`COALESCE(${founderProfiles.vantagePoint}, 0)`,
        status: referrals.status,
        rewardClaimed: referrals.rewardClaimed,
        claimedAt: referrals.claimedAt,
        createdAt: referrals.createdAt,
        completedAt: referrals.completedAt,
      })
      .from(referrals)
      .innerJoin(users, eq(referrals.refereeId, users.id))
      .leftJoin(founderProfiles, eq(referrals.refereeId, founderProfiles.userId))
      .where(whereConditions)
      .orderBy(desc(referrals.createdAt))
      .limit(limit)
      .offset(offset);

    // Calculate stats
    const completedCount = referrer.referralCount
      ? Number(referrer.referralCount)
      : 0;
    const pendingRewards = completedCount * REWARD_AMOUNT;
    const claimedRewards = Number(referrer.referralEarningsDot ?? "0");

    return reply.send({
      referrer: {
        id: referrer.id,
        name: referrer.name ?? "Unknown",
        code: referrer.referralCode,
        totalReferrals: Number(referrer.referralCount ?? 0),
        completedReferrals: completedCount,
        pendingRewards: Math.max(0, pendingRewards - claimedRewards),
        claimedRewards,
      },
      referrals: referralsList.map((r) => ({
        id: r.id,
        refereeId: r.refereeId,
        refereeName: r.refereeName ?? "Unknown",
        refereeEmail: r.refereeEmail,
        vantageScore: r.vantageScore ?? 0,
        status: r.status,
        rewardClaimed: r.rewardClaimed,
        claimedAt: r.claimedAt?.toISOString() ?? null,
        createdAt: r.createdAt?.toISOString(),
        completedAt: r.completedAt?.toISOString() ?? null,
      })),
      pagination: {
        total,
        hasMore: offset + limit < total,
        limit,
        offset,
      },
    });
  });

  /** GET /api/referrals/leaderboard — Top referrers ranked */
  app.get<{
    Querystring: { limit?: string; offset?: string };
  }>("/referrals/leaderboard", async (req, reply) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? "20"), 1), 100);
    const offset = Math.max(parseInt(req.query.offset ?? "0"), 0);

    // Get current user if authenticated
    let currentUserId: string | null = null;
    try {
      if (req.user) {
        currentUserId = (req.user as { sub: string }).sub;
      }
    } catch {
      // Not authenticated, that's fine
    }

    // Query to get leaderboard data
    const leaderboardQuery = db
      .select({
        userId: users.id,
        userName: users.name,
        avatarUrl: users.avatarUrl,
        totalReferrals: users.referralCount,
        referralEarningsDot: users.referralEarningsDot,
      })
      .from(users)
      .where(gt(users.referralCount, 0))
      .orderBy(desc(users.referralCount), desc(users.referralEarningsDot));

    // Get total count
    const [totalResult] = await db
      .select({ total: count() })
      .from(users)
      .where(gt(users.referralCount, 0));

    const total = totalResult.total;

    // Get paginated leaderboard
    const leaderboard = await leaderboardQuery.limit(limit).offset(offset);

    // Find current user's rank if authenticated
    let userRank: { rank: number; completedReferrals: number } | null = null;
    if (currentUserId) {
      const allUsers = await leaderboardQuery;
      const userPosition = allUsers.findIndex((u) => u.userId === currentUserId);
      if (userPosition !== -1) {
        userRank = {
          rank: userPosition + 1,
          completedReferrals: Number(allUsers[userPosition].totalReferrals ?? 0),
        };
      }
    }

    return reply.send({
      leaderboard: leaderboard.map((u, index) => ({
        rank: offset + index + 1,
        userId: u.userId,
        userName: u.userName ?? "Anonymous",
        avatar: u.avatarUrl ?? null,
        totalReferrals: Number(u.totalReferrals ?? 0),
        completedReferrals: Number(u.totalReferrals ?? 0),
        earnedRewards: Number(u.referralEarningsDot ?? "0"),
      })),
      userRank,
      pagination: {
        total,
        hasMore: offset + limit < total,
        limit,
        offset,
      },
    });
  });

  /** GET /api/referrals/:code — Validate referral code (public endpoint) */
  app.get<{ Params: { code: string } }>("/referrals/:code", async (req, reply) => {
    const code = (req.params.code ?? "").trim().toUpperCase();

    // Validate code format (6-8 alphanumeric)
    if (!code || !/^[A-Z0-9]{6,8}$/.test(code)) {
      return reply.code(404).send({ error: "Invalid code format" });
    }

    const [referrer] = await db
      .select({
        id: users.id,
        name: users.name,
        referralCode: users.referralCode,
      })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (!referrer) {
      return reply.code(404).send({ error: "Referral code not found" });
    }

    return reply.send({
      code: referrer.referralCode,
      referrerId: referrer.id,
      referrerName: referrer.name ?? "A DOT member",
      isValid: true,
    });
  });

  /** POST /api/referrals/claim/:id — Claim reward for completed referral */
  app.post<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>(
    "/referrals/claim/:id",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const referralId = req.params.id;

      // Get referral
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, referralId))
        .limit(1);

      if (!referral) {
        return reply.code(404).send({ error: "Referral not found" });
      }

      // Verify user is the referrer
      if (referral.referrerId !== sub) {
        return reply.code(403).send({ error: "Not authorized to claim this referral" });
      }

      // Verify status is "completed"
      if (referral.status !== "completed") {
        return reply.code(409).send({ error: "Referral not completed yet" });
      }

      // Check if already claimed (idempotency)
      if (referral.rewardClaimed) {
        return reply.send({
          referralId: referral.id,
          status: "rewarded",
          rewardAmount: REWARD_AMOUNT,
          claimedAt: referral.claimedAt?.toISOString() ?? null,
        });
      }

      // Update referral as claimed
      const claimedAt = new Date();
      await db
        .update(referrals)
        .set({
          rewardClaimed: true,
          status: "rewarded" as any,
          claimedAt,
        } as any)
        .where(eq(referrals.id, referralId));

      // Credit wallet
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, sub))
        .limit(1);

      if (wallet) {
        const newBalance = Number(wallet.balance ?? "0") + REWARD_AMOUNT;
        await db
          .update(wallets)
          .set({ balance: newBalance.toString(), updatedAt: new Date() } as any)
          .where(eq(wallets.userId, sub));
      }

      return reply.code(200).send({
        referralId: referral.id,
        status: "rewarded",
        rewardAmount: REWARD_AMOUNT,
        claimedAt: claimedAt.toISOString(),
      });
    }
  );

  /** POST /api/referrals/generate — Generate replacement referral code */
  app.post<{ Body: Record<string, unknown> }>(
    "/referrals/generate",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };

      // Check rate limit (max 1 per week per user)
      // In production, would check from a rate_limit table
      // For now, just check if user has a code
      const [user] = await db
        .select({ referralCode: users.referralCode })
        .from(users)
        .where(eq(users.id, sub))
        .limit(1);

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      // Generate new code
      let code = generateReferralCode();
      for (let i = 0; i < 5; i++) {
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.referralCode, code))
          .limit(1);
        if (!existing) break;
        code = generateReferralCode();
      }

      const generatedAt = new Date();
      await db
        .update(users)
        .set({ referralCode: code, updatedAt: generatedAt } as any)
        .where(eq(users.id, sub));

      return reply.send({
        code,
        generatedAt: generatedAt.toISOString(),
      });
    }
  );

  // Legacy endpoints for backwards compatibility
  /** GET /api/referrals/me (legacy) */
  app.get("/referrals/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { sub } = req.user as { sub: string };

    let [me] = await db
      .select({
        id: users.id,
        referralCode: users.referralCode,
        referredBy: users.referredBy,
        referralCount: users.referralCount,
        referralEarningsDot: users.referralEarningsDot,
        name: users.name,
        dotId: users.dotId,
      })
      .from(users)
      .where(eq(users.id, sub))
      .limit(1);

    if (!me) return reply.code(404).send({ error: "User not found" });

    // Lazily generate a referral code for legacy users
    if (!me.referralCode) {
      let code = generateReferralCode();
      for (let i = 0; i < 5; i++) {
        const [exists] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.referralCode, code))
          .limit(1);
        if (!exists) break;
        code = generateReferralCode();
      }
      await db
        .update(users)
        .set({ referralCode: code, updatedAt: new Date() } as any)
        .where(eq(users.id, sub));
      me = { ...me, referralCode: code };
    }

    return reply.send({
      code: me.referralCode,
      link: `https://dotlive.cv/r/${me.referralCode}`,
      count: Number(me.referralCount ?? 0),
      earningsDot: String(me.referralEarningsDot ?? "0"),
      referredBy: me.referredBy ?? null,
    });
  });

  /** GET /api/referrals/leaderboard (legacy) */
  app.get("/referrals/leaderboard", async (_req, reply) => {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        dotId: users.dotId,
        referralCode: users.referralCode,
        referralCount: users.referralCount,
        referralEarningsDot: users.referralEarningsDot,
      })
      .from(users)
      .where(sql`${users.referralCount} > 0`)
      .orderBy(desc(users.referralCount))
      .limit(20);

    return reply.send({
      leaderboard: rows.map((r) => ({
        name: r.name ?? "Anonymous",
        dotId: r.dotId,
        referralCode: r.referralCode,
        referralCount: Number(r.referralCount ?? 0),
        earningsDot: String(r.referralEarningsDot ?? "0"),
      })),
    });
  });

  /** POST /api/referrals/validate — checks if a code is real (legacy) */
  app.post<{ Body: { code?: string } }>("/referrals/validate", async (req, reply) => {
    const code = (req.body?.code ?? "").trim().toUpperCase();
    if (!code) return reply.code(400).send({ error: "Missing code" });

    const [u] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);

    if (!u) return reply.code(404).send({ valid: false, error: "Referral code not found" });

    return reply.send({ valid: true, referrerName: u.name ?? "A DOT member" });
  });
}