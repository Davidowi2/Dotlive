import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MIN_DEPOSIT_DOT = 2000;

const initInput = z.object({
  dotAmount: z.number().int().min(MIN_DEPOSIT_DOT),
  callbackUrl: z.string().url().optional(),
});

const verifyInput = z.object({
  reference: z.string().min(6).max(120),
});

function makeReference(userId: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `dot_${userId.slice(0, 8)}_${Date.now()}_${rand}`;
}

/**
 * Step 1 — initiate a Paystack deposit via the Fastify backend.
 */
export const initPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => initInput.parse(data))
  .handler(async ({ data }) => {
    const token = (await import("@/api/client")).getToken();
    if (!token) throw new Error("Not authenticated");

    const reference = makeReference((await import("@/api/client")).getToken() ?? "");

    const res = await fetch(
      `${(await import("@/api/client")).BASE_URL}/api/payments/deposit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amountDot: data.dotAmount,
          callbackUrl: data.callbackUrl,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `Failed with ${res.status}` }));
      throw new Error((body as { error?: string }).error ?? "Deposit failed");
    }

    return (await res.json()) as {
      authorization_url: string;
      reference: string;
      amountDot: number;
      amountNaira: number;
    };
  });

/**
 * Step 2 — verify a deposit by looking up the payment row via backend.
 */
export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifyInput.parse(data))
  .handler(async ({ data }) => {
    const token = (await import("@/api/client")).getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `${(await import("@/api/client")).BASE_URL}/api/payments?reference=${encodeURIComponent(data.reference)}`,
      {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `Failed with ${res.status}` }));
      throw new Error((body as { error?: string }).error ?? "Verify failed");
    }

    const body = (await res.json()) as {
      payments: Array<{
        reference: string;
        status: string;
        dotAmount: string;
        createdAt: string;
        creditedAt?: string;
      }>;
    };
    const payment = body.payments.find((p) => p.reference === data.reference);
    if (!payment) throw new Error("Payment not found");

    return {
      status: (payment.status === "success" ? "success" : "failed") as "success" | "failed",
      balance: 0,
      dotAmount: Number(payment.dotAmount ?? 0),
      reference: payment.reference,
      createdAt: payment.createdAt,
    };
  });
