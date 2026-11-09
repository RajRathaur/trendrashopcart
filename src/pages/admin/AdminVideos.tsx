import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { TechVideo } from '@/lib/techVideos';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminVideos() {
  const [status, setStatus] = useState('pending'); const [videos, setVideos] = useState<TechVideo[]>([]); const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); const { data, error } = await supabase.from('tech_videos').select('*').eq('status', status).order('created_at', { ascending: false }).limit(100); if (error) toast.error('Videos nahi mili'); setVideos(data ?? []); setLoading(false); }, [status]);
  useEffect(() => { void load(); }, [load]);
  const decide = async (v: TechVideo, next: string) => {
    const note = (notes[v.id] ?? '').trim(); if (next === 'rejected' && !note) { toast.error('Reject ki wajah likhein'); return; }
    setBusy(v.id); const { error } = await supabase.from('tech_videos').update({ status: next, admin_note: next === 'rejected' ? note : null }).eq('id', v.id);
    if (error) toast.error('Update nahi hua'); else { await supabase.rpc('log_admin_action', { _action: `video_${next}`, _entity_type: 'tech_video', _entity_id: v.id, _metadata: {} }); toast.success('Video update ho gayi'); await load(); } setBusy(null);
  };
  return <AdminLayout><h1 className="mb-5 text-2xl font-bold">Technical videos</h1><Tabs value={status} onValueChange={setStatus}><TabsList>{['pending', 'approved', 'rejected'].map(s => <TabsTrigger key={s} value={s}>{s}</TabsTrigger>)}</TabsList></Tabs>
    {loading ? <Loader2 className="my-10 animate-spin" /> : !videos.length ? <p className="py-12 text-muted-foreground">Koi video nahi</p> : <div className="mt-6 grid gap-5 lg:grid-cols-2">{videos.map(v => <article key={v.id} className="min-w-0 space-y-3 rounded-lg border bg-card p-4"><video src={v.video_url} poster={v.thumbnail_url ?? undefined} preload="none" controls playsInline className="aspect-video w-full bg-reel object-contain" /><h2 className="break-words font-semibold">{v.title}</h2><p className="break-all text-xs text-muted-foreground">User ID: {v.user_id}</p><p className="line-clamp-3 text-sm">{v.description}</p><p className="text-xs text-muted-foreground">{v.category} · {v.view_count} views · {v.monetized_views} eligible</p>{v.admin_note && <p className="text-sm text-destructive">{v.admin_note}</p>}<Textarea aria-label={`Rejection reason ${v.title}`} placeholder="Reject ki wajah" maxLength={500} value={notes[v.id] ?? ''} onChange={e => setNotes(n => ({ ...n, [v.id]: e.target.value }))} /><div className="flex flex-wrap gap-2"><Button disabled={busy === v.id} onClick={() => decide(v, 'approved')}>Approve</Button><Button variant="secondary" disabled={busy === v.id} onClick={() => decide(v, 'rejected')}>Reject</Button><Button variant="outline" asChild><Link to={`/videos/${v.id}`}>Watch</Link></Button></div></article>)}</div>}
  </AdminLayout>;
}