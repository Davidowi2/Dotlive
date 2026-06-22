-- ================================================================
-- ISSUE 2 (MEDIUM): job_listings table for the Jobs tab on /work
-- ================================================================
-- Only founders (venture owners) can post jobs.
-- Anyone authenticated can browse open listings.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.job_listings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description     TEXT        NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  category        TEXT        NOT NULL,
  salary_dot      NUMERIC     NOT NULL CHECK (salary_dot > 0),
  employment_type TEXT        NOT NULL DEFAULT 'full_time'
                              CHECK (employment_type IN ('full_time','part_time','contract','internship')),
  requirements    TEXT,
  is_open         BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON public.job_listings(category) WHERE is_open = true;
CREATE INDEX IF NOT EXISTS idx_job_listings_venture  ON public.job_listings(venture_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_open     ON public.job_listings(created_at DESC) WHERE is_open = true;

-- Grants
GRANT SELECT                        ON public.job_listings TO authenticated;
GRANT INSERT, UPDATE, DELETE        ON public.job_listings TO authenticated;
GRANT ALL                           ON public.job_listings TO service_role;

-- RLS
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read open listings
CREATE POLICY "Open jobs viewable by authenticated"
  ON public.job_listings
  FOR SELECT
  TO authenticated
  USING (is_open = true);

-- Ventures (founders) can read their own closed/draft listings too
CREATE POLICY "Ventures can view own listings"
  ON public.job_listings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = venture_id);

-- Only the venture owner can insert/update/delete their own listings
-- AND only if they have the 'founder' role (enforced via has_role helper)
CREATE POLICY "Ventures manage own jobs"
  ON public.job_listings
  FOR ALL
  TO authenticated
  USING  (auth.uid() = venture_id AND public.has_role(auth.uid(), 'founder'))
  WITH CHECK (auth.uid() = venture_id AND public.has_role(auth.uid(), 'founder'));

-- Auto-update updated_at
CREATE TRIGGER trg_job_listings_updated
  BEFORE UPDATE ON public.job_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
