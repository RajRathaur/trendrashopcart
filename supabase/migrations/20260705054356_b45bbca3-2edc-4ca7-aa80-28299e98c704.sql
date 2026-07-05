
-- Allow sellers to view orders that contain their items
CREATE POLICY "Sellers can view orders containing their items"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.sellers s ON s.id = oi.seller_id
    WHERE oi.order_id = orders.id AND s.user_id = auth.uid()
  )
);

-- Allow sellers to update order status for orders containing their items
CREATE POLICY "Sellers can update orders containing their items"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.sellers s ON s.id = oi.seller_id
    WHERE oi.order_id = orders.id AND s.user_id = auth.uid()
  )
);

-- Allow sellers to view payment confirmations for their products
CREATE POLICY "Sellers can view payments for their products"
ON public.payment_confirmations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.sellers s ON s.id = p.seller_id
    WHERE p.id = payment_confirmations.product_id AND s.user_id = auth.uid()
  )
);
