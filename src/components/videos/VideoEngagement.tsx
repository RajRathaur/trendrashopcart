import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useReelActions } from '@/hooks/useReelActions';
import { ensureSocialProfile, formatCount, avatarLetter } from '@/lib/reels';
import { timeAgo } from '@/lib/techVideos';
import { ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Channel = { user_id: string; username: string; display_name: string; avatar_url: string | null; followers_count: number };
type Comment = { id: string; body: string; created_at: string; user_id: string; p: { username: string; display_name: string; avatar_url: string | null } | null };

export const Avatar = ({ p, size = 'h-10 w-10' }: { p?: { username?: string | null; display_name?: string | null; avatar_url?: string | null } | null; size?: string }) =>
  p?.avatar_url ? <img src={p.avatar_url} alt="" className={`${size} shrink-0 rounded-full object-cover`} /> : <span className={`${size} grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground`}>{avatarLetter(p)}</span>;

export function VideoEngagement({ videoId, channel }: { videoId: string; channel: Channel | null }) {
  const { user, following, toggleFollow, requireLogin } = useReelActions([]);
  const [subs, setSubs] = useState(channel?.followers_count ?? 0);
  const [mine, setMine] = useState(0);
  const [counts, setCounts] = useState({ up: 0, down: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setSubs(channel?.followers_count ?? 0), [channel]);
  useEffect(() => {
    if (!user) return;
    void supabase.from('tech_video_reactions').select('user_id, value').eq('video_id', videoId).then(({ data }) => {
      const rows = data ?? [];
      setCounts({ up: rows.filter(r => r.value === 1).length, down: rows.filter(r => r.value === -1).length });
      setMine(rows.find(r => r.user_id === user.id)?.value ?? 0);
    });
    void supabase.from('tech_video_comments').select('id, body, created_at, user_id, p:social_profiles(username, display_name, avatar_url)').eq('video_id', videoId).order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setComments((data ?? []) as Comment[]));
  }, [user, videoId]);

  const react = async (value: 1 | -1) => {
    if (requireLogin() || !user) return;
    const next = mine === value ? 0 : value;
    const prev = mine;
    setCounts(c => { const n = { ...c }; if (prev === 1) n.up--; if (prev === -1) n.down--; if (next === 1) n.up++; if (next === -1) n.down++; return n; });
    setMine(next);
    const { error } = next === 0
      ? await supabase.from('tech_video_reactions').delete().eq('video_id', videoId).eq('user_id', user.id)
      : await supabase.from('tech_video_reactions').upsert({ video_id: videoId, user_id: user.id, value: next });
    if (error) { toast.error('Dobara try karein'); setMine(prev); }
  };
  const post = async (e: FormEvent) => {
    e.preventDefault();
    if (requireLogin() || !user || !text.trim()) return;
    setBusy(true);
    try {
      await ensureSocialProfile();
      const { data, error } = await supabase.from('tech_video_comments').insert({ video_id: videoId, user_id: user.id, body: text.trim().slice(0, 500) })
        .select('id, body, created_at, user_id, p:social_profiles(username, display_name, avatar_url)').single();
      if (error) throw error;
      setComments(c => [data as Comment, ...c]); setText('');
    } catch { toast.error('Comment nahi gaya'); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from('tech_video_comments').delete().eq('id', id);
    if (!error) setComments(c => c.filter(x => x.id !== id));
  };
  const isSub = channel ? following.has(channel.user_id) : false;

  return <>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {channel ? <Link to={`/u/${channel.username}`} className="flex items-center gap-3"><Avatar p={channel} /><div><p className="font-semibold leading-tight">{channel.display_name || channel.username}</p><p className="text-xs text-muted-foreground">{formatCount(subs)} subscribers</p></div></Link>
          : <p className="text-sm text-muted-foreground"><Link to="/login" className="text-primary">Login</Link> karke channel dekhein</p>}
        {channel && channel.user_id !== user?.id && <Button size="sm" className="rounded-full" variant={isSub ? 'secondary' : 'default'} onClick={async () => { const d = await toggleFollow(channel.user_id); setSubs(s => s + d); }}>{isSub ? 'Subscribed' : 'Subscribe'}</Button>}
      </div>
      <div className="flex overflow-hidden rounded-full bg-secondary">
        <button aria-label="Like" onClick={() => react(1)} className={`flex items-center gap-2 px-4 py-2 text-sm ${mine === 1 ? 'text-primary' : ''}`}><ThumbsUp className="h-4 w-4" fill={mine === 1 ? 'currentColor' : 'none'} />{formatCount(counts.up)}</button>
        <span className="my-2 w-px bg-border" />
        <button aria-label="Dislike" onClick={() => react(-1)} className={`px-4 py-2 ${mine === -1 ? 'text-primary' : ''}`}><ThumbsDown className="h-4 w-4" fill={mine === -1 ? 'currentColor' : 'none'} /></button>
      </div>
    </div>
    <section className="mt-6"><h2 className="mb-3 font-bold">{comments.length} Comments</h2>
      {user ? <form onSubmit={post} className="mb-5 flex gap-2"><Textarea rows={1} maxLength={500} placeholder="Comment likhein…" value={text} onChange={e => setText(e.target.value)} /><Button disabled={busy || !text.trim()}>Post</Button></form>
        : <p className="mb-4 text-sm text-muted-foreground"><Link to="/login" className="text-primary">Login</Link> karke comments dekhein aur likhein</p>}
      <ul className="space-y-4">{comments.map(c => <li key={c.id} className="flex gap-3"><Avatar p={c.p} size="h-8 w-8" /><div className="min-w-0 flex-1"><p className="text-xs"><span className="font-semibold">@{c.p?.username}</span> <span className="text-muted-foreground">{timeAgo(c.created_at)}</span></p><p className="whitespace-pre-wrap break-words text-sm">{c.body}</p></div>{c.user_id === user?.id && <button aria-label="Delete comment" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>}</li>)}</ul>
    </section>
  </>;
}
