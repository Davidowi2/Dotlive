import { dotApi } from "@/api/client";
/**
 * Vantage API — wraps the Fastify /api/vantage/* endpoints.
 */
import type { Assessment } from "@/types/api";

export interface VantageSubmitResult {
  assessment: Assessment;
}

export interface VantageSubmitInput {
  answers: Record<string, number>;
  categoryScores: Record<string, number>;
  score: number;
  vantagePoint: number;
  fundability: number;
  investmentReadiness: number;
  stage?: string;
}

export async function submitAssessment(input: VantageSubmitInput): Promise<Assessment> {
  const res = await dotApi.post<VantageSubmitResult>("/api/vantage/submit", input);
  return res.assessment;
}

export async function getVantageHistory(): Promise<Assessment[]> {
  const res = await dotApi.get<{ assessments: Assessment[] }>("/api/vantage/history");
  return res.assessments ?? [];
}
