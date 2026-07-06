
CREATE TABLE IF NOT EXISTS public.email_alert_state (
  id integer PRIMARY KEY DEFAULT 1,
  last_alerted_log_id uuid,
  last_alert_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.email_alert_state (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.email_alert_state TO authenticated;
GRANT ALL  ON public.email_alert_state TO service_role;

ALTER TABLE public.email_alert_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email alert state"
ON public.email_alert_state
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
