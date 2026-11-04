import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ensureSocialProfile } from '@/lib/reels';
import { loginPath } from '@/lib/publicPaths';

/** Likes and follows of the signed-in user, with login redirect for visitors. */
export const useReelActions = (reelIds: string[]) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const idsKey = reelIds.join(',');

  useEffect(() => {
    if (!user || reelIds.length === 0) { setLiked(new Set()); return; }
    supabase.from('reel_likes').select('reel_id').eq('user_id', user.id).in('reel_id', reelIds)
      .then(({ data }) => setLiked(new Set((data ?? []).map((r) => r.reel_id))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idsKey]);

  useEffect(() => {
    if (!user) { setFollowing(new Set()); return; }
    supabase.from('user_follows').select('following_id').eq('follower_id', user.id).limit(1000)
      .then(({ data }) => setFollowing(new Set((data ?? []).map((r) => r.following_id))));
  }, [user]);

  const requireLogin = useCallback(() => {
    if (user) return false;
    navigate(loginPath(location.pathname));
    return true;
  }, [user, navigate, location.pathname]);

  /** Returns +1 / -1 / 0 for the like counter change. */
  const toggleLike = useCallback(async (reelId: string): Promise<number> => {
    if (requireLogin() || !user) return 0;
    const isLiked = liked.has(reelId);
    setLiked((s) => { const n = new Set(s); if (isLiked) n.delete(reelId); else n.add(reelId); return n; });
    const { error } = isLiked
      ? await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', user.id)
      : await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: user.id });
    if (error) {
      setLiked((s) => { const n = new Set(s); if (isLiked) n.add(reelId); else n.delete(reelId); return n; });
      toast.error('Like nahi hua, dobara try karein');
      return 0;
    }
    return isLiked ? -1 : 1;
  }, [liked, requireLogin, user]);

  const toggleFollow = useCallback(async (targetId: string): Promise<number> => {
    if (requireLogin() || !user || targetId === user.id) return 0;
    const isFollowing = following.has(targetId);
    setFollowing((s) => { const n = new Set(s); if (isFollowing) n.delete(targetId); else n.add(targetId); return n; });
    try {
      if (isFollowing) {
        const { error } = await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
        if (error) throw error;
      } else {
        await ensureSocialProfile();
        const { error } = await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetId });
        if (error) throw error;
      }
      return isFollowing ? -1 : 1;
    } catch {
      setFollowing((s) => { const n = new Set(s); if (isFollowing) n.add(targetId); else n.delete(targetId); return n; });
      toast.error('Follow nahi hua, dobara try karein');
      return 0;
    }
  }, [following, requireLogin, user]);

  return { user, liked, following, toggleLike, toggleFollow, requireLogin };
};
