
CREATE TABLE public.game_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  coupon_code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL,
  game_score INTEGER NOT NULL,
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.game_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
ON public.game_rewards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
ON public.game_rewards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
ON public.game_rewards FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all rewards"
ON public.game_rewards FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
