/**
 * Vantage API — wraps the Fastify /api/vantage/* endpoints.
 */
import { dotApi } from "./client";
import type { Assessment } from "@/types/api";

export interface VantageSubmitResult {
  assessment: Assessment;
}

export async function submitAssessment(answers: Record<string, number>): Promise<Assessment> {
  const res = await dotApi.post<VantageSubmitResult>("/api/vantage/submit", { answers });
  return res.assessment;
}

export async function getVantageHistory(): Promise<Assessment[]> {
  const res = await dotApi.get<{ assessments: Assessment[] }>("/api/vantage/history");
  return res.assessments ?? [];
}
