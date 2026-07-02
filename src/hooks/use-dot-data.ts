/**
 * use-dot-data.ts — data hooks for DOT app.
 *
 * ALL hooks go through the Render/Neon API (custom JWT auth).
 * No Supabase imports. Every hook falls back gracefully on failure
 * so the UI can render placeholder/empty states instead of crashing.
 *
 * Each hook uses `useDotAuth()` to get the current user and JWT.
 * If not authenticated, the query is disabled.
 */

import { useQuery } from "@tanstack/react-query";
import { dotApi } from "@/api/client";
import { useDotAuth } from "@/contexts/DotAuthContext";

/* ──────────────────────────────────────────────────────────────────
 * Common shapes returned by Render API.
 * Backend returns `{ user: {...} }` for single resources and arrays for lists.
 * ────────────────────────────────────────────────────────────────── */

export interface FounderProfile {
  id?: string;
  userId: string;
  bio?: string | null;
  skills?: string[] | null;
  currentStage?: string | null;
  ventureName?: string | null;
  ventureDescription?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  country?: string | null;
  city?: string | null;
  /** from founder_profiles table */
  stage?: string | null;
  industry?: string | null;
  ventureId?: string | null;
  fundingGoal?: string | number | null;
  logoUrl?: string | null;
  vantagePoint?: number;
  fundability?: number;
  investmentReadiness?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Assessment {
  id: string;
  userId: string;
  ventureId?: string | null;
  stage: string;
  score: number;
  vantagePoint: number;
  fundability: number;
  investmentReadiness?: number;
  categoryScores?: Record<string, number>;
  answers?: unknown;
  report?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progressPct: number;
  status: string;
  completedAt?: string | null;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    description?: string;
    moduleCount?: number;
  };
}

export interface CommunityMember {
  id: string;
  communityId: string;
  founderId: string;
  role: "member" | "leader" | "founder";
  status: "active" | "paused" | "removed";
  joinedAt: string;
  community?: {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string | null;
  };
}

export interface BuilderProfile {
  id: string;
  userId: string;
  bio?: string | null;
  skills?: string[];
  hourlyRateDot?: number;
  portfolioUrl?: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface BuilderStats {
  ordersCompleted: number;
  totalEarned: number;
  avgRating: number;
  reviewCount: number;
}

/* ──────────────────────────────────────────────────────────────────
 * Hooks
 * ────────────────────────────────────────────────────────────────── */

/** Wallet balance — uses Render /api/wallet */
export function useWallet() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      const { balance } = await dotApi.get<{ balance: number }>("/api/wallet");
      return balance ?? 0;
    },
  });
}

/** Current user profile — uses Render /api/users/me */
export function useMyProfile() {
  const { user } = useDotAuth();
  return useQuery({
    queryKey: ["my_profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { user: u } = await dotApi.get<{ user: any }>("/api/users/me");
      return u;
    },
  });
}

/** Wallet transactions */
export function useTransactions() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      const { transactions } = await dotApi.get<{ transactions: any[] }>("/api/wallet/transactions");
      return transactions ?? [];
    },
  });
}

/**
 * Founder profile — returns null if no profile yet.
 * Falls back gracefully so dashboard doesn't crash.
 */
export function useFounderProfile() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["founder_profile", user?.id],
    enabled: !!user && !!token,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        const { profile } = await dotApi.get<{ profile: FounderProfile | null }>(
          "/api/users/me/founder-profile",
        );
        return profile ?? null;
      } catch {
        return null;
      }
    },
  });
}

/** Assessments list */
export function useAssessments() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["assessments", user?.id],
    enabled: !!user && !!token,
    staleTime: 120_000,  // assessments don't change often
    queryFn: async () => {
      try {
        const { assessments } = await dotApi.get<{ assessments: Assessment[] }>(
          "/api/vantage/history",
        );
        return assessments ?? [];
      } catch {
        return [];
      }
    },
  });
}

export function useMyEnrollments() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["enrollments", user?.id],
    enabled: !!user && !!token,
    staleTime: 120_000,
    queryFn: async () => {
      try {
        const { enrollments } = await dotApi.get<{ enrollments: Enrollment[] }>(
          "/api/academy/enrollments",
        );
        return enrollments ?? [];
      } catch {
        return [];
      }
    },
  });
}

export function useMyMembership() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["membership", user?.id],
    enabled: !!user && !!token,
    staleTime: 120_000,
    queryFn: async () => {
      try {
        const { membership } = await dotApi.get<{ membership: CommunityMember | null }>(
          "/api/community/membership",
        );
        return membership ?? null;
      } catch {
        return null;
      }
    },
  });
}

/** Builder profile (separate from founder profile — for marketplace/gigs) */
export function useMyBuilderProfile() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["builder_profile", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      try {
        const { profile } = await dotApi.get<{ profile: BuilderProfile | null }>(
          "/api/users/me/builder-profile",
        );
        return profile ?? null;
      } catch {
        return null;
      }
    },
  });
}

