ALTER TABLE public.products ADD COLUMN customization_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.cart_items ADD COLUMN print_design jsonb;
ALTER TABLE public.order_items ADD COLUMN print_design jsonb;
CREATE POLICY "Print designs owner upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'print-designs' AND (storage.foldername(name))[1] = auth.uid()::text AND lower(storage.extension(name)) IN ('png','jpg','jpeg'));
CREATE POLICY "Print designs owner and admin read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'print-designs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE OR REPLACE FUNCTION public.validate_print_design() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid; side jsonb; side_key text; enabled boolean;
BEGIN
IF NEW.print_design IS NULL THEN RETURN NEW; END IF;
IF TG_OP = 'UPDATE' AND NEW.print_design IS NOT DISTINCT FROM OLD.print_design AND NEW.product_id IS NOT DISTINCT FROM OLD.product_id THEN RETURN NEW; END IF;
SELECT customization_enabled INTO enabled FROM public.products WHERE id = NEW.product_id;
IF enabled IS DISTINCT FROM true THEN RAISE EXCEPTION 'Custom printing is not enabled for this product'; END IF;
IF TG_TABLE_NAME = 'cart_items' THEN owner_id := NEW.user_id; ELSE SELECT user_id INTO owner_id FROM public.orders WHERE id = NEW.order_id; END IF;
IF owner_id IS NULL OR (owner_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(), 'admin')) THEN RAISE EXCEPTION 'Print design owner mismatch'; END IF;
IF jsonb_typeof(NEW.print_design) <> 'object' OR NEW.print_design->>'version' <> '1' OR NOT (NEW.print_design ? 'front' OR NEW.print_design ? 'back') OR octet_length(NEW.print_design::text) > 12000 THEN RAISE EXCEPTION 'Invalid print design'; END IF;
FOR side_key, side IN SELECT key,value FROM jsonb_each(NEW.print_design) WHERE key <> 'version' LOOP
IF side_key NOT IN ('front','back') OR jsonb_typeof(side) <> 'object' THEN RAISE EXCEPTION 'Invalid print side'; END IF;
IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'print-designs' AND name = side->>'path' AND (storage.foldername(name))[1] = owner_id::text) THEN RAISE EXCEPTION 'Design file is not owned by customer'; END IF;
IF (side->>'size')::numeric NOT BETWEEN 30 AND 100 OR (side->>'x')::numeric NOT BETWEEN 0 AND 100 - (side->>'size')::numeric OR (side->>'y')::numeric NOT BETWEEN 0 AND 100 - (side->>'size')::numeric OR NOT (side ?& ARRAY['size','x','y']) THEN RAISE EXCEPTION 'Invalid print placement'; END IF;
END LOOP;
RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_print_design() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_cart_print_design BEFORE INSERT OR UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.validate_print_design();
CREATE TRIGGER validate_order_print_design BEFORE INSERT OR UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.validate_print_design();