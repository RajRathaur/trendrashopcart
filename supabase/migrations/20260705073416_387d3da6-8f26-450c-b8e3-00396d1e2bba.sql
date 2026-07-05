-- Restore explicit Data API grants required by Lovable Cloud/PostgREST.
-- RLS policies remain the source of truth for row-level access.

-- Admin/audit and auth-only user tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO authenticated;
GRANT ALL ON public.sellers TO service_role;

-- Catalog/public read tables
GRANT SELECT ON public.banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

GRANT SELECT ON public.delivery_pincodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_pincodes TO authenticated;
GRANT ALL ON public.delivery_pincodes TO service_role;

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

-- Cart, wishlist, orders, and invoices/order items
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

-- Payments, confirmations, coupons, notifications
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_confirmations TO authenticated;
GRANT ALL ON public.payment_confirmations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- Reviews and engagement features
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_rewards TO authenticated;
GRANT ALL ON public.game_rewards TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coin_wallet TO authenticated;
GRANT ALL ON public.coin_wallet TO service_role;

GRANT SELECT ON public.coin_earn_log TO authenticated;
GRANT ALL ON public.coin_earn_log TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.redeem_requests TO authenticated;
GRANT ALL ON public.redeem_requests TO service_role;

-- Contact and chat
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

-- OTP table is service-only by policy
GRANT ALL ON public.phone_otps TO service_role;