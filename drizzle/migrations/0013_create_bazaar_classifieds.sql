-- Trendra Bazaar: OLX-style used-item ads, admin approval, in-app chat.
CREATE TABLE public.bazaar_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  seller_name text NOT NULL DEFAULT 'Trendra user',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL,
  category text NOT NULL DEFAULT 'other',
  condition text NOT NULL DEFAULT 'good',
  city text NOT NULL,
  state text,
  images text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bazaar_title_len CHECK (char_length(btrim(title)) BETWEEN 3 AND 100),
  CONSTRAINT bazaar_desc_len CHECK (char_length(description) <= 2000),
  CONSTRAINT bazaar_price_range CHECK (price >= 0 AND price <= 10000000),
  CONSTRAINT bazaar_status_valid CHECK (status IN ('pending','approved','rejected','sold')),
  CONSTRAINT bazaar_condition_valid CHECK (condition IN ('new','like_new','good','fair')),
  CONSTRAINT bazaar_category_valid CHECK (category IN ('mobiles','electronics','vehicles','furniture','fashion','appliances','books','sports','kids','other')),
  CONSTRAINT bazaar_images_count CHECK (cardinality(images) BETWEEN 1 AND 8),
  CONSTRAINT bazaar_city_len CHECK (char_length(btrim(city)) BETWEEN 2 AND 60),
  CONSTRAINT bazaar_note_len CHECK (admin_note IS NULL OR char_length(admin_note) <= 500)
);
CREATE INDEX bazaar_listings_status_created_idx ON public.bazaar_listings (status, created_at DESC);
CREATE INDEX bazaar_listings_user_idx ON public.bazaar_listings (user_id);

GRANT SELECT ON public.bazaar_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bazaar_listings TO authenticated;
GRANT ALL ON public.bazaar_listings TO service_role;
ALTER TABLE public.bazaar_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bazaar approved ads are public, owners and admins see all"
ON public.bazaar_listings FOR SELECT TO anon, authenticated
USING (status IN ('approved','sold') OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users post their own bazaar ads"
ON public.bazaar_listings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins update bazaar ads"
ON public.bazaar_listings FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners and admins delete bazaar ads"
ON public.bazaar_listings FOR DELETE TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Only admins approve; any owner edit sends the ad back for review.
CREATE OR REPLACE FUNCTION public.bazaar_listing_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _is_admin boolean := public.has_role(auth.uid(), 'admin');
  _img text;
  _prefix text;
  _pending int;
  _name text;
BEGIN
  NEW.title := btrim(NEW.title);
  NEW.city := btrim(NEW.city);
  NEW.updated_at := now();

  IF TG_OP = 'INSERT' THEN
    IF NOT _is_admin THEN
      IF _uid IS NULL OR NEW.user_id <> _uid THEN
        RAISE EXCEPTION 'You can only post ads for yourself';
      END IF;
      IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _uid AND is_blocked) THEN
        RAISE EXCEPTION 'Your account is blocked from posting ads';
      END IF;
      SELECT count(*) INTO _pending FROM public.bazaar_listings WHERE user_id = _uid AND status = 'pending';
      IF _pending >= 5 THEN
        RAISE EXCEPTION 'You already have 5 ads waiting for approval';
      END IF;
      NEW.status := 'pending';
      NEW.admin_note := NULL;
      NEW.approved_at := NULL;
    END IF;
    SELECT NULLIF(split_part(btrim(coalesce(full_name, '')), ' ', 1), '') INTO _name
      FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    NEW.seller_name := left(coalesce(_name, 'Trendra user'), 40);
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.seller_name := OLD.seller_name;
    NEW.created_at := OLD.created_at;
    IF NOT _is_admin THEN
      NEW.admin_note := OLD.admin_note;
      NEW.approved_at := OLD.approved_at;
      IF NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description
         OR NEW.price IS DISTINCT FROM OLD.price OR NEW.category IS DISTINCT FROM OLD.category
         OR NEW.condition IS DISTINCT FROM OLD.condition OR NEW.city IS DISTINCT FROM OLD.city
         OR NEW.state IS DISTINCT FROM OLD.state OR NEW.images IS DISTINCT FROM OLD.images THEN
        NEW.status := 'pending';
        NEW.approved_at := NULL;
      ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        -- Owner may only switch an approved ad to sold and back.
        IF NOT (OLD.status IN ('approved','sold') AND NEW.status IN ('approved','sold')) THEN
          NEW.status := OLD.status;
        END IF;
      END IF;
    ELSIF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
      NEW.approved_at := now();
    END IF;
  END IF;

  -- Photos must be in this user's own bazaar folder.
  IF NOT _is_admin THEN
    _prefix := '%/storage/v1/object/public/product-images/bazaar/' || NEW.user_id::text || '/%';
    FOREACH _img IN ARRAY NEW.images LOOP
      IF _img NOT LIKE _prefix THEN
        RAISE EXCEPTION 'Invalid ad photo';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.bazaar_listing_guard() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER bazaar_listing_guard_trg
