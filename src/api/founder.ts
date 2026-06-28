/**
 * Founder API — wraps /api/users/me/founder-profile.
 *
 * Founder profile holds everything investors need to make a decision:
 *   venture basics, location, traction (headcount/revenue), funding
 *   history, and share pricing.
 */
import { dotApi } from "@/api/client";

export interface FounderProfile {
  userId: string;
  ventureName: string | null;
  industry: string | null;
  stage: string | null;
  country: string | null;
  communityId: string | null;
  bio: string | null;
  website: string | null;
  fundingGoal: string | null;
  logoUrl: string | null;
  vantagePoint: number | null;
  fundability: number | null;
  investmentReadiness: number | null;
  // Tier 2 — fields investors need.
  headcount: number | null;
  annualRevenueDot: string | null;
  foundedYear: number | null;
  totalRaisedDot: string | null;
  sharePriceKobo: number | null;
  sharesAvailable: number | null;
}

export interface FounderProfileInput {
  ventureName?: string;
  industry?: string;
  stage?: string;
  country?: string;
  bio?: string;
  website?: string;
  fundingGoal?: string;
  logoUrl?: string;
  headcount?: number;
  annualRevenueDot?: string;
  foundedYear?: number;
  totalRaisedDot?: string;
  sharePriceKobo?: number;
  sharesAvailable?: number;
}

export async function getMyFounderProfile(): Promise<FounderProfile | null> {
  try {
    const res = await dotApi.get<{ profile: FounderProfile | null }>(
      "/api/users/me/founder-profile",
    );
    return res.profile ?? null;
  } catch {
    return null;
  }
}

export async function saveFounderProfile(
  input: FounderProfileInput,
): Promise<void> {
  await dotApi.post("/api/users/me/founder-profile", input);
}