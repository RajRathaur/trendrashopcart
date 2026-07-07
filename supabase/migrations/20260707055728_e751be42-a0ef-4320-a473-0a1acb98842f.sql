
-- Lock down function execution: revoke from PUBLIC/anon by default,
-- then re-grant to authenticated only on functions users legitimately call.

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Functions authenticated users call directly from the client
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_seller(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_seller(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_seller_order_item(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_coins(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_redeem(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.broadcast_notification(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_overview() TO authenticated;

-- Public read functions (product reviews are visible on product pages without login)
GRANT EXECUTE ON FUNCTION public.get_product_reviews(uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_reviews(integer) TO anon, authenticated;

-- Service role keeps everything for edge functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
