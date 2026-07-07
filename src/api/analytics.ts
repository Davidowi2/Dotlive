/**
 * Analytics API — wraps the Fastify /api/analytics/* endpoints.
 */

import { dotApi } from "@/api/client";

export interface PageViewRecord {
  date: string;
  count: number;
}

export interface ActivityLogRecord {
  id: string;
  userId: string;
  action: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalViews: number;
  totalVouches: number;
  totalInvestments: number;
  walletBalance: string;
  venturesCount: number;
}

export interface TrendData {
  date: string;
  count: number;
}

/**
 * GET /api/analytics/views?period=7d|30d|90d
 * Get page views for the authenticated user's profile.
 */
export async function getPageViews(period: string = "7d"): Promise<PageViewRecord[]> {
  const res = await dotApi.get<{ views: PageViewRecord[] }>(`/api/analytics/views?period=${period}`);
  return res.views ?? [];
}

/**
 * GET /api/analytics/activity?period=7d|30d|90d&limit=50
 * Get recent activity for the authenticated user.
 */
export async function getActivity(period: string = "7d", limit: number = 50): Promise<ActivityLogRecord[]> {
  const res = await dotApi.get<{ activities: ActivityLogRecord[] }>(`/api/analytics/activity?period=${period}&limit=${limit}`);
  return res.activities ?? [];
}

/**
 * GET /api/analytics/overview
 * Get summary stats for the authenticated user.
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await dotApi.get<{ overview: AnalyticsOverview }>("/api/analytics/overview");
  return res.overview;
}

/**
 * GET /api/analytics/trends?period=7d|30d|90d
 * Get time-series data for views and vouches over time.
 */
export async function getAnalyticsTrends(period: string = "7d"): Promise<{
  views: TrendData[];
  vouches: TrendData[];
}> {
  const res = await dotApi.get<{
    trends: {
      views: TrendData[];
      vouches: TrendData[];
    };
  }>(`/api/analytics/trends?period=${period}`);
  return res.trends ?? { views: [], vouches: [] };
}

/**
 * POST /api/analytics/page-view
 * Record a page view event.
 */
export async function recordPageView(pageType: "venture" | "founder" | "builder" | "investor", referrer?: string): Promise<void> {
  await dotApi.post("/api/analytics/page-view", {
    pageType,
    referrer: referrer || null,
  });
}

/**
 * POST /api/analytics/activity
 * Record an activity event.
 */
export async function recordActivity(action: string, metadata?: Record<string, any>): Promise<void> {
  await dotApi.post("/api/analytics/activity", {
    action,
    metadata: metadata || null,
  });
}
