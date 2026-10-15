CREATE OR REPLACE FUNCTION public.validate_print_design()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _owner uuid; side jsonb; side_key text; enabled boolean;
BEGIN
IF NEW.print_design IS NULL THEN RETURN NEW; END IF;
IF TG_OP = 'UPDATE' AND NEW.print_design IS NOT DISTINCT FROM OLD.print_design AND NEW.product_id IS NOT DISTINCT FROM OLD.product_id THEN RETURN NEW; END IF;
SELECT p.customization_enabled INTO enabled FROM public.products p WHERE p.id = NEW.product_id;
IF enabled IS DISTINCT FROM true THEN RAISE EXCEPTION 'Custom printing is not enabled for this product'; END IF;
IF TG_TABLE_NAME = 'cart_items' THEN _owner := NEW.user_id; ELSE SELECT o.user_id INTO _owner FROM public.orders o WHERE o.id = NEW.order_id; END IF;
IF _owner IS NULL OR (_owner IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN RAISE EXCEPTION 'Print design owner mismatch'; END IF;
IF jsonb_typeof(NEW.print_design) <> 'object' OR NEW.print_design->>'version' <> '1' OR NOT (NEW.print_design ? 'front' OR NEW.print_design ? 'back') OR octet_length(NEW.print_design::text) > 12000 THEN RAISE EXCEPTION 'Invalid print design'; END IF;
FOR side_key, side IN SELECT e.key, e.value FROM jsonb_each(NEW.print_design) e WHERE e.key <> 'version' LOOP
IF side_key NOT IN ('front','back') OR jsonb_typeof(side) <> 'object' THEN RAISE EXCEPTION 'Invalid print side'; END IF;
IF NOT (side ?& ARRAY['size','x','y','path']) THEN RAISE EXCEPTION 'Invalid print placement'; END IF;
IF NOT EXISTS (SELECT 1 FROM storage.objects so WHERE so.bucket_id = 'print-designs' AND so.name = side->>'path' AND (storage.foldername(so.name))[1] = _owner::text) THEN RAISE EXCEPTION 'Design file is not owned by customer'; END IF;
IF (side->>'size')::numeric NOT BETWEEN 30 AND 100 OR (side->>'x')::numeric NOT BETWEEN 0 AND 100 - (side->>'size')::numeric OR (side->>'y')::numeric NOT BETWEEN 0 AND 100 - (side->>'size')::numeric THEN RAISE EXCEPTION 'Invalid print placement'; END IF;
END LOOP;
RETURN NEW;
END; $function$;