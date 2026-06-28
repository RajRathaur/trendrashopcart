
-- 1) Coupons: remove broad SELECT exposure; provide RPC for validation only
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _order_amount numeric)
RETURNS TABLE (
  code text,
  discount_type text,
  discount_value numeric,
  max_discount_amount numeric,
  min_order_amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c public.coupons%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _code IS NULL OR length(trim(_code)) = 0 THEN
    RAISE EXCEPTION 'Invalid code';
  END IF;

  SELECT * INTO _c
  FROM public.coupons
  WHERE upper(coupons.code) = upper(trim(_code))
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon code';
  END IF;
  IF _c.expires_at IS NOT NULL AND _c.expires_at < now() THEN
    RAISE EXCEPTION 'This coupon has expired';
  END IF;
  IF _c.usage_limit IS NOT NULL AND COALESCE(_c.used_count, 0) >= _c.usage_limit THEN
    RAISE EXCEPTION 'This coupon has reached its usage limit';
  END IF;
  IF _c.min_order_amount IS NOT NULL AND _order_amount < _c.min_order_amount THEN
    RAISE EXCEPTION 'Minimum order amount is %', _c.min_order_amount;
  END IF;

  RETURN QUERY SELECT _c.code, _c.discount_type, _c.discount_value, _c.max_discount_amount, _c.min_order_amount;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;

-- 2) product_reviews: stop exposing user_id to anonymous/public role.
--    Restrict base-table SELECT to authenticated users; provide SECURITY DEFINER RPCs
--    for review listings that omit user_id.
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.product_reviews;

CREATE POLICY "Authenticated users can view reviews"
  ON public.product_reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.get_product_reviews(_product_id uuid, _limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  rating int,
  title text,
  comment text,
  is_verified_purchase boolean,
  created_at timestamptz,
  reviewer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.product_id, r.rating, r.title, r.comment,
         r.is_verified_purchase, r.created_at,
         COALESCE(p.full_name, 'Trendra Customer') AS reviewer_name
  FROM public.product_reviews r
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.product_id = _product_id
  ORDER BY r.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 20), 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_product_reviews(uuid, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_recent_reviews(_limit int DEFAULT 6)
RETURNS TABLE (
  id uuid,
  rating int,
  comment text,
  created_at timestamptz,
  reviewer_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.rating, r.comment, r.created_at,
         COALESCE(p.full_name, 'Trendra Customer') AS reviewer_name
  FROM public.product_reviews r
  LEFT JOIN public.profiles p ON p.user_id = r.user_id
  WHERE r.rating >= 4 AND r.comment IS NOT NULL AND length(trim(r.comment)) > 0
  ORDER BY r.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 6), 50));
$$;

GRANT EXECUTE ON FUNCTION public.get_recent_reviews(int) TO anon, authenticated;
