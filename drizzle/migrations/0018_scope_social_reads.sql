DROP POLICY IF EXISTS "Logged-in users see follows" ON public.user_follows;
CREATE POLICY "Users see their own follow links" ON public.user_follows FOR SELECT TO authenticated
USING (follower_id = auth.uid() OR following_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Logged-in users see social profiles" ON public.social_profiles;
CREATE POLICY "Users see own, connected or creator profiles" ON public.social_profiles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.reels r WHERE r.user_id = social_profiles.user_id AND r.status = 'approved')
  OR EXISTS (SELECT 1 FROM public.tech_videos v WHERE v.user_id = social_profiles.user_id AND v.status = 'approved')
  OR EXISTS (SELECT 1 FROM public.user_follows f WHERE (f.follower_id = auth.uid() AND f.following_id = social_profiles.user_id) OR (f.following_id = auth.uid() AND f.follower_id = social_profiles.user_id))
);

DROP POLICY IF EXISTS "Signed-in users read comments" ON public.tech_video_comments;
CREATE POLICY "Read comments on approved or own videos" ON public.tech_video_comments FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.tech_videos v WHERE v.id = tech_video_comments.video_id AND (v.status = 'approved' OR v.user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Signed-in users read reactions" ON public.tech_video_reactions;
CREATE POLICY "Users read own reactions" ON public.tech_video_reactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.tech_video_reaction_counts(_video_id uuid)
RETURNS TABLE(up bigint, down bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*) FILTER (WHERE r.value = 1), count(*) FILTER (WHERE r.value = -1)
  FROM public.tech_video_reactions r
  JOIN public.tech_videos v ON v.id = r.video_id
  WHERE r.video_id = _video_id AND (v.status = 'approved' OR v.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.tech_video_reaction_counts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tech_video_reaction_counts(uuid) TO authenticated;