-- Trendra Reels: Instagram-style short videos, public profiles, likes, comments, follows.
-- Client writes are checked by SECURITY INVOKER guards; counters are only changed by
-- SECURITY DEFINER helpers (which run as the table owner, so current_user is not a client role).

CREATE TABLE public.social_profiles (
  user_id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  followers_count integer NOT NULL DEFAULT 0,
  following_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_username_format CHECK (username ~ '^[a-z0-9._]{3,30}$'),
  CONSTRAINT social_display_len CHECK (char_length(display_name) <= 50),
  CONSTRAINT social_bio_len CHECK (char_length(bio) <= 200)
);
GRANT SELECT ON public.social_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.social_profiles TO authenticated;
GRANT ALL ON public.social_profiles TO service_role;
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social profiles are public"
ON public.social_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users create their own social profile"
ON public.social_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners and admins edit social profiles"
ON public.social_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.social_profile_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  NEW.username := lower(btrim(NEW.username));
  NEW.display_name := btrim(coalesce(NEW.display_name, ''));
  NEW.bio := btrim(coalesce(NEW.bio, ''));
  NEW.updated_at := now();
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.followers_count := 0;
      NEW.following_count := 0;
      NEW.created_at := now();
    ELSE
      NEW.user_id := OLD.user_id;
      NEW.followers_count := OLD.followers_count;
      NEW.following_count := OLD.following_count;
      NEW.created_at := OLD.created_at;
    END IF;
    IF NEW.avatar_url IS NOT NULL
       AND NEW.avatar_url NOT LIKE '%/storage/v1/object/public/product-images/reels/' || NEW.user_id::text || '/%' THEN
      RAISE EXCEPTION 'Invalid profile photo';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER social_profile_guard_trg
BEFORE INSERT OR UPDATE ON public.social_profiles
FOR EACH ROW EXECUTE FUNCTION public.social_profile_guard();

-- Creates a profile with an auto username the first time a user needs one.
CREATE OR REPLACE FUNCTION public.ensure_social_profile()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing text;
  _name text;
  _base text;
  _candidate text;
  _i int := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT username INTO _existing FROM public.social_profiles WHERE user_id = _uid;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;
  SELECT btrim(coalesce(full_name, '')) INTO _name FROM public.profiles WHERE user_id = _uid LIMIT 1;
  _base := left(regexp_replace(lower(coalesce(_name, '')), '[^a-z0-9]', '', 'g'), 15);
  IF char_length(_base) < 3 THEN _base := 'trendra'; END IF;
  LOOP
    _candidate := _base || '_' || lpad(floor(random() * 10000)::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.social_profiles WHERE username = _candidate);
    _i := _i + 1;
    IF _i > 20 THEN _candidate := 'user_' || replace(left(_uid::text, 8), '-', ''); EXIT; END IF;
  END LOOP;
  INSERT INTO public.social_profiles (user_id, username, display_name)
  VALUES (_uid, _candidate, left(coalesce(_name, ''), 50));
  RETURN _candidate;
END $$;
REVOKE ALL ON FUNCTION public.ensure_social_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_social_profile() TO authenticated;

-- Reels
CREATE TABLE public.reels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  video_url text NOT NULL,
  thumbnail_url text,
  caption text NOT NULL DEFAULT '',
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  duration_seconds numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reels_caption_len CHECK (char_length(caption) <= 500),
  CONSTRAINT reels_duration_range CHECK (duration_seconds > 0 AND duration_seconds <= 90.5),
  CONSTRAINT reels_status_valid CHECK (status IN ('pending','approved','rejected')),
  CONSTRAINT reels_note_len CHECK (admin_note IS NULL OR char_length(admin_note) <= 500)
);
CREATE INDEX reels_status_approved_idx ON public.reels (status, approved_at DESC);
CREATE INDEX reels_user_idx ON public.reels (user_id, created_at DESC);

GRANT SELECT ON public.reels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reels TO authenticated;
GRANT ALL ON public.reels TO service_role;
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reels are public, owners and admins see all"
ON public.reels FOR SELECT TO anon, authenticated
USING (status = 'approved' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users post their own reels"
ON public.reels FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update reels"
ON public.reels FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners and admins delete reels"
ON public.reels FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.reel_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_client boolean := current_user IN ('anon', 'authenticated');
  _is_admin boolean := public.has_role(auth.uid(), 'admin');
  _prefix text;
  _pending int;
BEGIN
  NEW.caption := btrim(coalesce(NEW.caption, ''));
  NEW.updated_at := now();
  IF NOT _is_client THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.like_count := 0; NEW.comment_count := 0; NEW.view_count := 0;
    NEW.created_at := now();
    IF _is_admin THEN
      IF NEW.status = 'approved' THEN NEW.approved_at := now(); END IF;
    ELSE
      IF _uid IS NULL OR NEW.user_id <> _uid THEN RAISE EXCEPTION 'You can only post reels for yourself'; END IF;
      IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _uid AND is_blocked) THEN
        RAISE EXCEPTION 'Your account is blocked from posting reels';
      END IF;
      SELECT count(*) INTO _pending FROM public.reels WHERE user_id = _uid AND status = 'pending';
      IF _pending >= 5 THEN RAISE EXCEPTION 'You already have 5 reels waiting for approval'; END IF;
      NEW.status := 'pending'; NEW.admin_note := NULL; NEW.approved_at := NULL;
    END IF;
    _prefix := '%/storage/v1/object/public/product-images/reels/' || NEW.user_id::text || '/%';
    IF NEW.video_url NOT LIKE _prefix OR (NEW.thumbnail_url IS NOT NULL AND NEW.thumbnail_url NOT LIKE _prefix) THEN
      RAISE EXCEPTION 'Invalid reel file';
    END IF;
    IF NEW.product_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.products WHERE id = NEW.product_id AND is_active) THEN
      RAISE EXCEPTION 'Tagged product is not available';
    END IF;
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.video_url := OLD.video_url;
    NEW.created_at := OLD.created_at;
    NEW.like_count := OLD.like_count;
    NEW.comment_count := OLD.comment_count;
    NEW.view_count := OLD.view_count;
    IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
      NEW.approved_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reel_guard_trg
