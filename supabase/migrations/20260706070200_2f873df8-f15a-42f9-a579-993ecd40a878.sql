-- 1) SUPA_function_search_path_mutable: set search_path on remaining functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;

-- 2) product_reviews_authenticated_wide_open: restrict SELECT to reviews of active products
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view reviews of active products"
  ON public.product_reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_reviews.product_id
        AND p.is_active = true
    )
  );

-- 3) sellers_update_toctou_risk: replace fragile WITH CHECK subquery with a BEFORE UPDATE trigger
--    that locks privileged fields for non-admin self-updates.
DROP POLICY IF EXISTS "Sellers can update own non-privileged fields" ON public.sellers;
CREATE POLICY "Sellers can update own profile"
  ON public.sellers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.protect_seller_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins may change any field.
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change is_approved / is_blocked. Force the OLD values.
  NEW.is_approved := OLD.is_approved;
  NEW.is_blocked  := OLD.is_blocked;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_seller_privileged_fields ON public.sellers;
CREATE TRIGGER protect_seller_privileged_fields
  BEFORE UPDATE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_seller_privileged_fields();

-- 4) order_price_tamper: enforce server-side pricing on order_items and recompute orders.total_amount
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _product_price NUMERIC(10,2);
  _product_seller UUID;
  _product_active BOOLEAN;
  _product_stock INTEGER;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF NEW.product_id IS NULL THEN
    -- No product linkage: keep the client-supplied price but require positive.
    IF NEW.price IS NULL OR NEW.price < 0 THEN
      RAISE EXCEPTION 'Invalid price';
    END IF;
    RETURN NEW;
  END IF;

  SELECT p.price, p.seller_id, p.is_active, p.stock
    INTO _product_price, _product_seller, _product_active, _product_stock
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF _product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF _product_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Product is not available for purchase';
  END IF;

  -- Overwrite client-supplied price with the live product price.
  NEW.price := _product_price;

  -- Snap seller_id to the product's actual seller.
  NEW.seller_id := _product_seller;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_order_item_price ON public.order_items;
CREATE TRIGGER enforce_order_item_price
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_item_price();

-- Recompute orders.total_amount from the authoritative order_items rows.
CREATE OR REPLACE FUNCTION public.recompute_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order_id UUID;
  _new_total NUMERIC(10,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    _order_id := OLD.order_id;
  ELSE
    _order_id := NEW.order_id;
  END IF;

  SELECT COALESCE(SUM(price * quantity), 0)
    INTO _new_total
  FROM public.order_items
  WHERE order_id = _order_id;

  -- Enforce non-zero total to satisfy existing check_total_positive on orders.
  IF _new_total <= 0 THEN
    _new_total := 0.01;
  END IF;

  UPDATE public.orders
    SET total_amount = _new_total,
        updated_at = now()
  WHERE id = _order_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recompute_order_total ON public.order_items;
CREATE TRIGGER recompute_order_total
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recompute_order_total();