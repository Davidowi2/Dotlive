import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeVantage, VANTAGE_CATEGORIES, type VantageAnswers } from "./vantage";

const VALID_IDS = new Set(
  VANTAGE_CATEGORIES.flatMap((c) => c.questions.map((q) => q.id)),
);

const submitInput = z.object({
  answers: z
    .record(z.string(), z.number().int().min(1).max(5)))
    .refine(
      (a) => Object.keys(a).every((k) => VALID_IDS.has(k)),
      { message: "Answer contains unknown question ID" },
    )
    .refine(
      (a) => Object.keys(a).length === VALID_IDS.size,
      { message: `Expected ${VALID_IDS.size} answers, got a different count` },
    ),
});

/**
 * Submit Vantage assessment.
 *
 * Calls POST /api/vantage/submit with our custom JWT auth.
 */
export const submitVantageAssessment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }) => {
    const token = (await import("@/api/client")).getToken();
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(
      `${(await import("@/api/client")).BASE_URL}/api/vantage/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers: data.answers }),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `Failed with ${res.status}` }));
      throw new Error((body as { error?: string }).error ?? "Submit failed");
    }

    return (await res.json()) as unknown;
  });
