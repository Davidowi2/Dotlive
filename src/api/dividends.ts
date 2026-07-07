/**
 * Dividends API client
 */
import { dotApi } from "./client";

export interface Dividend {
  id: string;
  ventureId: string;
  ventureName?: string;
  declaredBy: string;
  declaredByName?: string;
  amountNaira: number;
  perShareAmount: number;
  period: string;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export interface DividendPayment {
  id: string;
  dividendId: string;
  investorId: string;
  sharesOwned: number;
  amountNaira: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  // With dividend details
  period?: string;
  ventureId?: string;
  ventureName?: string;
}

export async function listDividends(): Promise<{ dividends: Dividend[] }> {
  return dotApi.get("/api/dividends");
}

export async function getDividendsByVenture(ventureId: string): Promise<{ dividends: Dividend[] }> {
  return dotApi.get(`/api/dividends/venture/${ventureId}`);
}

export async function getMyDividends(): Promise<{
  payments: DividendPayment[];
  totalEarnedNaira: number;
  totalPendingNaira: number;
}> {
  return dotApi.get("/api/dividends/my");
}

export async function declareDividend(data: {
  ventureId: string;
  amountNaira: number;
  period: string;
}): Promise<{
  ok: boolean;
  dividend: {
    id: string;
    ventureId: string;
    amountNaira: number;
    perShareAmount: number;
    period: string;
    totalShares: number;
    investorCount: number;
  };
}> {
  return dotApi.post("/api/dividends", data);
}

export async function markDividendAsPaid(dividendId: string): Promise<{
  ok: boolean;
  paid: number;
  failed: number;
  total: number;
}> {
  return dotApi.post(`/api/dividends/${dividendId}/pay`, {});
}
