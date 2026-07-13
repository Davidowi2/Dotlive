/**
 * Admin-side API client for Whop + Academy.
 *
 *   listAdminCourses / createAdminCourse / updateAdminCourse / deleteAdminCourse
 *   fireTestWebhook
 *   getIntegrations / setIntegration
 */
import { dotApi } from "@/api/client";

/* ────────────── Course management ────────────── */
export interface AdminCourse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  whopUrl: string | null;
  whopProductId: string | null;
  dotReward: number;
  vantageBoost: number;
  isPublished: boolean;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export async function listAdminCourses(): Promise<AdminCourse[]> {
  const res = await dotApi.get<{ courses: AdminCourse[] } | { error: string }>("/api/admin/courses");
  if ("error" in res) throw new Error(res.error);
  return res.courses ?? [];
}

export type CourseInput = Partial<{
  title: string;
  description: string | null;
  category: string | null;
  whopUrl: string | null;
  whopProductId: string | null;
  dotReward: number;
  vantageBoost: number;
  isPublished: boolean;
  coverImageUrl?: string | null;
}>;

export async function createAdminCourse(input: CourseInput): Promise<AdminCourse> {
  const res = await dotApi.post<{ course: AdminCourse }>("/api/admin/courses", input);
  return res.course;
}

export async function updateAdminCourse(
  id: string,
  input: CourseInput
): Promise<AdminCourse> {
  const res = await dotApi.patch<{ course: AdminCourse }>(`/api/admin/courses/${id}`, input);
  return res.course;
}

export async function deleteAdminCourse(id: string): Promise<void> {
  await dotApi.delete(`/api/admin/courses/${id}`);
}

/* ────────────── Test webhook ────────────── */
export interface TestWebhookInput {
  userId?: string;
  whopProductId?: string | null;
  amountUsdCents?: number;
  eventId?: string;
}
export interface TestWebhookResult {
  ok: boolean;
  credited: { userId: string; dot: number; cents: number };
  enrollment: { courseId: string; courseTitle: string } | null;
  eventId: string;
}
export async function fireTestWebhook(input: TestWebhookInput): Promise<TestWebhookResult> {
  return dotApi.post<TestWebhookResult>("/api/admin/test-webhook", input);
}

/* ────────────── Integrations (Whop secrets) ────────────── */
export type IntegrationKey = "whop_api_key" | "whop_webhook_secret";

export interface IntegrationState {
  set: boolean;
  preview: string;
  updatedAt: string | null;
}
export interface Integrations {
  whop_api_key: IntegrationState;
  whop_webhook_secret: IntegrationState;
}

export async function getIntegrations(): Promise<Integrations> {
  const res = await dotApi.get<{ integrations: Integrations }>("/api/admin/integrations");
  return res.integrations;
}

export async function setIntegration(key: IntegrationKey, value: string): Promise<void> {
  await dotApi.put(`/api/admin/integrations/${key}`, { value });
}
