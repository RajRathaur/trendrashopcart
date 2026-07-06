
DO $$
DECLARE tbl record; has_priv boolean;
BEGIN
  FOR tbl IN SELECT c.relname AS n FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE c.relkind='r' AND ns.nspname='public' LOOP
    SELECT EXISTS(SELECT 1 FROM information_schema.role_table_grants WHERE grantee='authenticated' AND table_schema='public' AND table_name=tbl.n AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) INTO has_priv;
    IF NOT has_priv THEN EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.n); END IF;
    SELECT EXISTS(SELECT 1 FROM information_schema.role_table_grants WHERE grantee='service_role' AND table_schema='public' AND table_name=tbl.n AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) INTO has_priv;
    IF NOT has_priv THEN EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.n); END IF;
  END LOOP;
END $$;

-- Public read for catalog / storefront tables (policies already allow public reads)
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.sellers TO anon;
GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT ON public.delivery_pincodes TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.game_rewards TO anon;

-- Ensure sequence usage for inserts
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
