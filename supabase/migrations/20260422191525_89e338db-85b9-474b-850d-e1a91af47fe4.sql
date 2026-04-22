-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'signup' | 'booking' | 'food_order' | 'complaint'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  related_user_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications (is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view/update notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow system (triggers) to insert; we use SECURITY DEFINER trigger functions
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: new signup (profile created)
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, metadata, related_user_id)
  VALUES (
    'signup',
    'New user signup',
    COALESCE(NEW.display_name, 'A new user') || ' just signed up',
    jsonb_build_object('display_name', NEW.display_name, 'phone', NEW.phone),
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_notify
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_new_signup();

-- Trigger: new booking
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_train RECORD;
BEGIN
  SELECT train_name, train_number, source_station, destination_station
  INTO v_train FROM public.trains WHERE id = NEW.train_id;

  INSERT INTO public.notifications (type, title, message, metadata, related_user_id)
  VALUES (
    'booking',
    'New ticket booking',
    'PNR ' || NEW.pnr || ' on ' || COALESCE(v_train.train_name, 'train') || ' (' || NEW.seat_class || ') - ₹' || NEW.total_fare,
    jsonb_build_object(
      'pnr', NEW.pnr,
      'train_name', v_train.train_name,
      'train_number', v_train.train_number,
      'route', COALESCE(v_train.source_station,'') || ' → ' || COALESCE(v_train.destination_station,''),
      'seat_class', NEW.seat_class,
      'fare', NEW.total_fare,
      'journey_date', NEW.journey_date
    ),
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_created_notify
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_new_booking();

-- Trigger: new food order
CREATE OR REPLACE FUNCTION public.notify_new_food_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, metadata, related_user_id)
  VALUES (
    'food_order',
    'New food order',
    'PNR ' || NEW.pnr || ' ordered food worth ₹' || NEW.total_price ||
      CASE WHEN NEW.delivery_station IS NOT NULL THEN ' at ' || NEW.delivery_station ELSE '' END,
    jsonb_build_object(
      'pnr', NEW.pnr,
      'total_price', NEW.total_price,
      'delivery_station', NEW.delivery_station,
      'items', NEW.items
    ),
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_food_order_created_notify
AFTER INSERT ON public.food_orders
FOR EACH ROW EXECUTE FUNCTION public.notify_new_food_order();

-- Trigger: new complaint
CREATE OR REPLACE FUNCTION public.notify_new_complaint()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, metadata, related_user_id)
  VALUES (
    'complaint',
    'New complaint registered',
    '[' || NEW.category || '] ' || LEFT(NEW.description, 120),
    jsonb_build_object(
      'category', NEW.category,
      'description', NEW.description,
      'booking_id', NEW.booking_id
    ),
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_complaint_created_notify
AFTER INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.notify_new_complaint();

-- Make YOU (mukul.k1425@gmail.com) an admin if user exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'mukul.k1425@gmail.com'
ON CONFLICT DO NOTHING;