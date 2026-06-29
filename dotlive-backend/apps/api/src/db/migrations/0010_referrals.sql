-- 0010_referrals.sql
-- Adds referral system columns to users table.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by text,
  ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_earnings_dot numeric(20,2) NOT NULL DEFAULT 0;