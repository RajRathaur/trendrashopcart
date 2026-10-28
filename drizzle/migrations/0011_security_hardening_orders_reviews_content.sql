-- 1. Order items must be linked to a real product for customers, so the
--    database always sets the price. Admin/back-office (service) inserts keep
--    the old behaviour for manual items.
CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _product_price NUMERIC(10,2);
  _product_seller UUID;
  _product_active BOOLEAN;
  _product_stock INTEGER;
  _tiers JSONB;
  _tier JSONB;
  _tier_qty INT;
  _tier_price NUMERIC;
  _remaining INT;
  _total NUMERIC;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF NEW.product_id IS NULL THEN
    IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Order items must reference a product';
    END IF;
    IF NEW.price IS NULL OR NEW.price < 0 THEN
      RAISE EXCEPTION 'Invalid price';
    END IF;
    RETURN NEW;
  END IF;

  SELECT p.price, p.seller_id, p.is_active, p.stock, p.price_tiers
    INTO _product_price, _product_seller, _product_active, _product_stock, _tiers
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF _product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF _product_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Product is not available for purchase';
  END IF;

  _remaining := NEW.quantity;
  _total := 0;
  IF _tiers IS NOT NULL AND jsonb_typeof(_tiers) = 'array' THEN
    FOR _tier IN
      SELECT value FROM jsonb_array_elements(_tiers)
      ORDER BY (value->>'qty')::int DESC
    LOOP
      _tier_qty := (_tier->>'qty')::int;
      _tier_price := (_tier->>'price')::numeric;
      IF _tier_qty > 1 AND _tier_price > 0 AND _tier_price < _product_price * _tier_qty THEN
        _total := _total + floor(_remaining / _tier_qty) * _tier_price;
        _remaining := _remaining % _tier_qty;
      END IF;
    END LOOP;
  END IF;
  _total := _total + _remaining * _product_price;

  NEW.price := round((_total / NEW.quantity)::numeric, 2);
  NEW.seller_id := _product_seller;

  RETURN NEW;
END;
$function$;

-- 2. Only approved, non-blocked sellers can see payments for their products.
DROP POLICY IF EXISTS "Sellers can view payments for their products" ON public.payment_confirmations;
CREATE POLICY "Sellers can view payments for their products"
  ON public.payment_confirmations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.products p
    JOIN public.sellers s ON s.id = p.seller_id
    WHERE p.id = payment_confirmations.product_id
      AND s.user_id = auth.uid()
      AND s.is_approved = true
      AND s.is_blocked = false
  ));

-- 3. Only admins (or the backend) can set product rating / review count.
CREATE OR REPLACE FUNCTION public.protect_product_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.rating := 0;
    NEW.review_count := 0;
  ELSE
    NEW.rating := OLD.rating;
    NEW.review_count := OLD.review_count;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.protect_product_rating() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_product_rating_trigger ON public.products;
CREATE TRIGGER protect_product_rating_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.protect_product_rating();

-- 4. Reviews are only listed for products that are on sale.
CREATE OR REPLACE FUNCTION public.get_product_reviews(_product_id uuid, _limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, product_id uuid, rating integer, title text, comment text, is_verified_purchase boolean, created_at timestamp with time zone, reviewer_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT r.id, r.product_id, r.rating, r.title, r.comment,
         r.is_verified_purchase, r.created_at,
         COALESCE(p.full_name, 'Trendra Customer') AS reviewer_name
  FROM public.product_reviews r
  JOIN public.products pr ON pr.id = r.product_id AND pr.is_active = true
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.product_id = _product_id
  ORDER BY r.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 20), 100));
$function$;

-- 5. Site text stays public; email templates/sender are admin-only.
DROP POLICY IF EXISTS "Anyone can read site content" ON public.site_content;
CREATE POLICY "Anyone can read public site content"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (content_key NOT LIKE 'email\_%');
CREATE POLICY "Admins can read all site content"
  ON public.site_content FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Product photos are served through public links; listing the bucket
--    is limited to admins.
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Admins can list product images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 7. Private per-job tokens used by scheduled backend jobs.
CREATE TABLE IF NOT EXISTS public.internal_job_tokens (
  name text PRIMARY KEY,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.internal_job_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.internal_job_tokens TO service_role;
ALTER TABLE public.internal_job_tokens ENABLE ROW LEVEL SECURITY;
