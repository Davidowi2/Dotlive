/**
 * Analytics routes — Session 13.
 *
 * Provides analytics endpoints for tracking user activity, page views, and metrics.
 */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "../db/client.js";
import { pageViews, activityLog, wallets, ventures, users } from "../db/schema.js";

/**
 * Helper to get date range based on period string.
 * Returns { startDate, endDate }
 */
function getDateRange(period: string = "7d"): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  if (period === "30d") {
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === "90d") {
    startDate.setDate(startDate.getDate() - 90);
  } else {
    // default 7d
    startDate.setDate(startDate.getDate() - 7);
  }

  return { startDate, endDate };
}

export async function analyticsRoutes(app: FastifyInstance) {
  /**
   * GET /api/analytics/views?period=7d|30d|90d
   * Get page views for the authenticated user's profile.
   */
  app.get(
    "/analytics/views",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const period = (req.query as any)?.period || "7d";

      try {
        const { startDate, endDate } = getDateRange(period);

        const views = await db
          .select({
            date: sql<string>`date(${pageViews.createdAt})`,
            count: count(),
          })
          .from(pageViews)
          .where(and(
            eq(pageViews.userId, sub),
            gte(pageViews.createdAt, startDate),
            lte(pageViews.createdAt, endDate)
          ))
          .groupBy(sql<string>`date(${pageViews.createdAt})`)
          .orderBy(sql<string>`date(${pageViews.createdAt})`);

        return reply.send({ views });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to fetch views" });
      }
    }
  );

  /**
   * GET /api/analytics/activity?period=7d|30d|90d
   * Get recent activity for the authenticated user.
   */
  app.get(
    "/analytics/activity",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const period = (req.query as any)?.period || "7d";
      const limit = Math.min(Number((req.query as any)?.limit) || 50, 100);

      try {
        const { startDate } = getDateRange(period);

        const activities = await db
          .select()
          .from(activityLog)
          .where(and(
            eq(activityLog.userId, sub),
            gte(activityLog.createdAt, startDate)
          ))
          .orderBy(desc(activityLog.createdAt))
          .limit(limit);

        return reply.send({ activities });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to fetch activity" });
      }
    }
  );

  /**
   * GET /api/analytics/overview
   * Get summary stats for the authenticated user.
   * Returns: totalViews, totalVouches, totalInvestments, walletBalance, venturesCount
   */
  app.get(
    "/analytics/overview",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };

      try {
        // Total views on this user's profile
        const viewsResult = await db
          .select({ count: count() })
          .from(pageViews)
          .where(eq(pageViews.userId, sub));

        const totalViews = viewsResult[0]?.count || 0;

        // Total vouches received (count activity_log entries with action='vouch_given' where userId is subject)
        const vouchesResult = await db
          .select({ count: count() })
          .from(activityLog)
          .where(and(
            eq(activityLog.userId, sub),
            eq(activityLog.action, "vouch_given")
          ));

        const totalVouches = vouchesResult[0]?.count || 0;

        // Investment-related activities
        const investmentsResult = await db
          .select({ count: count() })
          .from(activityLog)
          .where(and(
            eq(activityLog.userId, sub),
            eq(activityLog.action, "investment_made")
          ));

        const totalInvestments = investmentsResult[0]?.count || 0;

        // Wallet balance
        const walletResult = await db
          .select({ balance: wallets.balance })
          .from(wallets)
          .where(eq(wallets.userId, sub));

        const walletBalance = walletResult[0]?.balance || "0";

        // Count ventures
        const venturesResult = await db
          .select({ count: count() })
          .from(ventures)
          .where(eq(ventures.userId, sub));

        const venturesCount = venturesResult[0]?.count || 0;

        return reply.send({
          overview: {
            totalViews,
            totalVouches,
            totalInvestments,
            walletBalance: walletBalance.toString(),
            venturesCount,
          },
        });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to fetch overview" });
      }
    }
  );

  /**
   * GET /api/analytics/trends?period=7d|30d|90d
   * Get time-series data for views, vouches, investments over time.
   */
  app.get(
    "/analytics/trends",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };
      const period = (req.query as any)?.period || "7d";

      try {
        const { startDate, endDate } = getDateRange(period);

        // Views trend
        const viewsTrend = await db
          .select({
            date: sql<string>`date(${pageViews.createdAt})`,
            count: count(),
          })
          .from(pageViews)
          .where(and(
            eq(pageViews.userId, sub),
            gte(pageViews.createdAt, startDate),
            lte(pageViews.createdAt, endDate)
          ))
          .groupBy(sql<string>`date(${pageViews.createdAt})`)
          .orderBy(sql<string>`date(${pageViews.createdAt})`);

        // Vouches trend
        const vouchesTrend = await db
          .select({
            date: sql<string>`date(${activityLog.createdAt})`,
            count: count(),
          })
          .from(activityLog)
          .where(and(
            eq(activityLog.userId, sub),
            eq(activityLog.action, "vouch_given"),
            gte(activityLog.createdAt, startDate),
            lte(activityLog.createdAt, endDate)
          ))
          .groupBy(sql<string>`date(${activityLog.createdAt})`)
          .orderBy(sql<string>`date(${activityLog.createdAt})`);

        return reply.send({
          trends: {
            views: viewsTrend,
            vouches: vouchesTrend,
          },
        });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to fetch trends" });
      }
    }
  );

  /**
   * POST /api/analytics/page-view
   * Record a page view event.
   * Body: { viewerId?, pageType, referrer? }
   */
  app.post(
    "/analytics/page-view",
    async (req, reply) => {
      const { sub: userId } = req.user as { sub: string } | undefined;

      const parsed = z
        .object({
          viewerId: z.string().optional(), // optional; for frontend-driven tracking
          pageType: z.enum(["venture", "founder", "builder", "investor"]),
          referrer: z.string().optional(),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input" });
      }

      try {
              const viewerId = parsed.data.viewerId || userId;

              // @ts-ignore - Drizzle type inference issue with Neon
              await db.insert(pageViews).values({
                userId: userId as string,
                viewerId: viewerId as string,
                pageType: parsed.data.pageType,
                referrer: parsed.data.referrer || null,
              });

        return reply.code(201).send({ success: true });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to record page view" });
      }
    }
  );

  /**
   * POST /api/analytics/activity
   * Record an activity event.
   * Body: { action, metadata? }
   */
  app.post(
    "/analytics/activity",
    { preHandler: app.authenticate },
    async (req, reply) => {
      const { sub } = req.user as { sub: string };

      const parsed = z
        .object({
          action: z.string(),
          metadata: z.record(z.any()).optional(),
        })
        .safeParse(req.body);

      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid input" });
      }

      try {
        // @ts-ignore - Drizzle type inference issue with Neon
        await db.insert(activityLog).values({
          userId: sub,
          action: parsed.data.action,
          metadata: parsed.data.metadata || null,
        });

        return reply.code(201).send({ success: true });
      } catch (err) {
        return reply.code(500).send({ error: err instanceof Error ? err.message : "Failed to record activity" });
      }
    }
  );
}
