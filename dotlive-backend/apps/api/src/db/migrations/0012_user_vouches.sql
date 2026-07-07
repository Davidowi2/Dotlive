-- 0012_user_vouches.sql
-- Vouch primitive — users vouch each other's credibility.
-- Adds a single `user_vouches` table with the unique-pair invariant.
-- Idempotent (safe to re-run).

CREATE TABLE IF NOT EXISTS user_vouches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vouchee_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('founder', 'builder', 'capital')),
  score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One vouch per (voucher, vouchee) pair.
CREATE UNIQUE INDEX IF NOT EXISTS user_vouches_pair_unique
  ON user_vouches (voucher_id, vouchee_id);

CREATE INDEX IF NOT EXISTS user_vouches_voucher_idx
  ON user_vouches (voucher_id);

CREATE INDEX IF NOT EXISTS user_vouches_vouchee_idx
  ON user_vouches (vouchee_id);
