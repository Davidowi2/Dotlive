-- Add missing investor_profiles table
CREATE TABLE IF NOT EXISTS investor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  investment_capacity DECIMAL(15, 2),
  investment_focus TEXT,
  risk_appetite TEXT CHECK (risk_appetite IN ('low', 'medium', 'high')),
  preferred_sectors TEXT[],
  accredited_investor BOOLEAN DEFAULT false,
  total_invested DECIMAL(15, 2) DEFAULT 0,
  active_investments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add missing capital_partner_profiles table
CREATE TABLE IF NOT EXISTS capital_partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT,
  organization_type TEXT,
  capital_available DECIMAL(15, 2),
  investment_criteria TEXT,
  sectors_of_interest TEXT[],
  minimum_investment DECIMAL(15, 2),
  maximum_investment DECIMAL(15, 2),
  geographical_focus TEXT[],
  total_deployed DECIMAL(15, 2) DEFAULT 0,
  active_partnerships INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_investor_profiles_user_id ON investor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_capital_partner_profiles_user_id ON capital_partner_profiles(user_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_investor_profiles_updated_at
    BEFORE UPDATE ON investor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capital_partner_profiles_updated_at
    BEFORE UPDATE ON capital_partner_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
