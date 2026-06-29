
-- Prevent sellers from approving or unblocking themselves
DROP POLICY IF EXISTS "Sellers can update own record" ON public.sellers;
DROP POLICY IF EXISTS "Users can update their own seller record" ON public.sellers;
DROP POLICY IF EXISTS "Sellers can update their own record" ON public.sellers;

CREATE POLICY "Sellers can update own non-privileged fields"
ON public.sellers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_approved = (SELECT s.is_approved FROM public.sellers s WHERE s.id = sellers.id)
  AND is_blocked = (SELECT s.is_blocked FROM public.sellers s WHERE s.id = sellers.id)
);
