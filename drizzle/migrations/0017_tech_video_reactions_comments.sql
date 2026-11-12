CREATE TABLE public.tech_video_reactions (
  video_id uuid NOT NULL REFERENCES public.tech_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (video_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tech_video_reactions TO authenticated;
GRANT ALL ON public.tech_video_reactions TO service_role;
ALTER TABLE public.tech_video_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read reactions" ON public.tech_video_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users react on approved videos" ON public.tech_video_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tech_videos v WHERE v.id = video_id AND v.status = 'approved'));
CREATE POLICY "Users change own reaction" ON public.tech_video_reactions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own reaction" ON public.tech_video_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.tech_video_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.tech_videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.social_profiles(user_id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tech_video_comments_video_idx ON public.tech_video_comments (video_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.tech_video_comments TO authenticated;
GRANT ALL ON public.tech_video_comments TO service_role;
ALTER TABLE public.tech_video_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read comments" ON public.tech_video_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users comment on approved videos" ON public.tech_video_comments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tech_videos v WHERE v.id = video_id AND v.status = 'approved'));
CREATE POLICY "Owner or admin deletes comment" ON public.tech_video_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));