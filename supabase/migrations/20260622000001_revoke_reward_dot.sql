-- ============================================================
-- SECURITY: Revoke self-award exploit on reward_dot
-- ============================================================
-- reward_dot(_amount, _description) was previously callable by
-- any authenticated user, allowing unlimited self-awarded DOT.
-- It is now restricted to service_role only (used by trusted
-- server-side admin functions, never directly by clients).
-- The claim_course_reward RPC (used by Academy) is the correct
-- path for user-facing rewards and is already properly gated.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.reward_dot(numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reward_dot(numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reward_dot(numeric, text) FROM authenticated;

-- service_role retains access for internal admin operations
GRANT EXECUTE ON FUNCTION public.reward_dot(numeric, text) TO service_role;
