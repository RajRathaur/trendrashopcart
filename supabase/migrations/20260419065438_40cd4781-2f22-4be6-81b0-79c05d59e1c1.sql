-- Coin wallet table
CREATE TABLE public.coin_wallet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.coin_wallet
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own wallet" ON public.coin_wallet
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all wallets" ON public.coin_wallet
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_coin_wallet_updated_at
  BEFORE UPDATE ON public.coin_wallet
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Redeem requests table
CREATE TABLE public.redeem_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coins_spent INTEGER NOT NULL,
  amount_inr NUMERIC NOT NULL,
  redeem_type TEXT NOT NULL DEFAULT 'google_play',
  status TEXT NOT NULL DEFAULT 'pending',
  google_play_code TEXT,
  admin_notes TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.redeem_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redeem requests" ON public.redeem_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all redeem requests" ON public.redeem_requests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_redeem_requests_updated_at
  BEFORE UPDATE ON public.redeem_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Securely add coins to wallet
CREATE OR REPLACE FUNCTION public.add_coins(_coins INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _new_balance INTEGER;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _coins <= 0 THEN RAISE EXCEPTION 'Invalid coin amount'; END IF;

  INSERT INTO public.coin_wallet (user_id, balance, total_earned)
  VALUES (_uid, _coins, _coins)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = coin_wallet.balance + EXCLUDED.balance,
        total_earned = coin_wallet.total_earned + EXCLUDED.total_earned,
        updated_at = now()
  RETURNING balance INTO _new_balance;

  RETURN _new_balance;
END;
$$;

-- Securely create redeem request (deduct coins atomically)
CREATE OR REPLACE FUNCTION public.request_redeem(_coins INTEGER, _email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _balance INTEGER;
  _amount NUMERIC;
  _req_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _coins < 200 THEN RAISE EXCEPTION 'Minimum 200 coins required'; END IF;

  SELECT balance INTO _balance FROM public.coin_wallet WHERE user_id = _uid FOR UPDATE;
  IF _balance IS NULL OR _balance < _coins THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  _amount := _coins / 20.0;

  UPDATE public.coin_wallet
    SET balance = balance - _coins, updated_at = now()
    WHERE user_id = _uid;

  INSERT INTO public.redeem_requests (user_id, coins_spent, amount_inr, contact_email)
  VALUES (_uid, _coins, _amount, _email)
  RETURNING id INTO _req_id;

  RETURN _req_id;
END;
$$;