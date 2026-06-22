-- ================================================================
-- ISSUE 4 (LOW): Rate limit on upgrade_role()
-- ================================================================
-- Adds a 10-second cooldown between upgrade_role() calls.
-- Uses the transactions ledger as source of truth — no extra table.
-- ================================================================

CREATE OR REPLACE FUNCTION public.upgrade_role(_target_role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid             UUID    := auth.uid();
  _cost            INTEGER;
  _current_balance NUMERIC;
  _last_upgrade    TIMESTAMPTZ;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Prevent upgrading to admin/super_admin via this function
  IF _target_role IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Cannot self-upgrade to admin roles';
  END IF;

  -- Already has the role — idempotent success
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = _target_role
  ) THEN
    RETURN TRUE;
  END IF;

  -- ── Rate limit: 10-second cooldown ──────────────────────────────
  SELECT MAX(created_at) INTO _last_upgrade
  FROM public.transactions
  WHERE user_id = _uid
    AND type = 'Role Upgrade'
    AND created_at > now() - interval '10 seconds';

  IF _last_upgrade IS NOT NULL THEN
    RAISE EXCEPTION 'Please wait a moment before upgrading again';
  END IF;

  -- Get role requirement (cost)
  SELECT dot_cost INTO _cost
  FROM public.role_requirements
  WHERE role = _target_role AND is_active = true;

  IF _cost IS NULL THEN
    RAISE EXCEPTION 'Role upgrade not available for %', _target_role;
  END IF;

  -- Check balance
  SELECT balance INTO _current_balance
  FROM public.wallets
  WHERE user_id = _uid;

  IF COALESCE(_current_balance, 0) < _cost THEN
    RAISE EXCEPTION 'Insufficient DOT balance. Need % DOT, have % DOT',
      _cost, COALESCE(_current_balance, 0);
  END IF;

  -- Deduct DOT
  UPDATE public.wallets
  SET balance = balance - _cost
  WHERE user_id = _uid;

  -- Record transaction (also serves as the rate-limit timestamp)
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
