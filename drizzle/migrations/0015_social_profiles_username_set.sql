-- Tracks whether the user picked their own UID (username) instead of the auto one.
ALTER TABLE public.social_profiles ADD COLUMN IF NOT EXISTS username_set boolean NOT NULL DEFAULT false;

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
      -- Once a UID is chosen it stays "chosen"; changing the username also counts as choosing.
      NEW.username_set := OLD.username_set OR NEW.username_set OR NEW.username IS DISTINCT FROM OLD.username;
    END IF;
    IF NEW.avatar_url IS NOT NULL
       AND NEW.avatar_url NOT LIKE '%/storage/v1/object/public/product-images/reels/' || NEW.user_id::text || '/%' THEN
      RAISE EXCEPTION 'Invalid profile photo';
    END IF;
  END IF;
  RETURN NEW;
END $$;