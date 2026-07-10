-- 0014_meetings_schema_drift.sql
-- Bring the live `meetings` table up to date with `src/db/schema.ts`.
-- The original `0013_runtime_fixes.sql` declared the table without the
-- lifecycle columns the route handler reads (`meeting_reason`,
-- `confirmed_at`, `declined_at`, `declined_reason`, `cancelled_at`,
-- `cancelled_reason`, `completed_at`, `updated_at`), which surfaced as
-- 500s on /api/meetings with `column meetings.meeting_reason does not exist`.
--
-- Idempotent — safe to re-run.
--
-- Pattern matches the discover/feed fix: explicit ALTER statements rather
-- than relying on the in-process bootstrap in server.ts.

-- 1) Add the missing lifecycle columns
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS meeting_reason  text,
  ADD COLUMN IF NOT EXISTS confirmed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at     timestamptz,
  ADD COLUMN IF NOT EXISTS declined_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at    timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_reason text,
  ADD COLUMN IF NOT EXISTS completed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- 2) Backfill updated_at for any rows created before this migration
UPDATE meetings
   SET updated_at = COALESCE(confirmed_at, declined_at, cancelled_at, completed_at, created_at, now())
 WHERE updated_at IS NULL;

-- 3) Indexes the schema.ts expects. CREATE INDEX IF NOT EXISTS is a no-op
--    if the index already exists, so re-running is safe.
CREATE INDEX IF NOT EXISTS meetings_slot_idx   ON meetings (slot_id);
CREATE INDEX IF NOT EXISTS meetings_host_idx  ON meetings (host_id, scheduled_at);
CREATE INDEX IF NOT EXISTS meetings_guest_idx ON meetings (guest_id, scheduled_at);
CREATE INDEX IF NOT EXISTS meetings_status_idx ON meetings (status);
