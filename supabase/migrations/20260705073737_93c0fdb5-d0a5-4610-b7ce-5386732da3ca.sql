-- Product seller/admin policies should not run for anonymous catalog browsing,
-- because they reference private seller data. Keep public read policy separate.

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Sellers can view their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;

CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Sellers can view their own products"
ON public.products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sellers s
    WHERE s.id = products.seller_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can insert their own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sellers s
    WHERE s.id = products.seller_id
      AND s.user_id = auth.uid()
      AND s.is_approved = true
      AND s.is_blocked = false
  )
);

CREATE POLICY "Sellers can update their own products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sellers s
    WHERE s.id = products.seller_id
      AND s.user_id = auth.uid()
      AND s.is_blocked = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sellers s
    WHERE s.id = products.seller_id
      AND s.user_id = auth.uid()
      AND s.is_blocked = false
  )
);

CREATE POLICY "Sellers can delete their own products"
ON public.products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sellers s
    WHERE s.id = products.seller_id
      AND s.user_id = auth.uid()
      AND s.is_blocked = false
  )
);