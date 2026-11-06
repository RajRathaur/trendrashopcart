DROP POLICY IF EXISTS "Social profiles are public" ON public.social_profiles;
CREATE POLICY "Logged-in users see social profiles" ON public.social_profiles
FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.social_profiles FROM anon;

DROP POLICY IF EXISTS "Follows are public" ON public.user_follows;
CREATE POLICY "Logged-in users see follows" ON public.user_follows
FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.user_follows FROM anon;

CREATE TABLE public.tech_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Tech',
  video_url text NOT NULL,
  thumbnail_url text,
  duration_seconds numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  view_count integer NOT NULL DEFAULT 0,
  monetized_views integer NOT NULL DEFAULT 0,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tv_title_len CHECK (char_length(title) BETWEEN 3 AND 120),
  CONSTRAINT tv_desc_len CHECK (char_length(description) <= 3000),
  CONSTRAINT tv_cat_len CHECK (char_length(category) <= 40),
  CONSTRAINT tv_duration CHECK (duration_seconds > 0 AND duration_seconds <= 1800.5),
  CONSTRAINT tv_status CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT tv_note_len CHECK (admin_note IS NULL OR char_length(admin_note) <= 500)
);
CREATE INDEX tech_videos_feed_idx ON public.tech_videos (status, approved_at DESC);
CREATE INDEX tech_videos_user_idx ON public.tech_videos (user_id, created_at DESC);
GRANT SELECT ON public.tech_videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_videos TO authenticated;
GRANT ALL ON public.tech_videos TO service_role;
ALTER TABLE public.tech_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved videos visible, owners and admins see all" ON public.tech_videos
FOR SELECT TO anon, authenticated
USING (status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users post own videos" ON public.tech_videos
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners and admins update videos" ON public.tech_videos
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners and admins delete videos" ON public.tech_videos
FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tech_video_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _admin boolean := public.has_role(auth.uid(), 'admin');
  _prefix text;
  _pending int;
BEGIN
  NEW.title := btrim(coalesce(NEW.title, ''));
  NEW.description := btrim(coalesce(NEW.description, ''));
  NEW.updated_at := now();
  IF current_user NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.view_count := 0; NEW.monetized_views := 0; NEW.created_at := now();
    IF _uid IS NULL OR NEW.user_id <> _uid THEN RAISE EXCEPTION 'You can only post videos for yourself'; END IF;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _uid AND is_blocked) THEN
      RAISE EXCEPTION 'Your account is blocked from posting videos';
    END IF;
    IF NOT _admin THEN
      SELECT count(*) INTO _pending FROM public.tech_videos WHERE user_id = _uid AND status = 'pending';
      IF _pending >= 5 THEN RAISE EXCEPTION 'You already have 5 videos waiting for approval'; END IF;
      NEW.status := 'pending'; NEW.admin_note := NULL; NEW.approved_at := NULL;
    ELSIF NEW.status = 'approved' THEN NEW.approved_at := now();
    END IF;
    _prefix := '%/storage/v1/object/public/product-images/videos/' || NEW.user_id::text || '/%';
    IF NEW.video_url NOT LIKE _prefix OR (NEW.thumbnail_url IS NOT NULL AND NEW.thumbnail_url NOT LIKE _prefix) THEN
      RAISE EXCEPTION 'Invalid video file';
    END IF;
  ELSE
    NEW.user_id := OLD.user_id; NEW.video_url := OLD.video_url; NEW.created_at := OLD.created_at;
    NEW.view_count := OLD.view_count; NEW.monetized_views := OLD.monetized_views;
    NEW.duration_seconds := OLD.duration_seconds;
    IF NOT _admin THEN
      NEW.thumbnail_url := OLD.thumbnail_url;
      NEW.admin_note := OLD.admin_note;
      IF NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description OR NEW.category IS DISTINCT FROM OLD.category THEN
        NEW.status := 'pending'; NEW.approved_at := NULL;
      ELSE
        NEW.status := OLD.status; NEW.approved_at := OLD.approved_at;
      END IF;
    ELSIF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
      NEW.approved_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER tech_video_guard_trg BEFORE INSERT OR UPDATE ON public.tech_videos
FOR EACH ROW EXECUTE FUNCTION public.tech_video_guard();

