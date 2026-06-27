import { dotApi } from "@/api/client";
/**
 * Wallet API — wraps the Fastify /api/wallet/* endpoints.
 */

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

/* ────────────────────────── Withdrawals ────────────────────────── */

export type WithdrawalStatus = "pending" | "approved" | "rejected" | "processing" | "completed";

export interface WithdrawalRequest {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: WithdrawalStatus;
  reason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  completedAt?: string | null;
}

export interface WithdrawalInput {
  amount: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

/** Request a new withdrawal (must be KYC approved). */
export async function requestWithdrawal(
  input: WithdrawalInput
): Promise<{ ok: boolean; withdrawal: WithdrawalRequest }> {
  return dotApi.post("/api/wallet/withdraw", input);
}

/** Fetch the current user's withdrawal history. */
export async function getWithdrawals(): Promise<WithdrawalRequest[]> {
  const res = await dotApi.get<{ withdrawals: WithdrawalRequest[] }>(
    "/api/wallet/withdrawals",
  );
  return res.withdrawals ?? [];
}

/** Verify a Nigerian bank account (name-enquiry) — used by the form. */
export async function verifyBankAccount(
  bankCode: string,
  accountNumber: string,
): Promise<{ accountName: string }> {
  return dotApi.post("/api/wallet/verify-bank-account", {
    bankCode,
    accountNumber,
  });
}

/** List of supported Nigerian banks for the picker. */
export interface Bank {
  code: string;
  name: string;
}

export async function listBanks(): Promise<Bank[]> {
  return dotApi.get<Bank[]>("/api/wallet/banks");
}

