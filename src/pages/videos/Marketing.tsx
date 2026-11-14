import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Loader2, CreditCard } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { VideoNav } from '@/components/reels/VideoNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { loadRazorpay, releaseBodyLock } from '@/lib/razorpay';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Payment = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
export default function Marketing({ admin = false }: { admin?: boolean }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Tables<'video_campaigns'>[]>([]);
  const [videos, setVideos] = useState<{ id: string; title: string; user_id: string }[]>([]);
  const [metrics, setMetrics] = useState<Record<string, { impressions: number; clicks: number }>>({});
  const [packs, setPacks] = useState<{ days: number; price: number }[]>([]);
  const [kind, setKind] = useState('boost'); const [brand, setBrand] = useState(''); const [video, setVideo] = useState(''); const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [pending, setPending] = useState<{ id: string; payment: Payment } | null>(null);
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [c, v, m, p] = await Promise.all([
      supabase.from('video_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('tech_videos').select('id,title,user_id').eq('status', 'approved').order('approved_at', { ascending: false }),
      supabase.rpc('campaign_metrics'), supabase.rpc('promotion_packs'),
    ]);
    setError(c.error || v.error || m.error || p.error ? 'Marketing data nahi mila. Retry karein.' : '');
    setRows(c.data ?? []); setVideos(v.data ?? []); setPacks(p.data ?? []);
    setMetrics(Object.fromEntries((m.data ?? []).map(r => [r.campaign_id, { impressions: Number(r.impressions), clicks: Number(r.clicks) }])));
    setLoading(false);
  }, [user]);
  useEffect(() => { void load(); }, [load]);
  const verify = async (id: string, payment: Payment) => {
    setBusy(true);
    try {
      const { data, error: e } = await supabase.functions.invoke('verify-promotion-payment', { body: { campaign_id: id, ...payment } });
      if (e || !data?.verified) throw new Error('Payment verification baaki hai. Retry verification karein; dobara payment na karein.');
      setPending(null); toast.success('Payment saved — admin approval baaki hai'); await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Verification failed'); }
    finally { setBusy(false); }
  };
  const pay = async (id: string) => {
    if (busy || pending) return;
    setBusy(true);
    try {
      const Razorpay = await loadRazorpay();
      const { data, error: e } = await supabase.functions.invoke('create-razorpay-order', { body: { campaign_id: id } });
      if (e || !data?.order_id) throw new Error('Payment nahi khula; retry karein');
      releaseBodyLock();
      new Razorpay({ key: data.key_id, order_id: data.order_id, amount: data.amount, currency: data.currency, name: 'Trendra', description: 'Video promotion',
        handler: (payment: Payment) => { setPending({ id, payment }); void verify(id, payment); },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Payment failed'); setBusy(false); }
  };
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy || pending) return;
    setBusy(true);
    const { data, error: err } = await supabase.rpc('create_video_campaign', { _video_id: video, _kind: kind, _brand_name: brand, _days: days });
    setBusy(false);
    if (err || !data) { toast.error(err?.message ?? 'Campaign save nahi hua'); return; }
    toast.success('Campaign saved'); await load();
  };
  const moderate = async (id: string, status: string) => {
    const note = window.prompt('Admin note (optional)', ''); if (note === null) return;
    setBusy(true);
    const { error: e } = await supabase.rpc('moderate_video_campaign', { _id: id, _status: status, _note: note });
    if (e) toast.error(e.message); else { toast.success('Campaign updated'); await load(); }
    setBusy(false);
  };
  const content = <div className="mx-auto w-full max-w-5xl min-w-0">
    {!admin && <VideoNav />}
    <header className="mb-6 flex flex-wrap items-center gap-3"><Megaphone className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">{admin ? 'Marketing campaigns' : 'Video marketing'}</h1></header>
    {admin && <nav className="mb-6 flex flex-wrap gap-2">{[['/admin/coupons', 'Coupons'], ['/admin/banners', 'Banners'], ['/admin/festival-sale', 'Festival offers']].map(([path, title]) => <Button key={path} asChild variant="outline"><Link to={path}>{title}</Link></Button>)}</nav>}
    {error && <p role="alert" className="my-4 text-destructive">{error}<Button variant="ghost" onClick={load}>Retry</Button></p>}
    {pending && <div role="alert" className="mb-6 border border-border p-4"><p>Payment hua, verification baaki hai. Dobara payment na karein.</p><Button className="mt-2" disabled={busy} onClick={() => verify(pending.id, pending.payment)}>Retry verification</Button></div>}
    {!admin && <form onSubmit={create} className="mb-8 space-y-5 border-y py-6">
      <div className="flex flex-wrap gap-2">{[['boost', 'Boost my video'], ['sponsored', 'Brand sponsorship']].map(([value, title]) => <Button type="button" key={value} variant={kind === value ? 'default' : 'outline'} onClick={() => { setKind(value); setVideo(''); }}>{title}</Button>)}</div>
      {kind === 'sponsored' && <div><Label htmlFor="campaign-brand">Brand name</Label><Input id="campaign-brand" required minLength={2} maxLength={80} value={brand} onChange={e => setBrand(e.target.value)} /></div>}
      <div><Label htmlFor="campaign-video">Approved video</Label><select id="campaign-video" required className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={video} onChange={e => setVideo(e.target.value)}><option value="">Select video</option>{videos.filter(v => kind === 'sponsored' || v.user_id === user?.id).map(v => <option key={v.id} value={v.id}>{v.title}</option>)}</select></div>
      <div className="flex flex-wrap gap-3">{packs.map(p => <Button type="button" key={p.days} variant={p.days === days ? 'default' : 'outline'} onClick={() => setDays(p.days)}>₹{p.price} · {p.days} days</Button>)}</div>
      <p className="text-sm text-muted-foreground">Sample prices · Promotion starts after admin approval. Views are not guaranteed. Rejected campaigns need an admin-arranged refund.</p>
      <Button disabled={busy || !video || !!pending} type="submit"><Megaphone className="mr-2 h-4 w-4" />Create campaign</Button>
    </form>}
    <section><h2 className="mb-4 text-lg font-semibold">{admin ? 'All campaigns' : 'My campaigns'}</h2>{loading ? <Loader2 className="my-8 animate-spin" /> : !rows.length ? <p className="py-8 text-muted-foreground">Abhi koi campaign nahi</p> : <div className="divide-y">{rows.map(c => {
      const m = metrics[c.id] ?? { impressions: 0, clicks: 0 }; const expired = c.ends_at && new Date(c.ends_at).getTime() < Date.now();
      return <article key={c.id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><Link to={`/videos/${c.video_id}`} className="break-words font-semibold">{videos.find(v => v.id === c.video_id)?.title ?? 'Video'}</Link><p className="mt-1 text-sm text-muted-foreground">{c.kind === 'sponsored' ? c.brand_name : 'Video boost'} · {c.pack_days} days · ₹{c.amount_inr}</p></div><Badge variant="secondary">{expired ? 'expired' : c.status} · {c.payment_status}</Badge></div>
        <dl className="my-4 grid grid-cols-3 gap-3 text-sm">{[['Impressions', m.impressions], ['Clicks', m.clicks], ['Spend', c.payment_status === 'paid' ? `₹${c.amount_inr}` : '₹0']].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl><p className="text-xs text-muted-foreground">Unique signed-in viewers per day, excluding campaign owner.</p>
        {c.starts_at && <p className="mt-2 text-xs text-muted-foreground">{new Date(c.starts_at).toLocaleString('en-IN')} → {c.ends_at && new Date(c.ends_at).toLocaleString('en-IN')}</p>}{c.admin_note && <p className="mt-2 break-words text-sm">Admin: {c.admin_note}</p>}
        <div className="mt-3 flex flex-wrap gap-2">{!admin && c.payment_status === 'unpaid' && c.status === 'pending' && <Button disabled={busy || !!pending} onClick={() => pay(c.id)}><CreditCard className="mr-2 h-4 w-4" />Pay ₹{c.amount_inr}</Button>}{admin && <>{c.payment_status === 'paid' && !expired && <Button disabled={busy} onClick={() => moderate(c.id, 'approved')}>Approve</Button>}<Button variant="outline" disabled={busy} onClick={() => moderate(c.id, 'paused')}>Pause</Button><Button variant="destructive" disabled={busy} onClick={() => moderate(c.id, 'rejected')}>Reject</Button></>}</div>
      </article>;
    })}</div>}</section>
  </div>;
  return admin ? <AdminLayout>{content}</AdminLayout> : <Layout><div className="container px-3 py-6">{content}</div></Layout>;
}