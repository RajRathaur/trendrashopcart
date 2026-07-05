DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
  END LOOP;
END;
$$;

GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.delivery_pincodes TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT ON public.site_content TO anon;

REVOKE ALL ON public.admin_audit_logs FROM anon;
REVOKE ALL ON public.cart_items FROM anon;
REVOKE ALL ON public.chat_messages FROM anon;
REVOKE ALL ON public.chat_threads FROM anon;
REVOKE ALL ON public.coin_earn_log FROM anon;
REVOKE ALL ON public.coin_wallet FROM anon;
REVOKE ALL ON public.contact_messages FROM anon;
REVOKE ALL ON public.coupons FROM anon;
REVOKE ALL ON public.game_rewards FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.order_items FROM anon;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.payment_confirmations FROM anon;
REVOKE ALL ON public.phone_otps FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.redeem_requests FROM anon;
REVOKE ALL ON public.sellers FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.wishlist_items FROM anon;