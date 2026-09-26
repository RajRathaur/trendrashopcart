CREATE OR REPLACE FUNCTION public.enforce_order_item_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _product_price NUMERIC(10,2);
  _product_seller UUID;
  _product_active BOOLEAN;
  _product_stock INTEGER;
  _tiers JSONB;
  _tier JSONB;
  _tier_qty INT;
  _tier_price NUMERIC;
  _remaining INT;
  _total NUMERIC;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  IF NEW.product_id IS NULL THEN
    -- No product linkage: keep the client-supplied price but require positive.
    IF NEW.price IS NULL OR NEW.price < 0 THEN
      RAISE EXCEPTION 'Invalid price';
    END IF;
    RETURN NEW;
  END IF;

  SELECT p.price, p.seller_id, p.is_active, p.stock, p.price_tiers
    INTO _product_price, _product_seller, _product_active, _product_stock, _tiers
  FROM public.products p
  WHERE p.id = NEW.product_id;

  IF _product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  IF _product_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Product is not available for purchase';
  END IF;

  -- Pack-aware pricing: apply cheapest bulk packs (largest first) when they
  -- beat the single-unit price, then charge the remainder at unit price.
  _remaining := NEW.quantity;
  _total := 0;
  IF _tiers IS NOT NULL AND jsonb_typeof(_tiers) = 'array' THEN
    FOR _tier IN
      SELECT value FROM jsonb_array_elements(_tiers)
      ORDER BY (value->>'qty')::int DESC
    LOOP
      _tier_qty := (_tier->>'qty')::int;
      _tier_price := (_tier->>'price')::numeric;
      IF _tier_qty > 1 AND _tier_price > 0 AND _tier_price < _product_price * _tier_qty THEN
        _total := _total + floor(_remaining / _tier_qty) * _tier_price;
        _remaining := _remaining % _tier_qty;
      END IF;
    END LOOP;
  END IF;
  _total := _total + _remaining * _product_price;

  -- Store the effective per-unit price so total = price * quantity stays exact.
  NEW.price := round((_total / NEW.quantity)::numeric, 2);

  -- Snap seller_id to the product's actual seller.
  NEW.seller_id := _product_seller;

  RETURN NEW;
END;
$function$