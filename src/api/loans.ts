/**
 * Loans API client
 */
import { dotApi } from "./client";

export interface LoanRequest {
  id: string;
  ventureId: string;
  requestedBy: string;
  founderName?: string;
  founderDotId?: string;
  ventureName?: string;
  amountNaira: number;
  termMonths: number;
  purpose?: string;
  status: string;
  createdAt: string;
  votingEndsAt?: string;
}

export interface LoanVote {
  id: string;
  loanRequestId: string;
  voterId: string;
  voterName?: string;
  vote: boolean;
  amountNaira?: number;
  votedAt: string;
}

export interface LoanRequestWithVotes extends LoanRequest {
  votes: LoanVote[];
  approvals: number;
  rejections: number;
  totalVotes: number;
}

export interface Loan {
  id: string;
  loanRequestId?: string;
  ventureId: string;
  ventureName?: string;
  amountNaira: number;
  termMonths: number;
  interestRate: number;
  status: string;
  fundedBy: string;
  fundedByName?: string;
  createdAt: string;
}

export async function getLoanRequests(status?: string): Promise<{ requests: LoanRequest[] }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.toString();
  return dotApi.get(`/api/loans/requests${qs ? "?" + qs : ""}`);
}

export async function getLoanRequest(id: string): Promise<LoanRequestWithVotes> {
  const res = await dotApi.get<LoanRequestWithVotes>(`/api/loans/requests/${id}`);
  return res;
}

export async function createLoanRequest(data: {
  ventureId: string;
  amountNaira: number;
  termMonths: number;
  purpose?: string;
}): Promise<{ ok: boolean; requestId: string }> {
  return dotApi.post("/api/loans/requests", data);
}

export async function voteOnLoanRequest(
  id: string,
  data: { vote: boolean; amountNaira?: number }
): Promise<{ ok: boolean }> {
  return dotApi.post(`/api/loans/requests/${id}/vote`, data);
}

export async function getMyLoans(): Promise<{ loans: Loan[]; requests: LoanRequest[] }> {
  return dotApi.get("/api/loans/my");
}
