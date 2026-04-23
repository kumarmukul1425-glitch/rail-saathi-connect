ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.food_orders REPLICA IDENTITY FULL;
ALTER TABLE public.complaints REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.food_orders;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;