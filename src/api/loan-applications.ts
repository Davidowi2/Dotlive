/**
 * Loan Applications API client
 */

import { dotApi } from "./client";

export interface LoanApplication {
  id: string;
  userId: string;
  legalName: string;
  countryOfResidence: string;
  phoneNumber: string;
  nationalId: string;
  dateOfBirth: string;
  sourceOfIncome: string;
  ventureName: string;
  businessRegNumber: string;
  countryOfRegistration: string;
  monthlyRevenue: number;
  monthlyExpenses: number;
  outstandingDebts: string;
  amountRequested: number;
  purpose: string;
  repaymentPeriodMonths: number;
  collateral?: string;
  revenueProofUrl?: string;
  expenseProofUrl?: string;
  termsAccepted: boolean;
  fraudAcknowledged: boolean;
  verificationAuthorized: boolean;
  status: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanEligibility {
  eligible: boolean;
  reason?: string;
}

export async function getLoanEligibility(): Promise<LoanEligibility> {
  return dotApi.get("/api/loans/eligibility");
}

export async function submitLoanApplication(
  data: Omit<LoanApplication, "id" | "status" | "createdAt" | "updatedAt" | "reviewedBy" | "reviewedAt" | "adminNotes">,
): Promise<{ application: LoanApplication }> {
  return dotApi.post("/api/loans/applications", data);
}

export async function getMyLoanApplications(): Promise<{ applications: LoanApplication[] }> {
  return dotApi.get("/api/loans/applications/mine");
}

/* ── Admin loan operations ─────────────────────────── */

export async function getLoanApplications(opts?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ applications: LoanApplication[] }> {
  const q = new URLSearchParams();
  if (opts?.status) q.set("status", opts.status);
  if (opts?.limit) q.set("limit", String(opts.limit));
  if (opts?.offset) q.set("offset", String(opts.offset));
  const qs = q.toString();
  return dotApi.get(`/api/loans/admin/applications${qs ? `?${qs}` : ""}`);
}

export async function approveLoanApplication(
  applicationId: string,
  adminNotes?: string
): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/loans/admin/applications/${applicationId}/approve`, {
    adminNotes,
  });
}

export async function declineLoanApplication(
  applicationId: string,
  adminNotes?: string
): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/loans/admin/applications/${applicationId}/decline`, {
    adminNotes,
  });
}

export async function requestLoanInfo(
  applicationId: string,
  infoRequested: string
): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/loans/admin/applications/${applicationId}/request-info`, {
    infoRequested,
  });
}
