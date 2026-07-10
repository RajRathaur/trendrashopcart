-- Ensure clients can execute the RLS helper functions used inside policies.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_seller(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_order_owner(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_order_seller(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_seller_order_item(uuid, uuid) TO anon, authenticated, service_role;

-- Atomic, safe coupon usage counter. Called from clients after a successful order.
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _code IS NULL OR length(trim(_code)) = 0 THEN
    RETURN;
  END IF;
  UPDATE public.coupons
    SET used_count = COALESCE(used_count, 0) + 1,
        updated_at = now()
    WHERE upper(code) = upper(trim(_code))
      AND is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text) TO authenticated, service_role;
