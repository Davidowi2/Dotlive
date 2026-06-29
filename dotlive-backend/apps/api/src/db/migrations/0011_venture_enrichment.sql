-- 0011_venture_enrichment.sql
-- Founder profile enrichment (post direction: 11 table fields).
-- Adds 4 new tables. Idempotent.

CREATE TABLE IF NOT EXISTS venture_details (
  venture_id uuid PRIMARY KEY REFERENCES ventures(id) ON DELETE CASCADE,
  one_liner text,
  problem text,
  solution text,
  traction_mrr numeric(20,2) NOT NULL DEFAULT 0,
  traction_paying_users integer NOT NULL DEFAULT 0,
  traction_growth_pct integer NOT NULL DEFAULT 0,
  traction_retention_pct integer NOT NULL DEFAULT 0,
  use_of_funds text,
  cap_table_total_raised numeric(20,2) NOT NULL DEFAULT 0,
  cap_table_last_round text,
  cap_table_structure text,
  pitch_deck_url text,
  founding_date date,
  stage_rationale text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venture_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  linkedin_url text,
  is_founder boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venture_team_members_venture_idx ON venture_team_members(venture_id);

CREATE TABLE IF NOT EXISTS venture_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  achieved_at date,
  is_upcoming boolean NOT NULL DEFAULT false,
  target_date date,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venture_milestones_venture_idx ON venture_milestones(venture_id);

CREATE TABLE IF NOT EXISTS venture_advisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id uuid NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name text NOT NULL,
  credentials text,
  linkedin_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venture_advisors_venture_idx ON venture_advisors(venture_id);
