/**
 * Investments API — wraps /api/investments.
 *
 * Tier 3 / Commitment 3 — Buy Shares flow.
 */
import { dotApi } from "@/api/client";

export interface Investment {
  id: string;
  founderId: string;
  founderName: string | null;
  founderDotId: string | null;
  shares: number;
  sharePriceKobo: number;
  totalPaidDot: string;
  status: "confirmed" | "pending" | "refunded";
  createdAt: string;
}

export interface PortfolioEntry {
  founderId: string;
  founderName: string | null;
  founderDotId: string | null;
  totalShares: number;
  totalSpentDot: number;
  lastPurchaseAt: string;
  purchases: number;
}

export async function getMyInvestments(): Promise<{
  investments: Investment[];
  portfolio: PortfolioEntry[];
}> {
  const res = await dotApi.get<{
    investments: Investment[];
    portfolio: PortfolioEntry[];
  }>("/api/investments/mine");
  return {
    investments: res.investments ?? [],
    portfolio: res.portfolio ?? [],
  };
}

export async function buyShares(input: {
  founderId: string;
  shares: number;
}): Promise<Investment> {
  const res = await dotApi.post<{ ok: true; investment: Investment }>(
    "/api/investments",
    input,
  );
  return res.investment;
}

export async function getVentureInvestors(founderId: string): Promise<{
  investments: Array<{
    id: string;
    investorId: string;
    investorName: string | null;
    shares: number;
    sharePriceKobo: number;
    totalPaidDot: string;
    createdAt: string;
  }>;
  totalShares: number;
  totalRaisedDot: string;
  investorCount: number;
}> {
  const res = await dotApi.get<{
    investments: any[];
    totalShares: number;
    totalRaisedDot: string;
    investorCount: number;
  }>(`/api/investments/venture/${founderId}`);
  return {
    investments: res.investments ?? [],
    totalShares: res.totalShares ?? 0,
    totalRaisedDot: res.totalRaisedDot ?? "0",
    investorCount: res.investorCount ?? 0,
  };
}