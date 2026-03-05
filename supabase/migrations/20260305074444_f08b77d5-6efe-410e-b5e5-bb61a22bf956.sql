
-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true);

-- Create payment confirmations table
CREATE TABLE public.payment_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  product_name TEXT NOT NULL,
  payment_amount NUMERIC NOT NULL,
  screenshot_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  product_id UUID REFERENCES public.products(id),
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (even unauthenticated for simpler checkout)
CREATE POLICY "Anyone can submit payment confirmation"
ON public.payment_confirmations FOR INSERT
WITH CHECK (true);

-- Admins can manage all
CREATE POLICY "Admins can manage all payment confirmations"
ON public.payment_confirmations FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own (by user_id if logged in)
CREATE POLICY "Users can view own confirmations"
ON public.payment_confirmations FOR SELECT
USING (auth.uid() = user_id);

-- Storage policies for payment-screenshots bucket
CREATE POLICY "Anyone can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "Anyone can view payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots');

-- Admins can delete payment screenshots
CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-screenshots' AND public.has_role(auth.uid(), 'admin'::app_role));
