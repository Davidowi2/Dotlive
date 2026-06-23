/**
 * Wallet API — wraps the Fastify /api/wallet/* endpoints.
 */

import { dotApi } from "./client";
import type { Transaction } from "@/types/api";

export interface WalletBalance {
  balance: number;
}

export interface TransferResult {
  fromBalance: number;
  toBalance: number;
}

/**
 * Get the current user's wallet balance.
 */
export async function getBalance(): Promise<WalletBalance> {
  return dotApi.get<WalletBalance>("/api/wallet");
}

/**
 * Get the current user's transaction history.
 */
export async function getTransactions(): Promise<Transaction[]> {
  const res = await dotApi.get<{ transactions: Transaction[] }>("/api/wallet/transactions");
  return res.transactions;
}

/**
 * Transfer DOT to another user by their DOT ID.
 */
export async function transfer(
  toDotId: string,
  amount: number,
  description?: string
): Promise<TransferResult> {
  return dotApi.post<TransferResult>("/api/wallet/transfer", {
    toDotId,
    amount,
    description,
  });
}
