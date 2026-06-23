-- ================================================================
-- FIX: handle_new_user trigger + auto-assign builder role on signup
-- ================================================================
-- Recreates the trigger function to also assign 'builder' role
-- by default. Idempotent — safe to run multiple times.
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile row
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create wallet with zero balance
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Auto-assign builder as default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'builder')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- PHASE 2: role_requirements table for upgrade system
-- ================================================================

CREATE TABLE IF NOT EXISTS public.role_requirements (
  role app_role PRIMARY KEY,
  dot_cost INTEGER NOT NULL DEFAULT 0,
  required_fields JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_requirements TO authenticated;
GRANT ALL ON public.role_requirements TO service_role;
ALTER TABLE public.role_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role requirements viewable by authenticated"
  ON public.role_requirements FOR SELECT TO authenticated USING (true);

-- Insert role upgrade requirements
INSERT INTO public.role_requirements (role, dot_cost, required_fields, description) VALUES
  ('founder', 2000, '["venture_name","industry","stage","bio","country"]',
    'Build and progress your venture. Access Vantage, Academy, Pitchathons and DOT Demo.'),
  ('investor', 10000, '["investment_range","industries","ticket_size"]',
    'Discover and fund African ventures. Browse Vantage-ranked founders and request meetings.'),
  ('community_leader', 1000, '["community_name","region","category"]',
    'Launch and grow a founder community. Earn DOT rewards for activating builders.'),
  ('vendor', 5000, '["company_name","industry","bio"]',
    'Offer products and services to the DOT network. Post in the marketplace.'),
  ('capital_partner', 50000, '["firm_name","aum","focus_areas"]',
    'Full investor dashboard with capital partner features and portfolio tracking.')
ON CONFLICT (role) DO UPDATE
  SET dot_cost = EXCLUDED.dot_cost,
      required_fields = EXCLUDED.required_fields,
      description = EXCLUDED.description,
      updated_at = now();

-- ================================================================
-- PHASE 3: upgrade_role RPC
-- ================================================================

CREATE OR REPLACE FUNCTION public.upgrade_role(_target_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _cost INTEGER;
  _current_balance NUMERIC;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Prevent upgrading to admin/super_admin via this function
  IF _target_role IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Cannot self-upgrade to admin roles';
  END IF;

  -- Already has the role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = _target_role) THEN
    RETURN TRUE;
  END IF;

  -- Get requirement
  SELECT dot_cost INTO _cost
  FROM public.role_requirements
  WHERE role = _target_role AND is_active = true;

  IF _cost IS NULL THEN
    RAISE EXCEPTION 'Role upgrade not available for %', _target_role;
  END IF;

  -- Check balance
  SELECT balance INTO _current_balance FROM public.wallets WHERE user_id = _uid;
  IF COALESCE(_current_balance, 0) < _cost THEN
    RAISE EXCEPTION 'Insufficient DOT balance. Need % DOT, have % DOT', _cost, COALESCE(_current_balance, 0);
  END IF;

  -- Deduct DOT
  UPDATE public.wallets SET balance = balance - _cost WHERE user_id = _uid;

  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (_uid, -_cost, 'Role Upgrade', 'Upgraded to ' || _target_role::text);

  -- Grant role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, _target_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upgrade_role(app_role) TO authenticated;
