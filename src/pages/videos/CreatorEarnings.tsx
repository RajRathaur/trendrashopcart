import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { VideoNav } from '@/components/reels/VideoNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ensureSocialProfile } from '@/lib/reels';
import { TechVideo, CreatorBalance } from '@/lib/techVideos';
import type { Tables } from '@/integrations/supabase/types';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatorEarnings() {
  const { user } = useAuth(); const [balance, setBalance] = useState<CreatorBalance | null>(null);
  const [videos, setVideos] = useState<TechVideo[]>([]); const [payments, setPayments] = useState<Tables<'creator_payouts'>[]>([]);
  const [application, setApplication] = useState<Tables<'creator_monetization'> | null>(null);
  const [name, setName] = useState(''); const [upi, setUpi] = useState(''); const [rate, setRate] = useState(0);
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!user) return; setLoading(true);
    try {
      await ensureSocialProfile();
      const [b, v, p, a, r] = await Promise.all([
        supabase.rpc('creator_balances', { _user_id: user.id }), supabase.from('tech_videos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('creator_payouts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }), supabase.from('creator_monetization').select('*').eq('user_id', user.id).maybeSingle(), supabase.rpc('video_rate_per_1000'),
      ]);
      if (b.error || v.error || p.error || a.error || r.error) throw new Error('Earnings nahi mili, dobara try karein');
      setBalance((b.data?.[0] as CreatorBalance | undefined) ?? null); setVideos(v.data ?? []); setPayments(p.data ?? []); setApplication(a.data); setName(a.data?.full_name ?? ''); setUpi(a.data?.upi_id ?? ''); setRate(Number(r.data)); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Load nahi hua'); } finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);
  const apply = async () => {
    if (!user || busy) return;
    if (name.trim().length < 2 || !/^[A-Za-z0-9._-]{2,64}@[A-Za-z]{2,32}$/.test(upi.trim())) { toast.error('Naam aur valid UPI ID likhein'); return; }
    setBusy(true);
    const { error: e } = await supabase.from('creator_monetization').upsert({ user_id: user.id, full_name: name.trim(), upi_id: upi.trim().toLowerCase() });
    setBusy(false); if (e) toast.error('Application save nahi hui'); else { toast.success('Application approval ke liye bheji'); void load(); }
  };
  const remove = async (id: string) => {
    if (!window.confirm('Video delete karein?')) return;
    const { error: e } = await supabase.from('tech_videos').delete().eq('id', id); if (e) toast.error('Delete nahi hui'); else void load();
  };
  return <Layout><div className="container mx-auto max-w-4xl px-3 py-6"><VideoNav /><h1 className="text-2xl font-bold">Creator earnings</h1>{loading ? <Loader2 className="mx-auto my-12 animate-spin" /> : error ? <p role="alert" className="my-8 text-destructive">{error}<Button variant="ghost" onClick={load}>Retry</Button></p> : <>
    <div className="my-6 grid grid-cols-2 gap-4 border-y py-5 sm:grid-cols-4">{[['Eligible views', balance?.monetized_views ?? 0], ['Earned', `₹${Number(balance?.earned ?? 0).toFixed(2)}`], ['Paid', `₹${Number(balance?.paid ?? 0).toFixed(2)}`], ['Balance', `₹${Number(balance?.balance ?? 0).toFixed(2)}`]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>)}</div>
    <p className="text-sm text-muted-foreground">Current rate: ₹{rate} / 1,000 eligible views · Payments recorded by admin</p>
    <section className="mt-8 border-b pb-7"><h2 className="mb-4 text-lg font-semibold">Monetization {application && <Badge variant="secondary">{application.status}</Badge>}</h2>{application?.admin_note && <p className="mb-3 text-sm text-destructive">{application.admin_note}</p>}
      <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="creator-name">Naam</Label><Input id="creator-name" maxLength={80} value={name} onChange={e => setName(e.target.value)} /></div><div><Label htmlFor="creator-upi">UPI ID</Label><Input id="creator-upi" value={upi} onChange={e => setUpi(e.target.value)} /></div></div><Button className="mt-4" disabled={busy} onClick={apply}>{busy ? 'Saving…' : application ? 'Details update karein' : 'Apply karein'}</Button>
    </section><section className="mt-7"><h2 className="mb-4 text-lg font-semibold">My videos</h2>{!videos.length && <p className="text-muted-foreground">Abhi koi video nahi</p>}<ul className="divide-y">{videos.map(v => <li key={v.id} className="flex items-start justify-between gap-3 py-4"><div className="min-w-0"><Link className="break-words font-medium text-primary" to={`/videos/${v.id}`}>{v.title}</Link><p className="mt-1 text-xs text-muted-foreground">{v.status} · {v.view_count} views</p>{v.admin_note && <p className="text-sm text-destructive">{v.admin_note}</p>}</div><Button size="icon" variant="ghost" aria-label="Video delete" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4" /></Button></li>)}</ul></section>
    <section className="mt-7"><h2 className="mb-4 text-lg font-semibold">Payment history</h2>{!payments.length && <p className="text-muted-foreground">Abhi payment nahi</p>}{payments.map(p => <div key={p.id} className="flex flex-wrap justify-between gap-2 border-b py-3 text-sm"><span>{new Date(p.created_at).toLocaleDateString('en-IN')} · {p.reference}</span><strong>₹{Number(p.amount).toFixed(2)}</strong></div>)}</section>
  </>}</div></Layout>;
}