BEFORE INSERT OR UPDATE ON public.bazaar_listings
FOR EACH ROW EXECUTE FUNCTION public.bazaar_listing_guard();

-- Conversations: one per buyer per ad.
CREATE TABLE public.bazaar_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.bazaar_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  listing_title text NOT NULL DEFAULT '',
  listing_image text,
  buyer_name text NOT NULL DEFAULT 'Buyer',
  seller_name text NOT NULL DEFAULT 'Seller',
  last_message text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  buyer_unread integer NOT NULL DEFAULT 0,
  seller_unread integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);
CREATE INDEX bazaar_conv_buyer_idx ON public.bazaar_conversations (buyer_id, last_message_at DESC);
CREATE INDEX bazaar_conv_seller_idx ON public.bazaar_conversations (seller_id, last_message_at DESC);

GRANT SELECT, INSERT ON public.bazaar_conversations TO authenticated;
GRANT ALL ON public.bazaar_conversations TO service_role;
ALTER TABLE public.bazaar_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants and admins read conversations"
ON public.bazaar_conversations FOR SELECT TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Buyers start conversations"
ON public.bazaar_conversations FOR INSERT TO authenticated
WITH CHECK (buyer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.bazaar_conversation_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _l public.bazaar_listings%ROWTYPE;
  _name text;
BEGIN
  IF auth.uid() IS NULL OR NEW.buyer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  SELECT * INTO _l FROM public.bazaar_listings WHERE id = NEW.listing_id;
  IF NOT FOUND OR _l.status <> 'approved' THEN
    RAISE EXCEPTION 'This ad is not available for chat';
  END IF;
  IF _l.user_id = NEW.buyer_id THEN
    RAISE EXCEPTION 'You cannot chat on your own ad';
  END IF;
  SELECT NULLIF(split_part(btrim(coalesce(full_name, '')), ' ', 1), '') INTO _name
    FROM public.profiles WHERE user_id = NEW.buyer_id LIMIT 1;
  NEW.seller_id := _l.user_id;
  NEW.listing_title := _l.title;
  NEW.listing_image := _l.images[1];
  NEW.seller_name := _l.seller_name;
  NEW.buyer_name := left(coalesce(_name, 'Buyer'), 40);
  NEW.last_message := NULL;
  NEW.last_message_at := now();
  NEW.buyer_unread := 0;
  NEW.seller_unread := 0;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.bazaar_conversation_guard() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER bazaar_conversation_guard_trg
BEFORE INSERT ON public.bazaar_conversations
FOR EACH ROW EXECUTE FUNCTION public.bazaar_conversation_guard();

CREATE OR REPLACE FUNCTION public.is_bazaar_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bazaar_conversations
    WHERE id = _conversation_id AND (buyer_id = _user_id OR seller_id = _user_id)
  )
$$;

-- Messages
CREATE TABLE public.bazaar_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.bazaar_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bazaar_msg_len CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000)
);
CREATE INDEX bazaar_messages_conv_idx ON public.bazaar_messages (conversation_id, created_at);

GRANT SELECT, INSERT ON public.bazaar_messages TO authenticated;
GRANT ALL ON public.bazaar_messages TO service_role;
ALTER TABLE public.bazaar_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants and admins read messages"
ON public.bazaar_messages FOR SELECT TO authenticated
USING (public.is_bazaar_participant(conversation_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Chat participants send messages"
ON public.bazaar_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_bazaar_participant(conversation_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.bazaar_message_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bazaar_conversations SET
    last_message = left(NEW.body, 140),
    last_message_at = NEW.created_at,
    buyer_unread = CASE WHEN NEW.sender_id = buyer_id THEN buyer_unread ELSE buyer_unread + 1 END,
    seller_unread = CASE WHEN NEW.sender_id = seller_id THEN seller_unread ELSE seller_unread + 1 END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.bazaar_message_after_insert() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER bazaar_message_after_insert_trg
AFTER INSERT ON public.bazaar_messages
FOR EACH ROW EXECUTE FUNCTION public.bazaar_message_after_insert();

CREATE OR REPLACE FUNCTION public.mark_bazaar_read(_conversation_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.bazaar_conversations SET
    buyer_unread = CASE WHEN buyer_id = auth.uid() THEN 0 ELSE buyer_unread END,
    seller_unread = CASE WHEN seller_id = auth.uid() THEN 0 ELSE seller_unread END
  WHERE id = _conversation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.mark_bazaar_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_bazaar_read(uuid) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.bazaar_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bazaar_conversations;

-- Ad photos: users upload only into product-images/bazaar/<their id>/
CREATE POLICY "Users upload own bazaar photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'bazaar'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp'])
);

CREATE POLICY "Users delete own bazaar photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] = 'bazaar'
  AND (storage.foldername(name))[2] = auth.uid()::text
);