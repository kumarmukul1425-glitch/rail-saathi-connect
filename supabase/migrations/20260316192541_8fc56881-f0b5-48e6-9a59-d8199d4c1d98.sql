
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Stations
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT NOT NULL
);
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- Trains
CREATE TABLE public.trains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_number TEXT NOT NULL UNIQUE,
  train_name TEXT NOT NULL,
  source_station TEXT NOT NULL,
  source_code TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  destination_code TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  journey_duration TEXT NOT NULL,
  train_type TEXT NOT NULL,
  intermediate_stops TEXT[] DEFAULT '{}',
  runs_on TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  sleeper_price INTEGER DEFAULT 0,
  ac3_price INTEGER DEFAULT 0,
  ac2_price INTEGER DEFAULT 0,
  ac1_price INTEGER DEFAULT 0,
  sleeper_seats INTEGER DEFAULT 100,
  ac3_seats INTEGER DEFAULT 50,
  ac2_seats INTEGER DEFAULT 30,
  ac1_seats INTEGER DEFAULT 10
);
ALTER TABLE public.trains ENABLE ROW LEVEL SECURITY;

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  train_id UUID REFERENCES public.trains(id) NOT NULL,
  pnr TEXT NOT NULL UNIQUE,
  journey_date DATE NOT NULL,
  seat_class TEXT NOT NULL,
  total_fare INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Passengers
CREATE TABLE public.passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL
);
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Food Orders
CREATE TABLE public.food_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pnr TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_price INTEGER NOT NULL DEFAULT 0,
  delivery_station TEXT,
  status TEXT NOT NULL DEFAULT 'placed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id),
  food_order_id UUID REFERENCES public.food_orders(id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_booking_owner(_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings WHERE id = _booking_id AND user_id = auth.uid()
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- profiles
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- stations: public read
CREATE POLICY "Stations are publicly readable" ON public.stations FOR SELECT USING (true);

-- trains: public read, admin write
CREATE POLICY "Trains are publicly readable" ON public.trains FOR SELECT USING (true);
CREATE POLICY "Admins can insert trains" ON public.trains FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trains" ON public.trains FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete trains" ON public.trains FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- bookings: own only
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- passengers: own bookings only
CREATE POLICY "Users can view own passengers" ON public.passengers FOR SELECT TO authenticated USING (public.is_booking_owner(booking_id));
CREATE POLICY "Users can add passengers" ON public.passengers FOR INSERT TO authenticated WITH CHECK (public.is_booking_owner(booking_id));

-- complaints: own only
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own complaints" ON public.complaints FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- food_orders: own only
CREATE POLICY "Users can view own food orders" ON public.food_orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create food orders" ON public.food_orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- payments: own only via booking or food order
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated
  USING (
    (booking_id IS NOT NULL AND public.is_booking_owner(booking_id))
    OR (food_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.food_orders WHERE id = food_order_id AND user_id = auth.uid()))
  );
CREATE POLICY "Users can create payments" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (
    (booking_id IS NOT NULL AND public.is_booking_owner(booking_id))
    OR (food_order_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.food_orders WHERE id = food_order_id AND user_id = auth.uid()))
  );
