-- Wallet table (one per user)
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Wallet transactions ledger
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'refund',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet tx" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Add refund tracking to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS refund_amount INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_reason TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Allow status update to 'refunded' by the system (edge fn uses service role, bypasses RLS).
-- Also let users see refund updates via existing SELECT policy.

-- Atomic refund function (service role calls this from edge function)
CREATE OR REPLACE FUNCTION public.process_auto_refund(
  _booking_id UUID,
  _reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_amount INTEGER;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = _booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Booking not found');
  END IF;
  IF v_booking.status = 'refunded' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Already refunded');
  END IF;

  v_amount := v_booking.total_fare; -- 100% refund

  -- Update booking
  UPDATE public.bookings
    SET status = 'refunded',
        refund_amount = v_amount,
        refund_reason = _reason,
        refunded_at = now()
    WHERE id = _booking_id;

  -- Update payments
  UPDATE public.payments
    SET status = 'refunded'
    WHERE booking_id = _booking_id;

  -- Upsert wallet
  INSERT INTO public.wallets (user_id, balance)
    VALUES (v_booking.user_id, v_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET balance = public.wallets.balance + v_amount, updated_at = now();

  -- Ledger entry
  INSERT INTO public.wallet_transactions (user_id, booking_id, amount, type, reason)
    VALUES (v_booking.user_id, _booking_id, v_amount, 'refund', _reason);

  -- Notification
  INSERT INTO public.notifications (type, title, message, metadata, related_user_id)
    VALUES (
      'refund',
      'Auto-refund processed',
      '₹' || v_amount || ' refunded to wallet for PNR ' || v_booking.pnr || ' — ' || _reason,
      jsonb_build_object('pnr', v_booking.pnr, 'amount', v_amount, 'reason', _reason),
      v_booking.user_id
    );

  RETURN jsonb_build_object('ok', true, 'amount', v_amount);
END;
$$;