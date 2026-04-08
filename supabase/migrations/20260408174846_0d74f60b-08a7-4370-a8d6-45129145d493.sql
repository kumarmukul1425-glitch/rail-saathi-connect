-- Restaurants at stations
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  station_code TEXT NOT NULL,
  cuisine_type TEXT NOT NULL DEFAULT 'Indian',
  rating NUMERIC(2,1) DEFAULT 4.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants are publicly readable" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Admins can manage restaurants" ON public.restaurants FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Menu items
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Main Course',
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Menu items are publicly readable" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage menu items" ON public.menu_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Delay compensations
CREATE TABLE public.delay_compensations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  delay_hours NUMERIC(4,1) NOT NULL DEFAULT 0,
  compensation_type TEXT NOT NULL DEFAULT 'food_voucher',
  amount INTEGER NOT NULL DEFAULT 0,
  voucher_code TEXT,
  status TEXT NOT NULL DEFAULT 'issued',
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delay_compensations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own compensations" ON public.delay_compensations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert compensations" ON public.delay_compensations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());