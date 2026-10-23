CREATE TABLE public.ai_tryon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'started',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_tryon_usage TO authenticated;
GRANT ALL ON public.ai_tryon_usage TO service_role;
ALTER TABLE public.ai_tryon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own AI try-on usage" ON public.ai_tryon_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all AI try-on usage" ON public.ai_tryon_usage
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX ai_tryon_usage_user_day_idx ON public.ai_tryon_usage (user_id, created_at DESC);