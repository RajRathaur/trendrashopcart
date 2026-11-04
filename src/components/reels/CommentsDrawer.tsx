import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { MAX_COMMENT, avatarLetter, ensureSocialProfile } from '@/lib/reels';
import { timeAgo } from '@/lib/bazaar';
import { loginPath } from '@/lib/publicPaths';

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: { username: string; display_name: string; avatar_url: string | null } | null;
};

interface Props {
  reelId: string | null;
  reelOwnerId?: string;
  onClose: () => void;
  onCountChange: (reelId: string, delta: number) => void;
}

export const CommentsDrawer = ({ reelId, reelOwnerId, onClose, onCountChange }: Props) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!reelId) return;
    let cancelled = false;
    setLoading(true);
    setComments([]);
    supabase
      .from('reel_comments')
      .select('id, body, created_at, user_id, author:social_profiles!reel_comments_user_id_fkey(username, display_name, avatar_url)')
      .eq('reel_id', reelId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (cancelled) return;
        setComments((data as CommentRow[] | null) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reelId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelId) return;
    if (!user) { navigate(loginPath(location.pathname)); return; }
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await ensureSocialProfile();
      const { data, error } = await supabase
        .from('reel_comments')
        .insert({ reel_id: reelId, user_id: user.id, body: body.slice(0, MAX_COMMENT) })
        .select('id, body, created_at, user_id, author:social_profiles!reel_comments_user_id_fkey(username, display_name, avatar_url)')
        .single();
      if (error) throw error;
      setComments((c) => [data as CommentRow, ...c]);
      setText('');
      onCountChange(reelId, 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      toast.error(msg.includes('Too many') ? 'Bahut zyada comments, thodi der baad try karein' : 'Comment nahi gaya');
    } finally {
      setSending(false);
    }
  };

  const remove = async (c: CommentRow) => {
    if (!reelId) return;
    const { error } = await supabase.from('reel_comments').delete().eq('id', c.id);
    if (error) { toast.error('Delete nahi hua'); return; }
    setComments((list) => list.filter((x) => x.id !== c.id));
    onCountChange(reelId, -1);
  };

  return (
    <Drawer open={Boolean(reelId)} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[75svh]">
        <DrawerHeader className="border-b py-3">
          <DrawerTitle className="text-center text-base">Comments</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Abhi koi comment nahi. Pehla comment aap karein!</p>
          ) : (
            <ul className="space-y-4">
              {comments.map((c) => {
                const canDelete = user && (c.user_id === user.id || reelOwnerId === user.id || isAdmin);
                return (
                  <li key={c.id} className="flex gap-3">
                    <Link to={`/u/${c.author?.username ?? ''}`} className="shrink-0">
                      {c.author?.avatar_url ? (
                        <img src={c.author.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {avatarLetter(c.author)}
                        </span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        <Link to={`/u/${c.author?.username ?? ''}`} className="font-semibold text-foreground">@{c.author?.username ?? 'user'}</Link>
                        {' · '}{timeAgo(c.created_at)}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm">{c.body}</p>
                    </div>
                    {canDelete && (
                      <button type="button" onClick={() => remove(c)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Comment delete karein">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={user ? 'Comment likhein…' : 'Comment ke liye login karein'}
            maxLength={MAX_COMMENT}
            onFocus={() => { if (!user) navigate(loginPath(location.pathname)); }}
          />
          <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Comment bhejein">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
};
