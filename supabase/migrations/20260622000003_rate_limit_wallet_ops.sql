-- ============================================================
-- RATE LIMITING: transfer_dot and spend_dot
-- ============================================================
-- Strategy: enforce a 10-second cooldown per user between
-- wallet debit operations (transfer + spend). This prevents
-- automated drain attacks and rapid-fire spam without blocking
-- normal usage. The check uses the transactions ledger as the
-- source of truth — no extra table needed.
--
-- Additionally, enforce a daily debit cap: a user may not
-- spend/transfer more than 100,000 DOT in a single UTC day.
-- Admin credits and deposits are excluded from the cap.
-- ============================================================

CREATE OR REPLACE FUNCTION public.transfer_dot(
  _recipient_dot_id text,
  _amount numeric,
  _note text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender uuid := auth.uid();
  _recipient uuid;
  _sender_name text;
  _recipient_name text;
  _new_balance numeric;
  _last_tx timestamptz;
  _daily_debited numeric;
BEGIN
  IF _sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  -- ── Rate limit: 10-second cooldown ──────────────────────
  SELECT MAX(created_at) INTO _last_tx
  FROM public.transactions
  WHERE user_id = _sender
    AND amount < 0
    AND created_at > now() - interval '10 seconds';

  IF _last_tx IS NOT NULL THEN
    RAISE EXCEPTION 'Please wait a moment before making another transfer';
  END IF;

  -- ── Daily cap: 100,000 DOT per UTC day ──────────────────
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO _daily_debited
  FROM public.transactions
  WHERE user_id = _sender
    AND amount < 0
    AND type IN ('Transfer', 'Spend', 'Marketplace Spend', 'Event Payment')
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  IF _daily_debited + _amount > 100000 THEN
    RAISE EXCEPTION 'Daily transfer limit of 100,000 DOT reached';
  END IF;

  -- ── Resolve recipient ────────────────────────────────────
  SELECT id, name INTO _recipient, _recipient_name
  FROM public.profiles
  WHERE upper(dot_id) = upper(trim(_recipient_dot_id))
  LIMIT 1;

  IF _recipient IS NULL THEN RAISE EXCEPTION 'No wallet found for that DOT ID'; END IF;
  IF _recipient = _sender THEN RAISE EXCEPTION 'You cannot transfer to yourself'; END IF;

  SELECT name INTO _sender_name FROM public.profiles WHERE id = _sender;

  -- ── Ensure wallets exist ─────────────────────────────────
  INSERT INTO public.wallets (user_id, balance) VALUES (_sender, 0) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.wallets (user_id, balance) VALUES (_recipient, 0) ON CONFLICT (user_id) DO NOTHING;

  -- ── Lock both rows (ordered to prevent deadlock) ─────────
  PERFORM 1 FROM public.wallets WHERE user_id = least(_sender, _recipient) FOR UPDATE;
  PERFORM 1 FROM public.wallets WHERE user_id = greatest(_sender, _recipient) FOR UPDATE;

  -- ── Debit sender ─────────────────────────────────────────
  UPDATE public.wallets SET balance = balance - _amount
  WHERE user_id = _sender
  RETURNING balance INTO _new_balance;

  IF _new_balance < 0 THEN RAISE EXCEPTION 'Insufficient DOT balance'; END IF;

  -- ── Credit recipient ──────────────────────────────────────
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _recipient;

  -- ── Immutable ledger entries ──────────────────────────────
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (
    _sender, -_amount, 'Transfer',
    'Sent to ' || COALESCE(_recipient_name, _recipient_dot_id) || COALESCE(' · ' || _note, '')
  );

  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (
    _recipient, _amount, 'Transfer',
    'Received from ' || COALESCE(_sender_name, 'a DOT user') || COALESCE(' · ' || _note, '')
  );

  RETURN _new_balance;
END;
$$;

-- ── Also harden spend_dot with the same rate limit ────────
CREATE OR REPLACE FUNCTION public.spend_dot(_amount NUMERIC, _description TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _new_balance NUMERIC;
  _last_tx timestamptz;
  _daily_debited numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  -- ── Rate limit: 10-second cooldown ──────────────────────
  SELECT MAX(created_at) INTO _last_tx
  FROM public.transactions
  WHERE user_id = _uid
    AND amount < 0
    AND created_at > now() - interval '10 seconds';

  IF _last_tx IS NOT NULL THEN
    RAISE EXCEPTION 'Please wait a moment before making another transaction';
  END IF;

  -- ── Daily cap ────────────────────────────────────────────
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO _daily_debited
  FROM public.transactions
  WHERE user_id = _uid
    AND amount < 0
    AND type IN ('Transfer', 'Spend', 'Marketplace Spend', 'Event Payment')
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');

  IF _daily_debited + _amount > 100000 THEN
    RAISE EXCEPTION 'Daily spending limit of 100,000 DOT reached';
  END IF;

  INSERT INTO public.wallets (user_id, balance) VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance - _amount WHERE user_id = _uid RETURNING balance INTO _new_balance;
  IF _new_balance < 0 THEN RAISE EXCEPTION 'Insufficient DOT balance'; END IF;

  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (_uid, -_amount, 'Spend', _description);

  RETURN _new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_dot(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.spend_dot(numeric, text) TO authenticated;