/** Marketplace services list */
export function useServices(category?: string, search?: string) {
  return useQuery({
    queryKey: ["services", category ?? "all", search ?? ""],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (search?.trim()) params.set("search", search.trim());
        const qs = params.toString() ? `?${params}` : "";
        const { services } = await dotApi.get<{ services: any[] }>(`/api/services${qs}`);
        return services ?? [];
      } catch {
        return [];
      }
    },
  });
}

/** Current user's services (as a builder) */
export function useMyServices() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["my_services", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      try {
        const { services } = await dotApi.get<{ services: any[] }>("/api/services/mine");
        return services ?? [];
      } catch {
        return [];
      }
    },
  });
}

/** Current user's orders (as client or builder) */
export function useMyOrders(role: "client" | "builder") {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["orders", role, user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      try {
        const { orders } = await dotApi.get<{ orders: any[] }>(`/api/orders?role=${role}`);
        return orders ?? [];
      } catch {
        return [];
      }
    },
  });
}

/** Builder stats — defaults to 0s if not available */
export function useBuilderStats(builderId?: string) {
  return useQuery({
    queryKey: ["builder_stats", builderId],
    enabled: !!builderId,
    staleTime: 120_000,
    queryFn: async () => {
      try {
        // Uses the public builder arena endpoint
        const data = await dotApi.get<any>(`/api/builders/${builderId}/arena`);
        const profile = data?.builder?.profile ?? {};
        return {
          ordersCompleted: Number(profile.totalCompletedOrders ?? 0),
          totalEarned: Number(profile.totalEarnedDot ?? 0),
          avgRating: Number(profile.avgRating ?? 0),
          reviewCount: Number(profile.reviewCount ?? 0),
        } as BuilderStats;
      } catch {
        return { ordersCompleted: 0, totalEarned: 0, avgRating: 0, reviewCount: 0 };
      }
    },
  });
}

export type JobListing = {
  id: string;
  ventureId: string;
  title: string;
  description: string;
  category: string;
  salaryDot: number;
  employmentType: string;
  requirements?: string | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Job listings on the marketplace */
export function useJobListings(category?: string, search?: string) {
  return useQuery({
    queryKey: ["job_listings", category ?? "all", search ?? ""],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (search?.trim()) params.set("search", search.trim());
        const qs = params.toString() ? `?${params}` : "";
        const { jobs } = await dotApi.get<{ jobs: JobListing[] }>(`/api/jobs${qs}`);
        return jobs ?? [];
      } catch {
        return [];
      }
    },
  });
}

/** Current user's posted job listings */
export function useMyJobListings() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["my_job_listings", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      try {
        const { jobs } = await dotApi.get<{ jobs: JobListing[] }>("/api/jobs/mine");
        return jobs ?? [];
      } catch {
        return [];
      }
    },
  });
}

/* ====================================================================== *
 * DOT OS hooks (reputation, level, challenges, achievements, activity,
 * advisor, valuation). All powered by Render API.
 * ====================================================================== */

export interface BuilderLevel {
  level: number;
  label: string;
  reputation: number;
  promotedAt: string | null;
  nextLevel: { level: number; gates: any };
}

export function useBuilderLevel() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["builder_level", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      return dotApi.get<BuilderLevel>("/api/builder/level");
    },
  });
}

export function useBuilderArena() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["builder_arena", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      return dotApi.get<{ challenges: any[]; mySubmissions: any[]; level: BuilderLevel }>("/api/builder/arena");
    },
  });
}

export function useChallenges(skill?: string) {
  return useQuery({
    queryKey: ["challenges", skill ?? "all"],
    queryFn: async () => {
      const qs = skill ? `?skill=${encodeURIComponent(skill)}` : "";
      const res = await dotApi.get<{ challenges: any[] }>(`/api/challenges${qs}`);
      return res.challenges ?? [];
    },
  });
}

export function useMyChallenges() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["my_challenges", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      return dotApi.get<{ posted: any[]; submissions: any[] }>("/api/builder/challenges/mine");
    },
  });
}

export function useActivity() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["activity", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      const { activities } = await dotApi.get<{ activities: any[] }>("/api/activity/me");
      return activities ?? [];
    },
  });
}

export function useAchievements() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      const { achievements } = await dotApi.get<{ achievements: any[] }>("/api/achievements/me");
      return achievements ?? [];
    },
  });
}

export function useAdvisor() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["advisor", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      const { recommendations } = await dotApi.get<{ recommendations: any[] }>("/api/ai/advisor");
      return recommendations ?? [];
    },
  });
}

export function useReputation() {
  const { user, token } = useDotAuth();
  return useQuery({
    queryKey: ["reputation", user?.id],
    enabled: !!user && !!token,
    queryFn: async () => {
      return dotApi.get<{ score: number; events: any[] }>("/api/reputation/me");
    },
  });
}

export function useVentureValuation(ventureId: string | undefined) {
  return useQuery({
    queryKey: ["venture_valuation", ventureId],
    enabled: !!ventureId,
    queryFn: async () => {
      return dotApi.get<{
        ventureId: string;
        valuation_ngn: number;
        confidence: number;
        fundability: number;
        investment_readiness: number;
        currency: string;
        stage: string;
        vantage: number;
      }>(`/api/ventures/${ventureId}/valuation`);
    },
  });
}
