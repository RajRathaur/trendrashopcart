import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoNav } from '@/components/reels/VideoNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TechVideo, VIDEO_CATEGORIES, searchTerm, videoTime } from '@/lib/techVideos';
import { formatCount } from '@/lib/reels';
import { Loader2, Video } from 'lucide-react';

export default function Videos() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const authorId = params.get('user');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [rows, setRows] = useState<TechVideo[]>([]);
  const [current, setCurrent] = useState<TechVideo | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
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
      if (data && user) { const { data: p } = await supabase.from('social_profiles').select('username').eq('user_id', data.user_id).maybeSingle(); if (live) setAuthor(p?.username ?? null); }
    });
    return () => { live = false; };
  }, [id, user]);
  return <Layout><div className="container mx-auto max-w-6xl px-3 py-6"><Seo title={current ? `${current.title} — Trendra Videos` : 'Trendra Videos — Technology & Tutorials'} description={current?.description || 'Technical videos, gadget reviews aur tutorials Trendra par dekhein.'} path={id ? `/videos/${id}` : '/videos'} /><VideoNav />
    {id && current && <section className="mb-8 border-b pb-6"><video key={current.id} src={current.video_url} poster={current.thumbnail_url ?? undefined} controls playsInline preload="metadata" className="aspect-video w-full bg-reel object-contain" onTimeUpdate={e => {
      const v = e.currentTarget; const delta = v.currentTime - watched.current.last; watched.current.last = v.currentTime;
      if (!v.paused && delta > 0 && delta < 2) watched.current.total += delta;
      if (current.status !== 'approved' || counted.current === current.id || watched.current.total < Math.min(30, Number(current.duration_seconds) * 0.8)) return;
      counted.current = current.id;
      void supabase.rpc('register_tech_video_view', { _video_id: current.id }).then(({ error: err }) => { if (err) counted.current = null; });
    }} /><h1 className="mt-4 break-words text-2xl font-bold">{current.title}</h1><div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground"><span>{formatCount(current.view_count)} views</span><span>{current.category}</span>{author && <Link to={`/u/${author}`} className="text-primary">@{author}</Link>}</div><p className="mt-4 whitespace-pre-wrap break-words text-sm">{current.description}</p></section>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">{id ? 'Aur videos' : 'Trendra Videos'}</h1><Input className="w-full sm:w-72" aria-label="Video search" placeholder="Video search" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div className="mb-6 flex flex-wrap gap-2">{['All', ...VIDEO_CATEGORIES].map(c => <Button key={c} variant={c === category ? 'default' : 'outline'} size="sm" onClick={() => setCategory(c)}>{c}</Button>)}</div>
    {error && <p role="alert" className="mb-4 text-destructive">{error}<Button variant="ghost" onClick={() => load()}>Retry</Button></p>}
    <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">{rows.map(r => <Link key={r.id} to={`/videos/${r.id}`} className="min-w-0"><div className="relative aspect-video overflow-hidden rounded-lg bg-muted">{r.thumbnail_url ? <img src={r.thumbnail_url} alt={r.title} loading="lazy" className="h-full w-full object-cover" /> : <Video className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" />}<span className="absolute bottom-2 right-2 rounded bg-reel px-1.5 text-xs text-reel-foreground">{videoTime(Number(r.duration_seconds))}</span></div><h2 className="mt-3 line-clamp-2 break-words font-semibold">{r.title}</h2><p className="mt-1 text-xs text-muted-foreground">{r.category} · {formatCount(r.view_count)} views</p></Link>)}</div>
    {loading && <Loader2 className="mx-auto my-10 animate-spin" />}{!loading && !rows.length && <p className="py-12 text-center text-muted-foreground">Abhi koi video nahi</p>}{more && <Button className="mt-6" variant="outline" disabled={loading} onClick={() => load(rows.length)}>Aur dekhein</Button>}
  </div></Layout>;
}