-- 0014_tier_upgrades.sql
-- Paid, time-limited tier upgrades.
--
-- Builder tier is the free default.
-- Founder and Capital Partner tiers can be purchased with DOT for 365 days.
--
-- Idempotent — safe to re-run.

-- 1) tier_upgrades table
CREATE TABLE IF NOT EXISTS tier_upgrades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('founder', 'capital_partner')),
  cost_dot numeric(20,2) NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  renewed_from uuid REFERENCES tier_upgrades(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tier_upgrades_user_idx
  ON tier_upgrades(user_id, status);
CREATE INDEX IF NOT EXISTS tier_upgrades_expires_idx
  ON tier_upgrades(expires_at) WHERE status = 'active';

-- 2) users.tier_expires_at (denormalized mirror for fast "am I active?" checks)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tier_expires_at timestamptz;
