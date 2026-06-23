-- ============================================================
-- Phase 8 polish — onboarding intent capture
-- ============================================================
-- Adds a column to capture WHY a user signed up so we can
-- personalize their dashboard, suggestions, and follow-up
-- flows. The 'intent' is plain text (no enum) so the product
-- team can add reasons without a migration.
--
-- We also add invite_code on users so the "I was invited"
-- path can credit the inviter.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_intent TEXT,
  ADD COLUMN IF NOT EXISTS invited_by TEXT REFERENCES users(dot_id),
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_intent_idx ON users(onboarding_intent);
