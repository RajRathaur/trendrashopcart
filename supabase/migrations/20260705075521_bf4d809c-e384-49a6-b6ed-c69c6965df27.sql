CREATE OR REPLACE FUNCTION public.is_order_owner(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = _order_id
      AND o.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_order_seller(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.sellers s ON s.id = oi.seller_id
    WHERE oi.order_id = _order_id
      AND s.user_id = _user_id
      AND s.is_approved = true
      AND s.is_blocked = false
  )
$$;

CREATE OR REPLACE FUNCTION public.is_seller_order_item(_seller_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sellers s
    WHERE s.id = _seller_id
      AND s.user_id = _user_id
      AND s.is_approved = true
      AND s.is_blocked = false
  )
$$;

DROP POLICY IF EXISTS "Approved sellers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Approved sellers can update their order status" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Approved sellers can view their order items" ON public.order_items;

CREATE POLICY "Approved sellers can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_order_seller(id, auth.uid()));

CREATE POLICY "Approved sellers can update their order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_order_seller(id, auth.uid()))
WITH CHECK (public.is_order_seller(id, auth.uid()));

CREATE POLICY "Users can view their own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (public.is_order_owner(order_id, auth.uid()));

CREATE POLICY "Users can insert order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_order_owner(order_id, auth.uid()));

CREATE POLICY "Approved sellers can view their order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (public.is_seller_order_item(seller_id, auth.uid()));