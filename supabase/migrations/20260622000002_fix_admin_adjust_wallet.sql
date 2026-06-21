-- ============================================================
-- FIX: admin_adjust_wallet — allow super_admin role as well
-- ============================================================
-- Original: has_role(auth.uid(), 'admin') — super_admin blocked
-- Fix: check for either admin OR super_admin role
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
  _user_id UUID,
  _amount NUMERIC,
  _type TEXT,
  _description TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _new_balance NUMERIC;
BEGIN
  -- Allow both admin and super_admin roles
  IF NOT (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  INSERT INTO public.wallets (user_id, balance)
    VALUES (_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.wallets
    SET balance = balance + _amount
    WHERE user_id = _user_id
    RETURNING balance INTO _new_balance;

  IF _new_balance < 0 THEN
    RAISE EXCEPTION 'Balance cannot go negative';
  END IF;

  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (
      _user_id,
      _amount,
      COALESCE(_type, 'Admin Adjustment'),
      _description
    );

  RETURN _new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
