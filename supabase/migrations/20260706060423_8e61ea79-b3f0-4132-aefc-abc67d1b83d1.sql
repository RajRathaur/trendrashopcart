
ALTER TABLE public.delivery_pincodes
  ADD COLUMN IF NOT EXISTS delivery_charge numeric(10,2) NOT NULL DEFAULT 0;
