import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoNav } from '@/components/reels/VideoNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TechVideo, VIDEO_CATEGORIES, searchTerm, videoTime, timeAgo } from '@/lib/techVideos';
import { Avatar, VideoEngagement } from '@/components/videos/VideoEngagement';
import { formatCount } from '@/lib/reels';
import { Loader2, Video } from 'lucide-react';
import { SponsoredVideos } from '@/components/videos/SponsoredVideos';

export default function Videos() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const authorId = params.get('user');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [rows, setRows] = useState<TechVideo[]>([]);
  const [current, setCurrent] = useState<TechVideo | null>(null);
  type Ch = { user_id: string; username: string; display_name: string; avatar_url: string | null; followers_count: number };
  const [author, setAuthor] = useState<Ch | null>(null);
  const [channels, setChannels] = useState<Record<string, Ch>>({});
  const [shorts, setShorts] = useState<{ id: string; thumbnail_url: string | null; caption: string; view_count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const counted = useRef<string | null>(null);
  const watched = useRef({ last: 0, total: 0 });
  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    let q = supabase.from('tech_videos').select('*').eq('status', 'approved').order('approved_at', { ascending: false }).range(offset, offset + 11);
    if (category !== 'All') q = q.eq('category', category);
    if (authorId) q = q.eq('user_id', authorId);
    const term = searchTerm(query);
    if (term) q = q.ilike('title', `%${term}%`);
    const { data, error: e } = await q;
    setError(e ? 'Videos nahi mili, dobara try karein' : '');
    setRows(prev => offset ? [...prev, ...(data ?? [])] : data ?? []); setMore((data?.length ?? 0) === 12); setLoading(false);
  }, [category, query, authorId]);
  useEffect(() => { const t = setTimeout(() => { void load(); }, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    counted.current = null; watched.current = { last: 0, total: 0 }; setCurrent(null); setAuthor(null);
    if (!id) return;
    let live = true;
    void supabase.from('tech_videos').select('*').eq('id', id).maybeSingle().then(async ({ data, error: e }) => {
      if (!live) return;
      setCurrent(data); if (e || !data) setError('Video nahi mili ya approval baaki hai');
      if (data && user) { const { data: p } = await supabase.from('social_profiles').select('user_id, username, display_name, avatar_url, followers_count').eq('user_id', data.user_id).maybeSingle(); if (live) setAuthor(p ?? null); }
    });
    return () => { live = false; };
  }, [id, user]);
  const idsKey = rows.map(r => r.user_id).join(',');
  useEffect(() => {
    const ids = [...new Set(rows.map(r => r.user_id))].filter(i => !channels[i]);
    if (!user || !ids.length) return;
    void supabase.from('social_profiles').select('user_id, username, display_name, avatar_url, followers_count').in('user_id', ids)
      .then(({ data }) => setChannels(c => ({ ...c, ...Object.fromEntries((data ?? []).map(p => [p.user_id, p])) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, idsKey]);
  useEffect(() => {
    if (id) return;
    void supabase.from('reels').select('id, thumbnail_url, caption, view_count').eq('status', 'approved').order('approved_at', { ascending: false }).limit(12).then(({ data }) => setShorts(data ?? []));
  }, [id]);
  const others = rows.filter(r => r.id !== id);
  const card = (r: TechVideo, compact = false) => { const ch = channels[r.user_id]; return <Link key={r.id} to={`/videos/${r.id}`} className={compact ? 'flex min-w-0 gap-2' : 'min-w-0'}>
    <div className={`relative aspect-video shrink-0 overflow-hidden rounded-xl bg-muted ${compact ? 'w-40' : ''}`}>{r.thumbnail_url ? <img src={r.thumbnail_url} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" /> : <Video className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" />}<span className="absolute bottom-1.5 right-1.5 rounded bg-reel/90 px-1.5 text-xs font-medium text-reel-foreground">{videoTime(Number(r.duration_seconds))}</span></div>
    <div className={`flex min-w-0 gap-3 ${compact ? '' : 'mt-3'}`}>{!compact && <Avatar p={ch ?? { display_name: r.title }} size="h-9 w-9" />}<div className="min-w-0"><h2 className={`line-clamp-2 break-words font-semibold leading-snug ${compact ? 'text-sm' : ''}`}>{r.title}</h2><p className="mt-1 text-xs text-muted-foreground">{ch ? (ch.display_name || '@' + ch.username) : r.category}</p><p className="text-xs text-muted-foreground">{formatCount(r.view_count)} views · {timeAgo(r.approved_at ?? r.created_at)}</p></div></div></Link>; };
  return <Layout><div className="container mx-auto max-w-6xl px-3 py-6"><Seo title={current ? `${current.title} — Trendra Videos` : 'Trendra Videos — Technology & Tutorials'} description={current?.description || 'Technical videos, gadget reviews aur tutorials Trendra par dekhein.'} path={id ? `/videos/${id}` : '/videos'} /><VideoNav />
    {id && current && <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px]"><div className="min-w-0"><video key={current.id} src={current.video_url} poster={current.thumbnail_url ?? undefined} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl bg-reel object-contain" onTimeUpdate={e => {
      const v = e.currentTarget; const delta = v.currentTime - watched.current.last; watched.current.last = v.currentTime;
      if (!v.paused && delta > 0 && delta < 2) watched.current.total += delta;
      if (current.status !== 'approved' || counted.current === current.id || watched.current.total < Math.min(30, Number(current.duration_seconds) * 0.8)) return;
      counted.current = current.id;
      void supabase.rpc('register_tech_video_view', { _video_id: current.id }).then(({ error: err }) => { if (err) counted.current = null; });
    }} /><h1 className="mt-4 break-words text-xl font-bold">{current.title}</h1><VideoEngagement videoId={current.id} channel={author} /><div className="mt-4 rounded-xl bg-secondary p-3 text-sm"><p className="font-semibold">{formatCount(current.view_count)} views · {timeAgo(current.approved_at ?? current.created_at)} · {current.category}</p><p className="mt-2 whitespace-pre-wrap break-words">{current.description}</p></div></div>
      <aside className="space-y-3"><h2 className="font-bold">Up next</h2>{others.slice(0, 12).map(r => card(r, true))}</aside></section>}
    {!id && <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Trendra Videos</h1><Input className="w-full sm:w-72" aria-label="Video search" placeholder="Video search" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">{['All', ...VIDEO_CATEGORIES].map(c => <Button key={c} className="shrink-0 rounded-lg" variant={c === category ? 'default' : 'secondary'} size="sm" onClick={() => setCategory(c)}>{c}</Button>)}</div>
    {shorts.length > 0 && !query && category === 'All' && <section className="mb-8"><h2 className="mb-3 text-lg font-bold">Shorts</h2><div className="flex gap-3 overflow-x-auto pb-2">{shorts.map(r => <Link key={r.id} to={`/reels/${r.id}`} className="w-36 shrink-0"><div className="aspect-[9/16] overflow-hidden rounded-xl bg-muted">{r.thumbnail_url && <img src={r.thumbnail_url} alt={r.caption} loading="lazy" className="h-full w-full object-cover" />}</div><p className="mt-1 line-clamp-2 text-sm font-medium">{r.caption}</p><p className="text-xs text-muted-foreground">{formatCount(r.view_count)} views</p></Link>)}</div></section>}</>}
    {error && <p role="alert" className="mb-4 text-destructive">{error}<Button variant="ghost" onClick={() => load()}>Retry</Button></p>}
    {!id && <><SponsoredVideos /><div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r => card(r))}</div></>}
    {loading && <Loader2 className="mx-auto my-10 animate-spin" />}{!loading && !rows.length && <p className="py-12 text-center text-muted-foreground">Abhi koi video nahi</p>}{more && <Button className="mt-6" variant="outline" disabled={loading} onClick={() => load(rows.length)}>Aur dekhein</Button>}
  </div></Layout>;
}