/**
 * Wizard state API client — onboarding progress for first-time users.
 */
import { dotApi } from "./client";

export interface WizardState {
  completed: boolean;
  lastStep: number;
  skippedSteps: number[];
  completedAt?: string | null;
  startedAt?: string;
}

export async function fetchWizardState(): Promise<WizardState> {
  return dotApi.get<WizardState>("/api/wizard");
}

export async function completeWizard(): Promise<{ ok: boolean; completedAt: string }> {
  return dotApi.post("/api/wizard/complete", {});
}

export async function skipWizard(step?: number): Promise<{ ok: boolean; completedAt: string }> {
  return dotApi.post("/api/wizard/skip", step !== undefined ? { step } : {});
}

export async function resetWizard(): Promise<{ ok: boolean; completed: boolean; lastStep: number }> {
  return dotApi.post("/api/wizard/reset", {});
}

export async function saveWizardStep(step: number): Promise<{ ok: boolean; lastStep: number }> {
  return dotApi.post("/api/wizard/step", { step });
}
