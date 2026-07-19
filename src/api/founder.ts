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
  ventureId: string | null;
  ventureName: string | null;
  industry: string | null;
  stage: string | null;
  country: string | null;
  communityId: string | null;
  bio: string | null;
  website: string | null;
  whatsappLink: string | null;
  emailLink: string | null;
  telegramLink: string | null;
  discordLink: string | null;
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
  whatsappLink?: string;
  emailLink?: string;
  telegramLink?: string;
  discordLink?: string;
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

/* ============================================================================
 * Venture enrichment (founder profile 11 fields — full founder profile).
 * Backed by `venture_details`, `venture_team_members`, `venture_milestones`,
 * `venture_advisors` tables.
 * ========================================================================== */

export interface VentureDetails {
  ventureId: string;
  oneLiner?: string | null;
  problem?: string | null;
  solution?: string | null;
  tractionMr?: string;
  tractionPayingUsers?: number;
  tractionGrowthPct?: number;
  tractionRetentionPct?: number;
  useOfFunds?: string | null;
  capTableTotalRaised?: string;
  capTableLastRound?: string | null;
  capTableStructure?: string | null;
  pitchDeckUrl?: string | null;
  foundingDate?: string | null;
  stageRationale?: string | null;
}

export interface TeamMember {
  id: string;
  ventureId: string;
  name: string;
  role: string;
  linkedinUrl?: string | null;
  isFounder: boolean;
  orderIndex: number;
}

export interface Milestone {
  id: string;
  ventureId: string;
  title: string;
  description?: string | null;
  achievedAt?: string | null;
  isUpcoming: boolean;
  targetDate?: string | null;
  orderIndex: number;
}

export interface Advisor {
  id: string;
  ventureId: string;
  name: string;
  credentials?: string | null;
  linkedinUrl?: string | null;
}

export interface VentureEnrichment {
  details: VentureDetails | null;
  team: TeamMember[];
  milestones: Milestone[];
  advisors: Advisor[];
}

export async function getVentureEnrichment(
  ventureId: string,
): Promise<VentureEnrichment> {
  const res = await dotApi.get<{ details: any; team: any[]; milestones: any[]; advisors: any[] }>(
    `/api/ventures/${ventureId}/enrichment`,
  );
  return {
    details: res.details,
    team: res.team ?? [],
    milestones: res.milestones ?? [],
    advisors: res.advisors ?? [],
  };
}

export async function updateVentureDetails(
  ventureId: string,
  input: Partial<VentureDetails>,
): Promise<void> {
  await dotApi.put(`/api/ventures/${ventureId}/details`, input);
}

export async function addTeamMember(
  ventureId: string,
  input: Omit<TeamMember, "id" | "ventureId">,
): Promise<TeamMember> {
  const res = await dotApi.post<{ teamMember: TeamMember }>(
    `/api/ventures/${ventureId}/team`,
    input,
  );
  return res.teamMember;
}

export async function removeTeamMember(
  ventureId: string,
  memberId: string,
): Promise<void> {
  await dotApi.delete(`/api/ventures/${ventureId}/team/${memberId}`);
}

export async function addMilestone(
  ventureId: string,
  input: Omit<Milestone, "id" | "ventureId">,
): Promise<Milestone> {
  const res = await dotApi.post<{ milestone: Milestone }>(
    `/api/ventures/${ventureId}/milestones`,
    input,
  );
  return res.milestone;
}

export async function removeMilestone(
  ventureId: string,
  milestoneId: string,
): Promise<void> {
  await dotApi.delete(`/api/ventures/${ventureId}/milestones/${milestoneId}`);
}

export async function addAdvisor(
  ventureId: string,
  input: Omit<Advisor, "id" | "ventureId">,
): Promise<Advisor> {
  const res = await dotApi.post<{ advisor: Advisor }>(
    `/api/ventures/${ventureId}/advisors`,
    input,
  );
  return res.advisor;
}

export async function removeAdvisor(
  ventureId: string,
  advisorId: string,
): Promise<void> {
  await dotApi.delete(`/api/ventures/${ventureId}/advisors/${advisorId}`);
}