UPDATE public.products SET cod_available = false WHERE customization_enabled = true;

CREATE OR REPLACE FUNCTION public.enforce_pod_prepaid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.customization_enabled = true THEN
    NEW.cod_available := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_pod_prepaid_trigger ON public.products;
CREATE TRIGGER enforce_pod_prepaid_trigger
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.enforce_pod_prepaid();