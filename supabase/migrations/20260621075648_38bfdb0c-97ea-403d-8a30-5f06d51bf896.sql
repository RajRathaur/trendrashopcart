
-- Cap add_coins per-call and add a daily earning limit
CREATE OR REPLACE FUNCTION public.add_coins(_coins integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _new_balance INTEGER;
  _today_earned INTEGER;
  _max_per_call CONSTANT INTEGER := 500;
  _max_per_day  CONSTANT INTEGER := 2000;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _coins <= 0 THEN RAISE EXCEPTION 'Invalid coin amount'; END IF;
  IF _coins > _max_per_call THEN
    RAISE EXCEPTION 'Coin amount exceeds per-session maximum';
  END IF;

  -- Enforce daily earning cap based on total_earned delta within last 24h
  SELECT COALESCE(SUM(coins_delta), 0) INTO _today_earned
  FROM public.coin_earn_log
  WHERE user_id = _uid AND created_at > now() - interval '24 hours';

  IF _today_earned + _coins > _max_per_day THEN
    RAISE EXCEPTION 'Daily coin earning limit reached';
  END IF;

  INSERT INTO public.coin_wallet (user_id, balance, total_earned)
  VALUES (_uid, _coins, _coins)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = coin_wallet.balance + EXCLUDED.balance,
        total_earned = coin_wallet.total_earned + EXCLUDED.total_earned,
        updated_at = now()
  RETURNING balance INTO _new_balance;

  INSERT INTO public.coin_earn_log(user_id, coins_delta) VALUES (_uid, _coins);

  RETURN _new_balance;
END;
$function$;

-- Supporting table for daily earning rate-limit tracking
CREATE TABLE IF NOT EXISTS public.coin_earn_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  coins_delta integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_earn_log_user_time_idx ON public.coin_earn_log(user_id, created_at DESC);
GRANT SELECT ON public.coin_earn_log TO authenticated;
GRANT ALL ON public.coin_earn_log TO service_role;
ALTER TABLE public.coin_earn_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own coin earn log"
  ON public.coin_earn_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Prevent users from spoofing verified-purchase badges on reviews
CREATE OR REPLACE FUNCTION public.enforce_verified_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_verified_purchase := EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.user_id = NEW.user_id
      AND oi.product_id = NEW.product_id
      AND o.status IN ('delivered', 'completed')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_verified_purchase_ins ON public.product_reviews;
DROP TRIGGER IF EXISTS enforce_verified_purchase_upd ON public.product_reviews;

CREATE TRIGGER enforce_verified_purchase_ins
  BEFORE INSERT ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_purchase();

CREATE TRIGGER enforce_verified_purchase_upd
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_purchase();
