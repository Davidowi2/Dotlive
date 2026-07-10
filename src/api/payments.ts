import { dotApi } from "@/api/client";

export interface Payment {
  id: string;
  userId: string;
  reference: string;
  dotAmount: string;
  nairaAmount: string;
  status: string;
  paidAt?: string;
  creditedAt?: string;
  createdAt: string;
}

/**
 * Get payment config (public key, rate, etc.)
 */
export async function getPaymentConfig() {
  return dotApi.get("/api/payments/config");
}

/**
 * Get payment by ID
 */
export async function getPayment(id: string): Promise<Payment> {
  const res = await dotApi.get<{ payment: Payment }>(`/api/payments/${id}`);
  return res.payment;
}

/**
 * Get payment by reference
 */
export async function getPaymentByReference(reference: string): Promise<Payment | null> {
  const res = await dotApi.get<{ payments: Payment[] }>("/api/payments");
  return res.payments.find(p => p.reference === reference) ?? null;
}

/**
 * Replay payment verification (force check and credit if pending)
 */
export async function replayPayment(id: string): Promise<Payment> {
  const res = await dotApi.post<{ payment: Payment }>(`/api/payments/${id}/replay`);
  return res.payment;
}

/**
 * Get all user's payments
 */
export async function getPayments(): Promise<Payment[]> {
  const res = await dotApi.get<{ payments: Payment[] }>("/api/payments");
  return res.payments;
}
