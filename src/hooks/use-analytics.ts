/**
 * useAnalytics hooks — manage analytics state and operations.
 */

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PageViewRecord, ActivityLogRecord, AnalyticsOverview, TrendData } from "@/api/analytics";
import * as analyticsApi from "@/api/analytics";

/**
 * usePageViews — Load page views for the user's profile.
 */
export function usePageViews(period: string = "7d") {
  const { data: views = [], isLoading, error } = useQuery({
    queryKey: ["analytics-page-views", period],
    queryFn: () => analyticsApi.getPageViews(period),
  });

  return {
    views,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * useActivity — Load recent activity for the user.
 */
export function useActivity(period: string = "7d", limit: number = 50) {
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ["analytics-activity", period, limit],
    queryFn: () => analyticsApi.getActivity(period, limit),
  });

  return {
    activities,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * useAnalyticsOverview — Load overview metrics (total views, vouches, investments, wallet, ventures).
 */
export function useAnalyticsOverview() {
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => analyticsApi.getAnalyticsOverview(),
  });

  return {
    overview,
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * useTrends — Load trend data (views, vouches over time).
 */
export function useTrends(period: string = "7d") {
  const { data: trends, isLoading, error } = useQuery({
    queryKey: ["analytics-trends", period],
    queryFn: () => analyticsApi.getAnalyticsTrends(period),
  });

  return {
    trends: trends || { views: [], vouches: [] },
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}

/**
 * useRecordPageView — Record a page view event.
 */
export function useRecordPageView() {
  const [error, setError] = useState<string | null>(null);

  const record = useCallback(async (pageType: "venture" | "founder" | "builder" | "investor", referrer?: string) => {
    try {
      setError(null);
      await analyticsApi.recordPageView(pageType, referrer);
    } catch (err: any) {
      const message = err.message || "Failed to record page view";
      setError(message);
    }
  }, []);

  return { record, error };
}

/**
 * useRecordActivity — Record an activity event.
 */
export function useRecordActivity() {
  const [error, setError] = useState<string | null>(null);

  const record = useCallback(async (action: string, metadata?: Record<string, any>) => {
    try {
      setError(null);
      await analyticsApi.recordActivity(action, metadata);
    } catch (err: any) {
      const message = err.message || "Failed to record activity";
      setError(message);
    }
  }, []);

  return { record, error };
}
