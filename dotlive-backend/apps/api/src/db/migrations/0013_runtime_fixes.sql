-- 0013_runtime_fixes.sql
-- Fix missing tables and columns causing 500 errors.
-- Idempotent — safe to re-run.

-- 1) Notifications: add is_archived column (used by code, missing in 0009)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS notifications_archived_idx
  ON notifications(user_id, is_archived);

-- 2) Users: add headline column for leaderboard
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3) dot_stake_positions table
CREATE TABLE IF NOT EXISTS dot_stake_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venture_id uuid REFERENCES ventures(id) ON DELETE CASCADE,
  position_type text NOT NULL DEFAULT 'dot',
  amount numeric(20,2) NOT NULL DEFAULT 0,
  staked_at timestamptz NOT NULL DEFAULT now(),
  unstaked_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dot_stake_positions_user_idx
  ON dot_stake_positions(user_id, status);

-- 4) meeting_slots table
CREATE TABLE IF NOT EXISTS meeting_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text NOT NULL DEFAULT 'available',
  title text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meeting_slots_host_idx ON meeting_slots(host_id, date);
CREATE INDEX IF NOT EXISTS meeting_slots_date_idx ON meeting_slots(date);
CREATE INDEX IF NOT EXISTS meeting_slots_status_idx ON meeting_slots(status);

-- 5) meetings table (booked meetings)
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES meeting_slots(id) ON DELETE CASCADE,
  host_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meetings_host_idx ON meetings(host_id);
CREATE INDEX IF NOT EXISTS meetings_guest_idx ON meetings(guest_id);

-- 6) page_views table (analytics)
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  viewer_id text REFERENCES users(id) ON DELETE SET NULL,
  page_type text NOT NULL,
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS page_views_user_idx ON page_views(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_viewer_idx ON page_views(viewer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS page_views_page_type_idx ON page_views(page_type, created_at);

-- 7) activity_log table (analytics)
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_log_user_idx ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_action_idx ON activity_log(action, created_at);

-- 8) Dividends
CREATE TABLE IF NOT EXISTS dividends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid REFERENCES ventures(id) ON DELETE CASCADE,
  recipient_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(20,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dividends_recipient_idx ON dividends(recipient_id, created_at DESC);

-- 9) Loans
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(20,2) NOT NULL,
  term_months integer NOT NULL,
  interest_rate numeric(5,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  purpose text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loans_user_idx ON loans(user_id, created_at DESC);

-- 10) pitch_decks
CREATE TABLE IF NOT EXISTS pitch_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venture_id uuid REFERENCES ventures(id) ON DELETE SET NULL,
  title text NOT NULL,
  slides jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pitch_decks_user_idx ON pitch_decks(user_id, created_at DESC);
