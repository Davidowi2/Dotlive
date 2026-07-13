/**
 * Shared TypeScript types for the DOT API.
 * These mirror the backend sharedTypes.ts exactly.
 */

export type AppRole =
  | "builder"
  | "founder"
  | "investor"
  | "community_leader"
  | "admin"
  | "super_admin"
  | "vendor"
  | "capital_partner"
  | "judge"
  | "moderator"
  | "support"
  | "finance";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  dotId: string;
  roles: AppRole[];
  createdAt: string;
  onboardedAt: string | null;
  privacyAcceptedAt: string | null;
  termsAcceptedAt: string | null;
}

export interface Wallet {
  balance: number;
  dotId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

export interface Venture {
  id: string;
  userId: string;
  name: string;
  industry: string | null;
  stage: string;
  country: string | null;
  description: string | null;
  website: string | null;
  fundingGoal: number;
  logoUrl: string | null;
  vantagePoint: number;
  fundability: number;
  investmentReadiness: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  userId: string;
  score: number;
  vantagePoint: number;
  fundability: number;
  investmentReadiness: number;
  stage: string | null;
  categoryScores: Record<string, number>;
  report?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  whopUrl: string | null;
  dotReward: number;
  vantageBoost: number;
  isPublished: boolean;
  coverImageUrl?: string | null;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  status: string;
  completedAt: string | null;
  rewardedAt: string | null;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    description?: string | null;
    whopUrl?: string | null;
    moduleCount?: number;
  };
  progressPct?: number;
}

export interface AppEvent {
  id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  eventDate: string | null;
  dotCost: number;
  capacity: number;
  whopUrl: string | null;
}

export interface Pitchathon {
  id: string;
  title: string;
  description: string | null;
  prize: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  leaderId: string;
  region: string | null;
  category: string | null;
  referralCode: string;
  memberCount?: number;
}

export interface Service {
  id: string;
  builderId: string;
  title: string;
  description: string;
  category: string;
  priceDot: number;
  deliveryDays: number;
  isActive: boolean;
  createdAt: string;
}

export interface JobListing {
  id: string;
  ventureId: string;
  title: string;
  description: string;
  category: string;
  salaryDot: number;
  employmentType: string;
  requirements: string | null;
  isOpen: boolean;
  createdAt: string;
}

export interface ServiceOrder {
  id: string;
  serviceId: string;
  clientId: string;
  builderId: string;
  amountDot: number;
  title: string;
  requirements: string | null;
  deliveryNote: string | null;
  status: "in_progress" | "delivered" | "completed" | "cancelled" | "disputed";
  createdAt: string;
  completedAt: string | null;
}

export interface RoleRequirement {
  role: Exclude<AppRole, "builder" | "admin" | "super_admin">;
  dotCost: number;
  requiredFields: string[];
  description: string | null;
  isActive: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/** Structured error thrown by the API client */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
