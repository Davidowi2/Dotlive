import { api } from "./client.js";
import type { Transaction } from "@dotlive/shared";

export const walletApi = {
  balance: () => api.get<{ balance: number }>("/api/wallet"),
  transactions: () => api.get<{ transactions: Transaction[] }>("/api/wallet/transactions"),
  transfer: (toDotId: string, amount: number, description?: string) =>
    api.post<{ fromBalance: number; toBalance: number }>("/api/wallet/transfer", {
      toDotId,
      amount,
      description,
    }),
};
