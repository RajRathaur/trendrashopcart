
ALTER TABLE public.orders
  ADD CONSTRAINT check_total_positive CHECK (total_amount > 0) NOT VALID,
  ADD CONSTRAINT check_phone_format CHECK (shipping_phone ~ '^[+0-9 \-]{7,20}$') NOT VALID,
  ADD CONSTRAINT check_pincode_format CHECK (shipping_pincode ~ '^[0-9]{6}$') NOT VALID,
  ADD CONSTRAINT check_address_length CHECK (length(shipping_address) BETWEEN 1 AND 500) NOT VALID;
