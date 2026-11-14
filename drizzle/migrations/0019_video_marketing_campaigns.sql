CREATE TABLE public.video_campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, video_id uuid NOT NULL REFERENCES public.tech_videos(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('boost','sponsored')), brand_name text NOT NULL DEFAULT '' CHECK(char_length(brand_name)<=80),
 pack_days integer NOT NULL CHECK(pack_days IN (3,7,30)), amount_inr numeric NOT NULL CHECK(amount_inr>0),
 payment_status text NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid','paid')), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','paused')),
 razorpay_payment_id text UNIQUE, starts_at timestamptz, ends_at timestamptz, admin_note text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_campaigns TO authenticated;
GRANT ALL ON public.video_campaigns TO service_role;
ALTER TABLE public.video_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_owner_admin_read ON public.video_campaigns FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX video_campaign_active_idx ON public.video_campaigns(status,payment_status,ends_at);
CREATE TABLE public.video_campaign_events (
 campaign_id uuid NOT NULL REFERENCES public.video_campaigns(id) ON DELETE CASCADE, user_id uuid NOT NULL, event_type text NOT NULL CHECK(event_type IN ('impression','click')), day date NOT NULL DEFAULT CURRENT_DATE,
 PRIMARY KEY(campaign_id,user_id,event_type,day)
);
GRANT SELECT ON public.video_campaign_events TO authenticated;
GRANT ALL ON public.video_campaign_events TO service_role;
ALTER TABLE public.video_campaign_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_event_owner_admin_read ON public.video_campaign_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.video_campaigns c WHERE c.id=campaign_id AND (c.user_id=auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE OR REPLACE FUNCTION public.promotion_packs() RETURNS TABLE(days integer, price integer) LANGUAGE sql IMMUTABLE SET search_path=public AS $$ VALUES (3,99),(7,199),(30,699) $$;
CREATE OR REPLACE FUNCTION public.create_video_campaign(_video_id uuid,_kind text,_brand_name text,_days integer) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid; _price integer; _owner uuid;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE user_id=auth.uid() AND is_blocked) THEN RAISE EXCEPTION 'Account blocked'; END IF;
 SELECT user_id INTO _owner FROM public.tech_videos WHERE id=_video_id AND status='approved';
 IF _owner IS NULL THEN RAISE EXCEPTION 'Choose an approved video'; END IF;
 IF _kind NOT IN ('boost','sponsored') OR _kind IS NULL THEN RAISE EXCEPTION 'Invalid promotion type'; END IF;
 IF _kind='boost' AND _owner<>auth.uid() THEN RAISE EXCEPTION 'You can only boost your own videos'; END IF;
 IF _kind='sponsored' AND (char_length(btrim(coalesce(_brand_name,'')))<2 OR char_length(_brand_name)>80) THEN RAISE EXCEPTION 'Brand name required (2-80 characters)'; END IF;
 SELECT price INTO _price FROM public.promotion_packs() WHERE days=_days;
 IF _price IS NULL THEN RAISE EXCEPTION 'Invalid promotion pack'; END IF;
 IF (SELECT count(*) FROM public.video_campaigns WHERE user_id=auth.uid() AND created_at>now()-interval '24 hours')>=20 THEN RAISE EXCEPTION 'Daily campaign limit reached'; END IF;
 INSERT INTO public.video_campaigns(user_id,video_id,kind,brand_name,pack_days,amount_inr) VALUES(auth.uid(),_video_id,_kind,CASE WHEN _kind='sponsored' THEN btrim(_brand_name) ELSE '' END,_days,_price) RETURNING id INTO _id;
 RETURN _id;
END $$;
CREATE OR REPLACE FUNCTION public.moderate_video_campaign(_id uuid,_status text,_note text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _c public.video_campaigns%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin required'; END IF;
 IF _status NOT IN ('approved','rejected','paused') OR _status IS NULL OR char_length(coalesce(_note,''))>500 THEN RAISE EXCEPTION 'Invalid moderation'; END IF;
 SELECT * INTO _c FROM public.video_campaigns WHERE id=_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Campaign missing'; END IF;
 IF _status='approved' AND (_c.payment_status<>'paid' OR NOT EXISTS(SELECT 1 FROM public.tech_videos WHERE id=_c.video_id AND status='approved')) THEN RAISE EXCEPTION 'Paid campaign and approved video required'; END IF;
 IF _status='approved' AND _c.ends_at<=now() THEN RAISE EXCEPTION 'Campaign has expired'; END IF;
 UPDATE public.video_campaigns SET status=_status,admin_note=coalesce(_note,''),starts_at=CASE WHEN _status='approved' THEN coalesce(starts_at,now()) ELSE starts_at END,ends_at=CASE WHEN _status='approved' THEN coalesce(ends_at,now()+make_interval(days=>pack_days)) ELSE ends_at END WHERE id=_id;
END $$;
CREATE OR REPLACE FUNCTION public.active_video_campaigns() RETURNS TABLE(campaign_id uuid,kind text,brand_name text,video_id uuid,title text,thumbnail_url text,duration_seconds numeric,category text,view_count integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT c.id,c.kind,c.brand_name,v.id,v.title,v.thumbnail_url,v.duration_seconds,v.category,v.view_count FROM public.video_campaigns c JOIN public.tech_videos v ON v.id=c.video_id WHERE c.payment_status='paid' AND c.status='approved' AND c.starts_at<=now() AND c.ends_at>now() AND v.status='approved' ORDER BY c.starts_at DESC LIMIT 12
$$;
CREATE OR REPLACE FUNCTION public.record_campaign_event(_id uuid,_event text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RETURN; END IF;
 IF _event NOT IN ('impression','click') OR _event IS NULL THEN RAISE EXCEPTION 'Invalid event'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.video_campaigns c JOIN public.tech_videos v ON v.id=c.video_id WHERE c.id=_id AND c.user_id<>auth.uid() AND c.status='approved' AND c.payment_status='paid' AND c.starts_at<=now() AND c.ends_at>now() AND v.status='approved') THEN RETURN; END IF;
 INSERT INTO public.video_campaign_events(campaign_id,user_id,event_type) VALUES(_id,auth.uid(),_event) ON CONFLICT DO NOTHING;
END $$;
CREATE OR REPLACE FUNCTION public.campaign_metrics() RETURNS TABLE(campaign_id uuid,impressions bigint,clicks bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT c.id,count(e.campaign_id) FILTER(WHERE e.event_type='impression'),count(e.campaign_id) FILTER(WHERE e.event_type='click') FROM public.video_campaigns c LEFT JOIN public.video_campaign_events e ON e.campaign_id=c.id WHERE auth.uid() IS NOT NULL AND (c.user_id=auth.uid() OR public.has_role(auth.uid(),'admin')) GROUP BY c.id
$$;
REVOKE ALL ON FUNCTION public.create_video_campaign(uuid,text,text,integer), public.moderate_video_campaign(uuid,text,text), public.record_campaign_event(uuid,text), public.campaign_metrics() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_video_campaign(uuid,text,text,integer), public.moderate_video_campaign(uuid,text,text), public.record_campaign_event(uuid,text), public.campaign_metrics() TO authenticated;
REVOKE ALL ON FUNCTION public.active_video_campaigns(), public.promotion_packs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.active_video_campaigns(), public.promotion_packs() TO anon,authenticated,service_role;