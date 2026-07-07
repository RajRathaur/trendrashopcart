ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS check_phone_format;
ALTER TABLE public.orders ADD CONSTRAINT check_phone_format CHECK (shipping_phone ~ '^[+0-9 ().\-]{7,20}$') NOT VALID;