import { dotApi } from "@/api/client";
/**
 * Vantage API — wraps the Fastify /api/vantage/* endpoints.
 */
import type { Assessment } from "@/types/api";

export interface VantageSubmitResult {
  assessment: Assessment;
}

export interface VantageSubmitInput {
  answers: Record<string, number | string>;
  categoryScores: Record<string, number>;
  score: number;
  vantagePoint: number;
  fundability: number;
  investmentReadiness: number;
  stage?: string;
  report?: {
    strengths?: { label: string; score: number }[];
    weaknesses?: { label: string; score: number }[];
    nextActions?: string[];
    stage?: string;
  };
}

export async function submitAssessment(input: VantageSubmitInput): Promise<Assessment> {
  const payload = {
    answers: input.answers,
    categoryScores: input.categoryScores,
    vantagePoint: input.vantagePoint,
    fundability: input.fundability,
    investmentReadiness: input.investmentReadiness,
    stage: input.stage,
    report: input.report,
  };
  const res = await dotApi.post<VantageSubmitResult>("/api/vantage/submit", payload);
  return res.assessment;
}

export async function getVantageHistory(): Promise<Assessment[]> {
  const res = await dotApi.get<{ assessments: Assessment[] }>("/api/vantage/history");
  return res.assessments ?? [];
}

export interface CanRetake {
  canRetake: boolean;
  nextRetakeAt: string | null;
}
export async function canRetakeVantage(): Promise<CanRetake> {
  return dotApi.get<CanRetake>("/api/vantage/can-retake");
}

export interface VantageStatus {
  hasTakenTest: boolean;
  daysSinceSignup: number;
  isOverdue: boolean;
}
export async function getVantageStatus(): Promise<VantageStatus> {
  return dotApi.get<VantageStatus>("/api/vantage/status");
}
