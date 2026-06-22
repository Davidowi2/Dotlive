-- ================================================================
-- ISSUE 1 (HIGH): 500 DOT Starter Grant on signup
-- ================================================================
-- Updates handle_new_user trigger to credit 500 DOT to every new
-- user's wallet and log it as a 'Starter Grant' transaction.
-- Also assigns 'builder' as the default role (idempotent).
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

  -- Create wallet with 500 DOT starter grant
  -- ON CONFLICT: if wallet already exists (edge case), add 500 only once
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 500)
  ON CONFLICT (user_id) DO NOTHING;

  -- Log the starter grant as an immutable ledger entry
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (NEW.id, 500, 'Starter Grant', 'Welcome to DOT — 500 starter DOT');

  -- Auto-assign Builder as default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'builder')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure the trigger is attached (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
