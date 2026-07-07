GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_seller(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_owner(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_seller(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_seller_order_item(uuid, uuid) TO anon, authenticated;