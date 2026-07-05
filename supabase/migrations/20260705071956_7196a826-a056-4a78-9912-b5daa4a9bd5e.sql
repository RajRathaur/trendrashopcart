-- Fix recursive/fragile order RLS paths so admin and seller order pages can load reliably.

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders containing their items" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update orders containing their items" ON public.orders;

DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Sellers can view their order items" ON public.order_items;

CREATE POLICY "Admins can manage all orders"
ON public.orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Approved sellers can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.sellers s ON s.id = oi.seller_id
    WHERE oi.order_id = orders.id
      AND s.user_id = auth.uid()
      AND s.is_approved = true
      AND s.is_blocked = false
  )
);

CREATE POLICY "Approved sellers can update their order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.sellers s ON s.id = oi.seller_id
    WHERE oi.order_id = orders.id
      AND s.user_id = auth.uid()
      AND s.is_approved = true
      AND s.is_blocked = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.sellers s ON s.id = oi.seller_id
    WHERE oi.order_id = orders.id
      AND s.user_id = auth.uid()
      AND s.is_approved = true
      AND s.is_blocked = false
  )
);

CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Approved sellers can view their order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sellers s
    WHERE s.id = order_items.seller_id
      AND s.user_id = auth.uid()
      AND s.is_approved = true
      AND s.is_blocked = false
  )
);