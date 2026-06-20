
-- Profiles: restrict SELECT to owner; public access via get_public_profiles RPC
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Sellers: remove blanket public read; public access via get_public_seller RPC
DROP POLICY IF EXISTS "Anyone can view approved sellers" ON public.sellers;

-- Coupons: require authenticated to read active coupons
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can view active coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Game rewards: remove direct insert/update; enforce via claim_game_reward RPC
DROP POLICY IF EXISTS "Users can insert their own rewards" ON public.game_rewards;
DROP POLICY IF EXISTS "Users can update their own rewards" ON public.game_rewards;

-- Payment confirmations: require authenticated user, enforce uid match
DROP POLICY IF EXISTS "Anyone can submit payment confirmation" ON public.payment_confirmations;
CREATE POLICY "Authenticated users can submit own payment confirmation"
  ON public.payment_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Storage: payment-screenshots — remove public read and anonymous upload
DROP POLICY IF EXISTS "Anyone can view payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload payment screenshots" ON storage.objects;

CREATE POLICY "Users can upload own payment screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own payment screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all payment screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-screenshots'
    AND has_role(auth.uid(), 'admin'::app_role)
  );
