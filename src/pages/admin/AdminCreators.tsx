import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CreatorBalance } from '@/lib/techVideos';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AdminCreators() {
  const { user } = useAuth(); const [creators, setCreators] = useState<CreatorBalance[]>([]); const [rate, setRate] = useState('');
  const [selected, setSelected] = useState<CreatorBalance | null>(null); const [amount, setAmount] = useState(''); const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); const [b, r] = await Promise.all([supabase.rpc('creator_balances'), supabase.rpc('video_rate_per_1000')]);
    if (b.error || r.error) toast.error('Creators nahi mile'); setCreators((b.data as CreatorBalance[] | null) ?? []); setRate(String(r.data ?? 10)); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const decide = async (c: CreatorBalance, status: string) => {
    const note = status === 'rejected' ? window.prompt('Reject ki wajah') : null; if (status === 'rejected' && !note?.trim()) return;
    setBusy(true); const { error } = await supabase.from('creator_monetization').update({ status, admin_note: note }).eq('user_id', c.user_id);
    if (error) toast.error('Update nahi hua'); else { toast.success('Creator update hua'); await load(); } setBusy(false);
  };
  const saveRate = async () => {
    const value = Number(rate); if (!Number.isFinite(value) || value < 0 || !rate.trim()) { toast.error('Valid rate likhein'); return; }
    if (!window.confirm('Naya rate purane eligible views ke earnings par bhi lagega. Save karein?')) return;
    setBusy(true); const { error } = await supabase.from('site_content').upsert({ content_key: 'video_rate_per_1000', content_value: String(value), updated_by: user?.id }, { onConflict: 'content_key' });
    if (error) toast.error('Rate save nahi hua'); else { toast.success('Rate save hua'); await load(); } setBusy(false);
  };
  const record = async () => {
    if (!selected || !user || busy) return; const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > Number(selected.balance) || !reference.trim()) { toast.error('Balance tak amount aur payment reference likhein'); return; }
    setBusy(true); const { error } = await supabase.from('creator_payouts').insert({ user_id: selected.user_id, amount: value, reference: reference.trim(), created_by: user.id });
    if (error) toast.error('Payment record nahi hua'); else { toast.success('Payment record hua'); setSelected(null); await load(); } setBusy(false);
  };
  return <AdminLayout><h1 className="mb-5 text-2xl font-bold">Creator monetization</h1><div className="mb-7 flex flex-wrap items-end gap-3"><div><Label htmlFor="view-rate">₹ per 1,000 eligible views</Label><Input id="view-rate" type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} /></div><Button disabled={busy} onClick={saveRate}>Save rate</Button></div>
    {loading ? <Loader2 className="my-10 animate-spin" /> : !creators.length ? <p className="py-10 text-muted-foreground">Abhi applications nahi</p> : <div className="grid gap-4 lg:grid-cols-2">{creators.map(c => <article key={c.user_id} className="min-w-0 space-y-3 rounded-lg border bg-card p-4"><h2 className="break-words font-semibold">@{c.username}</h2><p className="text-sm">{c.full_name} · {c.status ?? 'Not applied'}</p><p className="break-all text-sm">UPI: {c.upi_id ?? '—'}</p><p className="text-sm text-muted-foreground">{c.monetized_views} views · Earned ₹{Number(c.earned).toFixed(2)} · Paid ₹{Number(c.paid).toFixed(2)}</p><p className="font-bold">Balance ₹{Number(c.balance).toFixed(2)}</p><div className="flex flex-wrap gap-2">{c.status && <><Button disabled={busy} onClick={() => decide(c, 'approved')}>Approve</Button><Button variant="secondary" disabled={busy} onClick={() => decide(c, 'rejected')}>Reject</Button></>}<Button variant="outline" disabled={busy || Number(c.balance) <= 0} onClick={() => { setSelected(c); setAmount(''); setReference(''); }}>Record paid amount</Button></div></article>)}</div>}
    <Dialog open={Boolean(selected)} onOpenChange={o => { if (!o && !busy) setSelected(null); }}><DialogContent><DialogHeader><DialogTitle>Payment record · @{selected?.username}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Payment manually bhejne ke baad reference save karein. Ye button paisa transfer nahi karta.</p><Label htmlFor="paid-amount">Amount ₹</Label><Input id="paid-amount" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /><Label htmlFor="paid-reference">Payment reference</Label><Input id="paid-reference" maxLength={100} value={reference} onChange={e => setReference(e.target.value)} /><Button disabled={busy} onClick={record}>Save payment record</Button></DialogContent></Dialog>
  </AdminLayout>;
}