CREATE TABLE public.creator_monetization (
  user_id uuid PRIMARY KEY REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  full_name text NOT NULL,
  upi_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cm_status CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT cm_name CHECK (char_length(full_name) BETWEEN 2 AND 80),
  CONSTRAINT cm_upi CHECK (upi_id ~ '^[A-Za-z0-9._-]{2,64}@[A-Za-z]{2,32}$')
);
GRANT SELECT, INSERT, UPDATE ON public.creator_monetization TO authenticated;
GRANT ALL ON public.creator_monetization TO service_role;
ALTER TABLE public.creator_monetization ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner and admin read monetization" ON public.creator_monetization
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner applies for monetization" ON public.creator_monetization
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner and admin update monetization" ON public.creator_monetization
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.creator_monetization_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  NEW.full_name := btrim(NEW.full_name);
  NEW.upi_id := lower(btrim(NEW.upi_id));
  NEW.updated_at := now();
  IF current_user IN ('anon','authenticated') AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'UPDATE' THEN NEW.user_id := OLD.user_id; NEW.created_at := OLD.created_at; END IF;
    NEW.status := 'pending'; NEW.admin_note := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER creator_monetization_guard_trg BEFORE INSERT OR UPDATE ON public.creator_monetization
FOR EACH ROW EXECUTE FUNCTION public.creator_monetization_guard();

CREATE TABLE public.creator_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  reference text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cp_ref_len CHECK (char_length(reference) <= 100)
);
GRANT SELECT, INSERT ON public.creator_payouts TO authenticated;
GRANT ALL ON public.creator_payouts TO service_role;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner and admin read payouts" ON public.creator_payouts
FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins record payouts" ON public.creator_payouts
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE TABLE public.tech_video_views (
  video_id uuid NOT NULL REFERENCES public.tech_videos(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL,
  day date NOT NULL DEFAULT current_date,
  PRIMARY KEY (video_id, viewer_id, day)
);
GRANT SELECT ON public.tech_video_views TO authenticated;
GRANT ALL ON public.tech_video_views TO service_role;
ALTER TABLE public.tech_video_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read video views" ON public.tech_video_views
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.register_tech_video_view(_video_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid;
  _paid boolean;
BEGIN
  SELECT user_id INTO _owner FROM public.tech_videos WHERE id = _video_id AND status = 'approved';
  IF _owner IS NULL THEN RETURN; END IF;
  IF _uid IS NULL THEN
    UPDATE public.tech_videos SET view_count = view_count + 1 WHERE id = _video_id;
    RETURN;
  END IF;
  IF _uid = _owner THEN RETURN; END IF;
  INSERT INTO public.tech_video_views (video_id, viewer_id) VALUES (_video_id, _uid) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT EXISTS (SELECT 1 FROM public.creator_monetization WHERE user_id = _owner AND status = 'approved') INTO _paid;
  UPDATE public.tech_videos
     SET view_count = view_count + 1,
         monetized_views = monetized_views + CASE WHEN _paid THEN 1 ELSE 0 END
   WHERE id = _video_id;
END $$;
REVOKE ALL ON FUNCTION public.register_tech_video_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_tech_video_view(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.video_rate_per_1000()
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT NULLIF(regexp_replace(content_value, '[^0-9.]', '', 'g'), '')::numeric
                   FROM public.site_content WHERE content_key = 'video_rate_per_1000' LIMIT 1), 10)
$$;
REVOKE ALL ON FUNCTION public.video_rate_per_1000() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.video_rate_per_1000() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.creator_balances(_user_id uuid DEFAULT NULL)
RETURNS TABLE (user_id uuid, username text, monetized_views bigint, earned numeric, paid numeric, balance numeric, status text, upi_id text, full_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _rate numeric := public.video_rate_per_1000();
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN _user_id := auth.uid(); END IF;
  RETURN QUERY
  SELECT sp.user_id, sp.username,
         coalesce(v.mv, 0)::bigint,
         round(coalesce(v.mv, 0) * _rate / 1000, 2),
         coalesce(p.paid, 0)::numeric,
         round(coalesce(v.mv, 0) * _rate / 1000, 2) - coalesce(p.paid, 0),
         cm.status, cm.upi_id, cm.full_name
  FROM public.social_profiles sp
  LEFT JOIN public.creator_monetization cm ON cm.user_id = sp.user_id
  LEFT JOIN (SELECT t.user_id, sum(t.monetized_views) mv FROM public.tech_videos t GROUP BY t.user_id) v ON v.user_id = sp.user_id
  LEFT JOIN (SELECT c.user_id, sum(c.amount) paid FROM public.creator_payouts c GROUP BY c.user_id) p ON p.user_id = sp.user_id
  WHERE (_user_id IS NULL AND (cm.user_id IS NOT NULL OR v.mv > 0)) OR sp.user_id = _user_id;
END $$;
REVOKE ALL ON FUNCTION public.creator_balances(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.creator_balances(uuid) TO authenticated;

CREATE POLICY "Users upload their own video files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'videos'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND lower(storage.extension(name)) = ANY (ARRAY['mp4','webm','mov','jpg','jpeg','png','webp'])
);
CREATE POLICY "Users delete their own video files" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'videos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);