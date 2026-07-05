-- Tighten anonymous grants after restoring Data API access.
-- Logged-in access remains explicitly granted; RLS still controls which rows are visible/editable.

REVOKE ALL ON public.admin_audit_logs FROM anon;
REVOKE ALL ON public.cart_items FROM anon;
REVOKE ALL ON public.chat_messages FROM anon;
REVOKE ALL ON public.chat_threads FROM anon;
REVOKE ALL ON public.coin_earn_log FROM anon;
REVOKE ALL ON public.coin_wallet FROM anon;
REVOKE ALL ON public.coupons FROM anon;
REVOKE ALL ON public.game_rewards FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.order_items FROM anon;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.payment_confirmations FROM anon;
REVOKE ALL ON public.phone_otps FROM anon;
REVOKE ALL ON public.product_reviews FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.redeem_requests FROM anon;
REVOKE ALL ON public.sellers FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.wishlist_items FROM anon;

-- Public catalog/content: browsing only for anonymous visitors.
REVOKE ALL ON public.banners FROM anon;
GRANT SELECT ON public.banners TO anon;

REVOKE ALL ON public.categories FROM anon;
GRANT SELECT ON public.categories TO anon;

REVOKE ALL ON public.delivery_pincodes FROM anon;
GRANT SELECT ON public.delivery_pincodes TO anon;

REVOKE ALL ON public.products FROM anon;
GRANT SELECT ON public.products TO anon;

REVOKE ALL ON public.site_content FROM anon;
GRANT SELECT ON public.site_content TO anon;

-- Contact form: anonymous visitors may submit only; they cannot read messages.
REVOKE ALL ON public.contact_messages FROM anon;
GRANT INSERT ON public.contact_messages TO anon;