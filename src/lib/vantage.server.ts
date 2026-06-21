import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeVantage, VANTAGE_CATEGORIES, type VantageAnswers } from "./vantage";

/**
 * Valid question IDs — built from the canonical VANTAGE_CATEGORIES list.
 * Any answer key not in this set is rejected.
 */
const VALID_IDS = new Set(
  VANTAGE_CATEGORIES.flatMap((c) => c.questions.map((q) => q.id)),
);

/**
 * Input schema — raw answers only. The client submits question IDs
 * mapped to 1–5 ratings. Scoring happens entirely server-side.
 */
const submitInput = z.object({
  answers: z
    .record(z.string(), z.number().int().min(1).max(5))
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
 * submitVantageAssessment
 *
 * Replaces the previous client-side computeVantage() + direct DB insert.
 * The client sends raw answers (question IDs → 1–5 values) and the server:
 *   1. Validates every answer key against the canonical question list
 *   2. Calls computeVantage() to produce the score
 *   3. Writes the result to assessments using the admin client
 *   4. Updates founder_profiles with the new scores
 *   5. Returns the computed result to the client for display
 *
 * This prevents DevTools manipulation of scores before submission.
 */
export const submitVantageAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const answers = data.answers as VantageAnswers;
    const result = computeVantage(answers);

    const { error: insertErr } = await supabaseAdmin.from("assessments").insert({
      user_id: userId,
      answers,
      category_scores: result.categoryScores,
      score: result.score,
      vantage_point: result.vantagePoint,
      fundability: result.fundability,
      investment_readiness: result.investmentReadiness,
      stage: result.stage,
      report: result.report,
    });
    if (insertErr) throw new Error(insertErr.message);

    const { error: updateErr } = await supabaseAdmin
      .from("founder_profiles")
      .update({
        vantage_point: result.vantagePoint,
        fundability: result.fundability,
        investment_readiness: result.investmentReadiness,
        stage: result.stage,
      })
      .eq("user_id", userId);
    if (updateErr) throw new Error(updateErr.message);

    return result;
  });
