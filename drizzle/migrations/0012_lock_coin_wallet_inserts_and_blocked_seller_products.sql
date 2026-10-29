-- Wallet rows are created only by add_coins / server functions, never directly by users.
DROP POLICY IF EXISTS "Users insert own wallet" ON public.coin_wallet;

-- Blocked or unapproved sellers can no longer read their product listings.
DROP POLICY IF EXISTS "Sellers can view their own products" ON public.products;
CREATE POLICY "Sellers can view their own products"
ON public.products
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sellers s
  WHERE s.id = products.seller_id
    AND s.user_id = auth.uid()
    AND s.is_approved = true
    AND s.is_blocked = false
));