BEFORE INSERT OR UPDATE ON public.reels
FOR EACH ROW EXECUTE FUNCTION public.reel_guard();

-- Likes
CREATE TABLE public.reel_likes (
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reel_id, user_id)
);
CREATE INDEX reel_likes_user_idx ON public.reel_likes (user_id);
GRANT SELECT, INSERT, DELETE ON public.reel_likes TO authenticated;
GRANT ALL ON public.reel_likes TO service_role;
ALTER TABLE public.reel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own likes"
ON public.reel_likes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users like approved reels"
ON public.reel_likes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.reels r WHERE r.id = reel_id AND r.status = 'approved'));
CREATE POLICY "Users remove their own likes"
ON public.reel_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.reel_like_counter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reels SET like_count = like_count + 1 WHERE id = NEW.reel_id;
    RETURN NEW;
  END IF;
  UPDATE public.reels SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.reel_id;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.reel_like_counter() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER reel_like_counter_trg
AFTER INSERT OR DELETE ON public.reel_likes
FOR EACH ROW EXECUTE FUNCTION public.reel_like_counter();

-- Comments
CREATE TABLE public.reel_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id uuid NOT NULL REFERENCES public.reels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reel_comment_len CHECK (char_length(btrim(body)) BETWEEN 1 AND 500)
);
CREATE INDEX reel_comments_reel_idx ON public.reel_comments (reel_id, created_at DESC);
GRANT SELECT ON public.reel_comments TO anon;
GRANT SELECT, INSERT, DELETE ON public.reel_comments TO authenticated;
GRANT ALL ON public.reel_comments TO service_role;
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments on visible reels are readable"
ON public.reel_comments FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.reels r WHERE r.id = reel_id));
CREATE POLICY "Users comment on approved reels"
ON public.reel_comments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.reels r WHERE r.id = reel_id AND r.status = 'approved'));
CREATE POLICY "Comment authors, reel owners and admins delete comments"
ON public.reel_comments FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.reels r WHERE r.id = reel_id AND r.user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION public.reel_comment_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE _recent int;
BEGIN
  NEW.body := btrim(NEW.body);
  NEW.created_at := now();
  IF current_user IN ('anon', 'authenticated') AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_blocked) THEN
      RAISE EXCEPTION 'Your account is blocked from commenting';
    END IF;
    SELECT count(*) INTO _recent FROM public.reel_comments
      WHERE user_id = auth.uid() AND created_at > now() - interval '10 minutes';
    IF _recent >= 20 THEN RAISE EXCEPTION 'Too many comments, please wait a few minutes'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reel_comment_guard_trg
BEFORE INSERT ON public.reel_comments
FOR EACH ROW EXECUTE FUNCTION public.reel_comment_guard();

CREATE OR REPLACE FUNCTION public.reel_comment_counter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reels SET comment_count = comment_count + 1 WHERE id = NEW.reel_id;
    RETURN NEW;
  END IF;
  UPDATE public.reels SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.reel_id;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.reel_comment_counter() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER reel_comment_counter_trg
AFTER INSERT OR DELETE ON public.reel_comments
FOR EACH ROW EXECUTE FUNCTION public.reel_comment_counter();

-- Follows
CREATE TABLE public.user_follows (
  follower_id uuid NOT NULL REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_follows_not_self CHECK (follower_id <> following_id)
);
CREATE INDEX user_follows_following_idx ON public.user_follows (following_id, created_at DESC);
GRANT SELECT ON public.user_follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are public"
ON public.user_follows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users follow as themselves"
ON public.user_follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users unfollow as themselves"
ON public.user_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

CREATE OR REPLACE FUNCTION public.user_follow_counter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.following_id;
    UPDATE public.social_profiles SET following_count = following_count + 1 WHERE user_id = NEW.follower_id;
    RETURN NEW;
  END IF;
  UPDATE public.social_profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE user_id = OLD.following_id;
  UPDATE public.social_profiles SET following_count = GREATEST(following_count - 1, 0) WHERE user_id = OLD.follower_id;
  RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.user_follow_counter() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER user_follow_counter_trg
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.user_follow_counter();

-- Views
CREATE OR REPLACE FUNCTION public.register_reel_view(_reel_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.reels SET view_count = view_count + 1 WHERE id = _reel_id AND status = 'approved';
$$;
REVOKE ALL ON FUNCTION public.register_reel_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_reel_view(uuid) TO anon, authenticated;

-- Reel videos, thumbnails and profile photos live in product-images/reels/<user_id>/
CREATE POLICY "Users upload their own reel files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'reels'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND lower(storage.extension(name)) = ANY (ARRAY['mp4','webm','mov','jpg','jpeg','png','webp'])
);
CREATE POLICY "Users delete their own reel files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'reels'
  AND (storage.foldername(name))[2] = auth.uid()::text
);