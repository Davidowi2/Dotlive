-- ================================================================
-- DOT — Africa's Venture Progression Network
-- Complete Database Setup Script (all 16 migrations combined)
-- Paste this ONCE into Supabase SQL Editor on a fresh database
-- ================================================================

-- ================================================================
-- PART 1: ENUM (all values from migrations 1, 4, 8)
-- ================================================================

CREATE TYPE public.app_role AS ENUM (
  'founder',
  'community_leader',
  'investor',
  'admin',
  'super_admin',
  'builder',
  'vendor',
  'capital_partner'
);

-- ================================================================
-- PART 2: UTILITY FUNCTION (needed before tables/triggers)
-- ================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ================================================================
-- PART 3: CORE TABLES
-- ================================================================

CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  dot_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.communities (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region TEXT,
  category TEXT,
  referral_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.founder_profiles (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  venture_name TEXT,
  industry TEXT,
  stage TEXT DEFAULT 'Assess',
  country TEXT,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  bio TEXT,
  website TEXT,
  funding_goal NUMERIC DEFAULT 0,
  logo_url TEXT,
  vantage_point INTEGER DEFAULT 0,
  fundability INTEGER DEFAULT 0,
  investment_readiness INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founder_profiles TO authenticated;
GRANT ALL ON public.founder_profiles TO service_role;
ALTER TABLE public.founder_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.community_members (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, founder_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.wallets (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transactions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assessments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  vantage_point INTEGER NOT NULL DEFAULT 0,
  fundability INTEGER NOT NULL DEFAULT 0,
  investment_readiness INTEGER NOT NULL DEFAULT 0,
  stage TEXT,
  report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.courses (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  whop_url TEXT,
  category TEXT,
  dot_reward INTEGER NOT NULL DEFAULT 0,
  vantage_boost INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.course_enrollments (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  certificate_url TEXT,
  completed_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;
GRANT ALL ON public.course_enrollments TO service_role;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.events (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  event_date TIMESTAMPTZ,
  dot_cost INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.event_registrations (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pitchathons (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  prize TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitchathons TO authenticated;
GRANT ALL ON public.pitchathons TO service_role;
ALTER TABLE public.pitchathons ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pitchathon_applications (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  pitchathon_id UUID NOT NULL REFERENCES public.pitchathons(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venture_name TEXT,
  pitch_deck_url TEXT,
  funding_ask NUMERIC,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pitchathon_id, founder_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitchathon_applications TO authenticated;
GRANT ALL ON public.pitchathon_applications TO service_role;
ALTER TABLE public.pitchathon_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pitchathon_judges (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  pitchathon_id UUID NOT NULL REFERENCES public.pitchathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pitchathon_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitchathon_judges TO authenticated;
GRANT ALL ON public.pitchathon_judges TO service_role;
ALTER TABLE public.pitchathon_judges ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pitchathon_scores (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.pitchathon_applications(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (application_id, judge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitchathon_scores TO authenticated;
GRANT ALL ON public.pitchathon_scores TO service_role;
ALTER TABLE public.pitchathon_scores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.investor_saves (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (investor_id, founder_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_saves TO authenticated;
GRANT ALL ON public.investor_saves TO service_role;
ALTER TABLE public.investor_saves ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.meeting_requests (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_requests TO authenticated;
GRANT ALL ON public.meeting_requests TO service_role;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE,
  dot_amount numeric NOT NULL CHECK (dot_amount > 0),
  naira_amount numeric NOT NULL CHECK (naira_amount > 0),
  status text NOT NULL DEFAULT 'pending',
  paystack_reference text,
  channel text,
  paid_at timestamptz,
  credited_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  previous_role TEXT,
  new_role TEXT NOT NULL,
  action TEXT NOT NULL,
  assigned_by UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.builder_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  headline text NOT NULL,
  bio text,
  skills text[] NOT NULL DEFAULT '{}',
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.builder_profiles TO authenticated;
GRANT ALL ON public.builder_profiles TO service_role;
ALTER TABLE public.builder_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price_dot numeric NOT NULL CHECK (price_dot > 0),
  delivery_days integer NOT NULL DEFAULT 3 CHECK (delivery_days > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  builder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_dot numeric NOT NULL,
  title text NOT NULL,
  requirements text,
  delivery_note text,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.service_orders(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  builder_id uuid NOT NULL,
  client_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_reviews TO authenticated;
GRANT ALL ON public.service_reviews TO service_role;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- PART 4: INDEXES
-- ================================================================

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_services_category ON public.services(category) WHERE is_active;
CREATE INDEX idx_services_builder ON public.services(builder_id);
CREATE INDEX idx_orders_client ON public.service_orders(client_id);
CREATE INDEX idx_orders_builder ON public.service_orders(builder_id);
CREATE INDEX idx_orders_service ON public.service_orders(service_id);
CREATE INDEX idx_reviews_builder ON public.service_reviews(builder_id);
CREATE INDEX idx_reviews_service ON public.service_reviews(service_id);

-- ================================================================
-- PART 5: TRIGGERS
-- ================================================================

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_communities_updated BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_founder_profiles_updated BEFORE UPDATE ON public.founder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_builder_profiles_updated BEFORE UPDATE ON public.builder_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + wallet on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- PART 6: DOT ID SYSTEM
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS public.dot_id_seq START 100000;

CREATE OR REPLACE FUNCTION public.generate_dot_id()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'DOT-' || lpad(nextval('public.dot_id_seq')::text, 6, '0')
$$;

ALTER TABLE public.profiles ALTER COLUMN dot_id SET DEFAULT public.generate_dot_id();
ALTER TABLE public.profiles ALTER COLUMN dot_id SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_dot_id_key ON public.profiles(dot_id);

-- ================================================================
-- PART 7: RLS POLICIES
-- ================================================================

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users self-assign basic role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = ANY(ARRAY['founder','community_leader','investor','builder','vendor','capital_partner']::app_role[]));
CREATE POLICY "Admins manage basic roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND role = ANY(ARRAY['founder','community_leader','investor','builder','vendor','capital_partner']::app_role[]));
CREATE POLICY "Admins update basic roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND role = ANY(ARRAY['founder','community_leader','investor','builder','vendor','capital_partner']::app_role[]))
  WITH CHECK (has_role(auth.uid(), 'admin') AND role = ANY(ARRAY['founder','community_leader','investor','builder','vendor','capital_partner']::app_role[]));
CREATE POLICY "Admins delete basic roles" ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND role = ANY(ARRAY['founder','community_leader','investor','builder','vendor','capital_partner']::app_role[]));

-- communities (column-level: referral_code hidden from broad reads)
REVOKE SELECT ON public.communities FROM authenticated;
GRANT SELECT (id, name, description, category, region, leader_id, created_at, updated_at) ON public.communities TO authenticated;
CREATE POLICY "Leaders create communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders update own communities" ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = leader_id) WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders delete own communities" ON public.communities FOR DELETE TO authenticated USING (auth.uid() = leader_id);

-- founder_profiles
CREATE POLICY "Founder profiles viewable by authenticated" ON public.founder_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Founders manage own profile" ON public.founder_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- community_members
CREATE POLICY "Members view own membership" ON public.community_members FOR SELECT TO authenticated USING (auth.uid() = founder_id);
CREATE POLICY "Leaders view their community members" ON public.community_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.leader_id = auth.uid()));
CREATE POLICY "Founders join communities" ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = founder_id);
CREATE POLICY "Founders leave communities" ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = founder_id);

-- wallets
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all wallets" ON public.wallets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- transactions
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- assessments
CREATE POLICY "Users manage own assessments" ON public.assessments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- courses
CREATE POLICY "Courses viewable by authenticated" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- course_enrollments
CREATE POLICY "Users manage own enrollments" ON public.course_enrollments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- events
CREATE POLICY "Events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- event_registrations
CREATE POLICY "Users view own registrations" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all registrations" ON public.event_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users register themselves" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cancel own registrations" ON public.event_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- pitchathons
CREATE POLICY "Pitchathons viewable by authenticated" ON public.pitchathons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pitchathons" ON public.pitchathons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pitchathon_applications
CREATE POLICY "Founders view own applications" ON public.pitchathon_applications FOR SELECT TO authenticated USING (auth.uid() = founder_id);
CREATE POLICY "Judges view assigned applications" ON public.pitchathon_applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pitchathon_judges j WHERE j.pitchathon_id = pitchathon_applications.pitchathon_id AND j.user_id = auth.uid()));
CREATE POLICY "Admins view all applications" ON public.pitchathon_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Founders manage own applications" ON public.pitchathon_applications FOR ALL TO authenticated USING (auth.uid() = founder_id) WITH CHECK (auth.uid() = founder_id);

-- pitchathon_judges
CREATE POLICY "Judges viewable by authenticated" ON public.pitchathon_judges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage judges" ON public.pitchathon_judges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pitchathon_scores
CREATE POLICY "Judges view own scores" ON public.pitchathon_scores FOR SELECT TO authenticated USING (auth.uid() = judge_id);
CREATE POLICY "Founders view scores on their applications" ON public.pitchathon_scores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pitchathon_applications a WHERE a.id = pitchathon_scores.application_id AND a.founder_id = auth.uid()));
CREATE POLICY "Admins view all scores" ON public.pitchathon_scores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Judges manage own scores" ON public.pitchathon_scores FOR ALL TO authenticated
  USING (auth.uid() = judge_id AND EXISTS (SELECT 1 FROM public.pitchathon_judges j JOIN public.pitchathon_applications a ON a.pitchathon_id = j.pitchathon_id WHERE a.id = application_id AND j.user_id = auth.uid()))
  WITH CHECK (auth.uid() = judge_id AND EXISTS (SELECT 1 FROM public.pitchathon_judges j JOIN public.pitchathon_applications a ON a.pitchathon_id = j.pitchathon_id WHERE a.id = application_id AND j.user_id = auth.uid()));

-- investor_saves
CREATE POLICY "Investors manage own saves" ON public.investor_saves FOR ALL TO authenticated USING (auth.uid() = investor_id) WITH CHECK (auth.uid() = investor_id);

-- meeting_requests
CREATE POLICY "Investors view own requests" ON public.meeting_requests FOR SELECT TO authenticated USING (auth.uid() = investor_id);
CREATE POLICY "Founders view requests to them" ON public.meeting_requests FOR SELECT TO authenticated USING (auth.uid() = founder_id);
CREATE POLICY "Investors create requests" ON public.meeting_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Founders update request status" ON public.meeting_requests FOR UPDATE TO authenticated USING (auth.uid() = founder_id) WITH CHECK (auth.uid() = founder_id);

-- payments
CREATE POLICY "Users view own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all payments" ON public.payments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- role_audit_log
CREATE POLICY "Super admins can read audit log" ON public.role_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- builder_profiles
CREATE POLICY "Builder profiles viewable by authenticated" ON public.builder_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own builder profile" ON public.builder_profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- services
CREATE POLICY "Active services or own are viewable" ON public.services FOR SELECT TO authenticated USING (is_active OR builder_id = auth.uid());
CREATE POLICY "Builders manage own services" ON public.services FOR ALL TO authenticated USING (auth.uid() = builder_id) WITH CHECK (auth.uid() = builder_id);

-- service_orders
CREATE POLICY "Order parties can view their orders" ON public.service_orders FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = builder_id);

-- service_reviews
CREATE POLICY "Reviews viewable by authenticated" ON public.service_reviews FOR SELECT TO authenticated USING (true);

-- ================================================================
-- PART 8: STORAGE POLICIES
-- (Requires 'documents' bucket to exist in Supabase Storage)
-- ================================================================

CREATE POLICY "Users upload own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read all documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- ================================================================
-- PART 9: SECURITY DEFINER FUNCTIONS
-- ================================================================

-- DOT ID helpers
CREATE OR REPLACE FUNCTION public.lookup_dot_id(_dot_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT name FROM public.profiles WHERE upper(dot_id) = upper(trim(_dot_id)) LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.lookup_dot_id(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_referral_code()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT referral_code FROM public.communities WHERE leader_id = auth.uid() LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_my_referral_code() TO authenticated;

CREATE OR REPLACE FUNCTION public.find_community_by_referral_code(_code text)
RETURNS TABLE(id uuid, name text, description text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.name, c.description FROM public.communities c WHERE c.referral_code = _code LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.find_community_by_referral_code(text) TO authenticated;

-- Pitchathon leaderboard (safe public view)
CREATE OR REPLACE FUNCTION public.get_pitchathon_leaderboard(_pitchathon_id uuid)
RETURNS TABLE(application_id uuid, venture_name text, avg_score numeric, score_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT a.id, a.venture_name, COALESCE(avg(s.score),0)::numeric, count(s.id)
  FROM public.pitchathon_applications a
  LEFT JOIN public.pitchathon_scores s ON s.application_id = a.id
  WHERE a.pitchathon_id = _pitchathon_id
  GROUP BY a.id, a.venture_name
$$;
REVOKE ALL ON FUNCTION public.get_pitchathon_leaderboard(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pitchathon_leaderboard(uuid) TO authenticated;

-- Admin role management
CREATE OR REPLACE FUNCTION public.elevate_user_to_admin(
  _target_user_id UUID, _new_role app_role DEFAULT 'super_admin', _reason TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _caller UUID := auth.uid(); _prev TEXT;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_role(_caller, 'super_admin') THEN RAISE EXCEPTION 'Only super admins can elevate users'; END IF;
  IF _caller = _target_user_id THEN RAISE EXCEPTION 'Self-assignment is not allowed'; END IF;
  IF _new_role NOT IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Invalid admin role'; END IF;
  SELECT string_agg(role::text, ',' ORDER BY role::text) INTO _prev FROM public.user_roles WHERE user_id = _target_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _new_role) ON CONFLICT (user_id, role) DO NOTHING;
  IF _new_role = 'super_admin' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  INSERT INTO public.role_audit_log (target_user_id, previous_role, new_role, action, assigned_by, reason)
    VALUES (_target_user_id, _prev, _new_role::text, 'granted', _caller, _reason);
END; $$;
REVOKE EXECUTE ON FUNCTION public.elevate_user_to_admin(UUID, app_role, TEXT) FROM anon;

CREATE OR REPLACE FUNCTION public.revoke_admin_role(
  _target_user_id UUID, _role app_role DEFAULT 'admin', _reason TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _caller UUID := auth.uid(); _prev TEXT;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_role(_caller, 'super_admin') THEN RAISE EXCEPTION 'Only super admins can revoke roles'; END IF;
  IF _caller = _target_user_id THEN RAISE EXCEPTION 'You cannot revoke your own role'; END IF;
  IF _role NOT IN ('admin', 'super_admin') THEN RAISE EXCEPTION 'Invalid admin role'; END IF;
  SELECT string_agg(role::text, ',' ORDER BY role::text) INTO _prev FROM public.user_roles WHERE user_id = _target_user_id;
  DELETE FROM public.user_roles WHERE user_id = _target_user_id AND role = _role;
  INSERT INTO public.role_audit_log (target_user_id, previous_role, new_role, action, assigned_by, reason)
    VALUES (_target_user_id, _prev, _role::text, 'revoked', _caller, _reason);
END; $$;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(UUID, app_role, TEXT) FROM anon;

CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(_email TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'A super admin already exists';
  END IF;
  SELECT id INTO _uid FROM auth.users WHERE email = lower(_email);
  IF _uid IS NULL THEN RAISE EXCEPTION 'No user found with email %', _email; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'super_admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  INSERT INTO public.role_audit_log (target_user_id, previous_role, new_role, action, assigned_by, reason)
    VALUES (_uid, NULL, 'super_admin', 'bootstrap', _uid, 'Initial super admin bootstrap');
  RETURN _uid;
END; $$;
REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO service_role;

-- Wallet functions
CREATE OR REPLACE FUNCTION public.deposit_dot(_amount NUMERIC, _description TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _new_balance NUMERIC;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount < 2000 THEN RAISE EXCEPTION 'Minimum deposit is 2000 DOT'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _uid RETURNING balance INTO _new_balance;
  INSERT INTO public.transactions (user_id, amount, type, description) VALUES (_uid, _amount, 'Deposit', _description);
  RETURN _new_balance;
END; $$;
REVOKE EXECUTE ON FUNCTION public.deposit_dot(numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deposit_dot(numeric, text) TO service_role;

CREATE OR REPLACE FUNCTION public.reward_dot(_amount NUMERIC, _description TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _new_balance NUMERIC;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _uid RETURNING balance INTO _new_balance;
  INSERT INTO public.transactions (user_id, amount, type, description) VALUES (_uid, _amount, 'Reward', _description);
  RETURN _new_balance;
END; $$;
-- SECURITY: revoked from all clients — service_role only (closes self-award exploit)
REVOKE EXECUTE ON FUNCTION public.reward_dot(NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reward_dot(NUMERIC, TEXT) TO service_role;

-- Course reward: idempotent, server-side only
CREATE OR REPLACE FUNCTION public.claim_course_reward(_user_id uuid, _course_id uuid)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _enr public.course_enrollments%ROWTYPE; _reward integer; _new_balance numeric;
BEGIN
  SELECT * INTO _enr FROM public.course_enrollments WHERE user_id = _user_id AND course_id = _course_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'No enrollment found for this course'; END IF;
  IF _enr.status <> 'completed' THEN
    UPDATE public.course_enrollments SET status = 'completed', completed_at = now() WHERE id = _enr.id;
  END IF;
  IF _enr.rewarded_at IS NOT NULL THEN
    RETURN COALESCE((SELECT balance FROM public.wallets WHERE user_id = _user_id), 0);
  END IF;
  SELECT dot_reward INTO _reward FROM public.courses WHERE id = _course_id;
  INSERT INTO public.wallets (user_id, balance) VALUES (_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  IF COALESCE(_reward, 0) > 0 THEN
    UPDATE public.wallets SET balance = balance + _reward WHERE user_id = _user_id RETURNING balance INTO _new_balance;
    INSERT INTO public.transactions (user_id, amount, type, description)
      VALUES (_user_id, _reward, 'Academy Reward', 'Course completion reward');
  END IF;
  UPDATE public.course_enrollments SET rewarded_at = now() WHERE id = _enr.id;
  RETURN COALESCE(_new_balance, (SELECT balance FROM public.wallets WHERE user_id = _user_id), 0);
END; $$;
REVOKE ALL ON FUNCTION public.claim_course_reward(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_course_reward(uuid, uuid) TO service_role;

-- Paystack credit: atomic, idempotent, service_role only
CREATE OR REPLACE FUNCTION public.credit_paystack_payment(_reference text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments%ROWTYPE; _new_balance numeric;
BEGIN
  SELECT * INTO _p FROM public.payments WHERE reference = _reference FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found: %', _reference; END IF;
  IF _p.credited_at IS NOT NULL THEN
    RETURN COALESCE((SELECT balance FROM public.wallets WHERE user_id = _p.user_id), 0);
  END IF;
  IF _p.status <> 'success' THEN RAISE EXCEPTION 'Payment % is not in success state', _reference; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_p.user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _p.dot_amount WHERE user_id = _p.user_id RETURNING balance INTO _new_balance;
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (_p.user_id, _p.dot_amount, 'Deposit', 'Paystack deposit · ' || _reference);
  UPDATE public.payments SET credited_at = now(), updated_at = now() WHERE id = _p.id;
  RETURN _new_balance;
END; $$;
REVOKE ALL ON FUNCTION public.credit_paystack_payment(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_paystack_payment(text) TO service_role;

-- spend_dot: rate limited + daily cap
CREATE OR REPLACE FUNCTION public.spend_dot(_amount NUMERIC, _description TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid(); _new_balance NUMERIC; _last_tx timestamptz; _daily_debited numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  SELECT MAX(created_at) INTO _last_tx FROM public.transactions
    WHERE user_id = _uid AND amount < 0 AND created_at > now() - interval '10 seconds';
  IF _last_tx IS NOT NULL THEN RAISE EXCEPTION 'Please wait a moment before making another transaction'; END IF;
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO _daily_debited FROM public.transactions
    WHERE user_id = _uid AND amount < 0
      AND type IN ('Transfer','Spend','Marketplace Spend','Event Payment')
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
  IF _daily_debited + _amount > 100000 THEN RAISE EXCEPTION 'Daily spending limit of 100,000 DOT reached'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance - _amount WHERE user_id = _uid RETURNING balance INTO _new_balance;
  IF _new_balance < 0 THEN RAISE EXCEPTION 'Insufficient DOT balance'; END IF;
  INSERT INTO public.transactions (user_id, amount, type, description) VALUES (_uid, -_amount, 'Spend', _description);
  RETURN _new_balance;
END; $$;
REVOKE EXECUTE ON FUNCTION public.spend_dot(NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.spend_dot(NUMERIC, TEXT) TO authenticated;

-- transfer_dot: rate limited + daily cap + deadlock-safe
CREATE OR REPLACE FUNCTION public.transfer_dot(_recipient_dot_id text, _amount numeric, _note text DEFAULT NULL)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _sender uuid := auth.uid(); _recipient uuid; _sender_name text; _recipient_name text;
  _new_balance numeric; _last_tx timestamptz; _daily_debited numeric;
BEGIN
  IF _sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  SELECT MAX(created_at) INTO _last_tx FROM public.transactions
    WHERE user_id = _sender AND amount < 0 AND created_at > now() - interval '10 seconds';
  IF _last_tx IS NOT NULL THEN RAISE EXCEPTION 'Please wait a moment before making another transfer'; END IF;
  SELECT COALESCE(SUM(ABS(amount)), 0) INTO _daily_debited FROM public.transactions
    WHERE user_id = _sender AND amount < 0
      AND type IN ('Transfer','Spend','Marketplace Spend','Event Payment')
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
  IF _daily_debited + _amount > 100000 THEN RAISE EXCEPTION 'Daily transfer limit of 100,000 DOT reached'; END IF;
  SELECT id, name INTO _recipient, _recipient_name FROM public.profiles
    WHERE upper(dot_id) = upper(trim(_recipient_dot_id)) LIMIT 1;
  IF _recipient IS NULL THEN RAISE EXCEPTION 'No wallet found for that DOT ID'; END IF;
  IF _recipient = _sender THEN RAISE EXCEPTION 'You cannot transfer to yourself'; END IF;
  SELECT name INTO _sender_name FROM public.profiles WHERE id = _sender;
  INSERT INTO public.wallets (user_id, balance) VALUES (_sender, 0) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.wallets (user_id, balance) VALUES (_recipient, 0) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.wallets WHERE user_id = least(_sender, _recipient) FOR UPDATE;
  PERFORM 1 FROM public.wallets WHERE user_id = greatest(_sender, _recipient) FOR UPDATE;
  UPDATE public.wallets SET balance = balance - _amount WHERE user_id = _sender RETURNING balance INTO _new_balance;
  IF _new_balance < 0 THEN RAISE EXCEPTION 'Insufficient DOT balance'; END IF;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _recipient;
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (_sender, -_amount, 'Transfer', 'Sent to ' || COALESCE(_recipient_name, _recipient_dot_id) || COALESCE(' · ' || _note, ''));
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (_recipient, _amount, 'Transfer', 'Received from ' || COALESCE(_sender_name, 'a DOT user') || COALESCE(' · ' || _note, ''));
  RETURN _new_balance;
END; $$;
GRANT EXECUTE ON FUNCTION public.transfer_dot(text, numeric, text) TO authenticated;

-- admin_adjust_wallet: accepts admin OR super_admin
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(_user_id UUID, _amount NUMERIC, _type TEXT, _description TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _new_balance NUMERIC;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_user_id, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _amount WHERE user_id = _user_id RETURNING balance INTO _new_balance;
  IF _new_balance < 0 THEN RAISE EXCEPTION 'Balance cannot go negative'; END IF;
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (_user_id, _amount, COALESCE(_type, 'Admin Adjustment'), _description);
  RETURN _new_balance;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- DOT Work marketplace RPCs
CREATE OR REPLACE FUNCTION public.create_service_order(_service_id uuid, _requirements text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _client uuid := auth.uid(); _svc public.services%ROWTYPE; _order_id uuid; _bal numeric;
BEGIN
  IF _client IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _svc FROM public.services WHERE id = _service_id;
  IF NOT FOUND OR NOT _svc.is_active THEN RAISE EXCEPTION 'Service not available'; END IF;
  IF _svc.builder_id = _client THEN RAISE EXCEPTION 'You cannot order your own service'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_client, 0) ON CONFLICT (user_id) DO NOTHING;
  PERFORM 1 FROM public.wallets WHERE user_id = _client FOR UPDATE;
  UPDATE public.wallets SET balance = balance - _svc.price_dot WHERE user_id = _client RETURNING balance INTO _bal;
  IF _bal < 0 THEN RAISE EXCEPTION 'Insufficient DOT balance'; END IF;
  INSERT INTO public.service_orders (service_id, client_id, builder_id, amount_dot, title, requirements, status)
    VALUES (_service_id, _client, _svc.builder_id, _svc.price_dot, _svc.title, _requirements, 'in_progress') RETURNING id INTO _order_id;
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (_client, -_svc.price_dot, 'Marketplace Spend', 'Order: ' || _svc.title);
  RETURN _order_id;
END; $$;

CREATE OR REPLACE FUNCTION public.deliver_service_order(_order_id uuid, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.service_orders%ROWTYPE;
BEGIN
  SELECT * INTO _o FROM public.service_orders WHERE id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _o.builder_id <> auth.uid() THEN RAISE EXCEPTION 'Only the builder can deliver'; END IF;
  IF _o.status <> 'in_progress' THEN RAISE EXCEPTION 'Order cannot be delivered'; END IF;
  UPDATE public.service_orders SET status = 'delivered', delivery_note = _note WHERE id = _order_id;
END; $$;

CREATE OR REPLACE FUNCTION public.complete_service_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.service_orders%ROWTYPE;
BEGIN
  SELECT * INTO _o FROM public.service_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _o.client_id <> auth.uid() THEN RAISE EXCEPTION 'Only the client can complete'; END IF;
  IF _o.status NOT IN ('in_progress', 'delivered') THEN RAISE EXCEPTION 'Order already finalized'; END IF;
  INSERT INTO public.wallets (user_id, balance) VALUES (_o.builder_id, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.wallets SET balance = balance + _o.amount_dot WHERE user_id = _o.builder_id;
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (_o.builder_id, _o.amount_dot, 'Marketplace Earnings', 'Order completed: ' || _o.title);
  UPDATE public.service_orders SET status = 'completed', completed_at = now() WHERE id = _order_id;
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_service_order(_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.service_orders%ROWTYPE;
BEGIN
  SELECT * INTO _o FROM public.service_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF auth.uid() NOT IN (_o.client_id, _o.builder_id) THEN RAISE EXCEPTION 'Not your order'; END IF;
  IF _o.status NOT IN ('in_progress', 'delivered') THEN RAISE EXCEPTION 'Order cannot be cancelled'; END IF;
  UPDATE public.wallets SET balance = balance + _o.amount_dot WHERE user_id = _o.client_id;
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (_o.client_id, _o.amount_dot, 'Refund', 'Order cancelled: ' || _o.title);
  UPDATE public.service_orders SET status = 'cancelled' WHERE id = _order_id;
END; $$;

CREATE OR REPLACE FUNCTION public.review_service_order(_order_id uuid, _rating integer, _comment text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o public.service_orders%ROWTYPE;
BEGIN
  SELECT * INTO _o FROM public.service_orders WHERE id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _o.client_id <> auth.uid() THEN RAISE EXCEPTION 'Only the client can review'; END IF;
  IF _o.status <> 'completed' THEN RAISE EXCEPTION 'You can only review completed orders'; END IF;
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'Rating must be between 1 and 5'; END IF;
  INSERT INTO public.service_reviews (order_id, service_id, builder_id, client_id, rating, comment)
    VALUES (_order_id, _o.service_id, _o.builder_id, _o.client_id, _rating, _comment)
    ON CONFLICT (order_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment;
END; $$;

CREATE OR REPLACE FUNCTION public.get_builder_stats(_builder_id uuid)
RETURNS TABLE(orders_completed bigint, total_earned numeric, avg_rating numeric, review_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.service_orders o WHERE o.builder_id = _builder_id AND o.status = 'completed'),
    (SELECT COALESCE(sum(amount_dot), 0) FROM public.service_orders o WHERE o.builder_id = _builder_id AND o.status = 'completed'),
    (SELECT COALESCE(round(avg(rating), 1), 0) FROM public.service_reviews r WHERE r.builder_id = _builder_id),
    (SELECT count(*) FROM public.service_reviews r WHERE r.builder_id = _builder_id)
$$;

GRANT EXECUTE ON FUNCTION public.create_service_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deliver_service_order(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_service_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_service_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_service_order(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_builder_stats(uuid) TO authenticated;

-- ================================================================
-- DONE
-- ================================================================
-- Tables: profiles, user_roles, communities, founder_profiles,
--   community_members, wallets, transactions, assessments,
--   courses, course_enrollments, events, event_registrations,
--   pitchathons, pitchathon_applications, pitchathon_judges,
--   pitchathon_scores, investor_saves, meeting_requests,
--   payments, role_audit_log, builder_profiles, services,
--   service_orders, service_reviews (24 tables)
-- Functions: 20 SECURITY DEFINER functions
-- Triggers: 9 triggers
-- RLS Policies: 50+ policies across all tables
-- ================================================================
