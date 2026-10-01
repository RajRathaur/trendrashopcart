ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_latitude double precision,
  ADD COLUMN IF NOT EXISTS delivery_longitude double precision,
  ADD COLUMN IF NOT EXISTS delivery_location_accuracy double precision;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_shipping_phone_valid,
  ADD CONSTRAINT orders_shipping_phone_valid
    CHECK (shipping_phone ~ '^[6-9][0-9]{9}$') NOT VALID,
  DROP CONSTRAINT IF EXISTS orders_shipping_address_valid,
  ADD CONSTRAINT orders_shipping_address_valid
    CHECK (char_length(btrim(shipping_address)) BETWEEN 10 AND 500) NOT VALID,
  DROP CONSTRAINT IF EXISTS orders_delivery_coordinates_valid,
  ADD CONSTRAINT orders_delivery_coordinates_valid
    CHECK (
      delivery_latitude IS NOT NULL AND
      delivery_longitude IS NOT NULL AND
      delivery_latitude BETWEEN -90 AND 90 AND
      delivery_longitude BETWEEN -180 AND 180 AND
      (delivery_location_accuracy IS NULL OR delivery_location_accuracy >= 0)
    ) NOT VALID;

COMMENT ON COLUMN public.orders.delivery_latitude IS 'Customer-confirmed GPS latitude required for new orders.';
COMMENT ON COLUMN public.orders.delivery_longitude IS 'Customer-confirmed GPS longitude required for new orders.';
COMMENT ON COLUMN public.orders.delivery_location_accuracy IS 'Browser-reported GPS accuracy in metres.';