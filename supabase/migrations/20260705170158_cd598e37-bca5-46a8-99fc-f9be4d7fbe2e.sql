DROP FUNCTION IF EXISTS public.get_admin_users_overview();

CREATE OR REPLACE FUNCTION public.get_admin_users_overview()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  address text,
  city text,
  state text,
  pincode text,
  is_blocked boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  roles text[],
  order_count bigint,
  last_order_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.full_name,
    COALESCE(p.phone, u.phone::text) AS phone,
    p.address,
    p.city,
    p.state,
    p.pincode,
    p.is_blocked,
    p.created_at,
    u.last_sign_in_at,
    COALESCE((SELECT array_agg(ur.role::text) FROM public.user_roles ur WHERE ur.user_id = p.user_id), ARRAY['user']::text[]) AS roles,
    COALESCE((SELECT count(*) FROM public.orders o WHERE o.user_id = p.user_id), 0) AS order_count,
    (SELECT max(o.created_at) FROM public.orders o WHERE o.user_id = p.user_id) AS last_order_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_overview() TO authenticated;