CREATE OR REPLACE FUNCTION public.request_redeem(_coins integer, _email text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID := auth.uid();
  _balance INTEGER;
  _amount NUMERIC;
  _req_id UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _coins < 1000 THEN RAISE EXCEPTION 'Minimum 1000 coins required'; END IF;
  SELECT balance INTO _balance FROM public.coin_wallet WHERE user_id = _uid FOR UPDATE;
  IF _balance IS NULL OR _balance < _coins THEN RAISE EXCEPTION 'Insufficient coins'; END IF;
  _amount := _coins / 100.0;
  UPDATE public.coin_wallet SET balance = balance - _coins, updated_at = now() WHERE user_id = _uid;
  INSERT INTO public.redeem_requests (user_id, coins_spent, amount_inr, contact_email)
  VALUES (_uid, _coins, _amount, _email) RETURNING id INTO _req_id;
  RETURN _req_id;
END;
$function$;