
CREATE POLICY "Admins can read email send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read suppressed emails"
ON public.suppressed_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.email_send_log TO authenticated;
GRANT SELECT ON public.suppressed_emails TO authenticated;
