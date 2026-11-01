import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BazaarListing, categoryLabel, conditionLabel, formatBazaarPrice, timeAgo } from '@/lib/bazaar';
import { Check, ExternalLink, Loader2, Trash2, X } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected' | 'sold';

const AdminBazaar = () => {
  const [status, setStatus] = useState<Status>('pending');
  const [ads, setAds] = useState<BazaarListing[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: all }] = await Promise.all([
      supabase.from('bazaar_listings').select('*').eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(200),
      supabase.from('bazaar_listings').select('status'),
    ]);
    setAds(data ?? []);
    setCounts((all ?? []).reduce<Record<string, number>>((m, r) => ({ ...m, [r.status]: (m[r.status] ?? 0) + 1 }), {}));
    setLoading(false);
  }, [status]);

  useEffect(() => { document.title = 'Bazaar Ads — Admin'; load(); }, [load]);

  const decide = async (ad: BazaarListing, next: 'approved' | 'rejected') => {
    const note = (notes[ad.id] ?? '').trim().slice(0, 500);
    if (next === 'rejected' && !note) { toast.error('Reject karne ki wajah likhein, ye seller ko dikhegi'); return; }
    setBusy(ad.id);
    const { error } = await supabase
      .from('bazaar_listings')
      .update({ status: next, admin_note: next === 'rejected' ? note : null })
      .eq('id', ad.id);
    if (!error) {
      await supabase.rpc('log_admin_action', {
        _action: next === 'approved' ? 'bazaar_approve' : 'bazaar_reject',
        _entity_type: 'bazaar_listing', _entity_id: ad.id, _metadata: { title: ad.title, note },
      });
    }
    setBusy(null);
    if (error) { toast.error('Update nahi hua'); return; }
    toast.success(next === 'approved' ? 'Ad live ho gaya' : 'Ad reject kiya');
    load();
  };

  const remove = async (ad: BazaarListing) => {
    if (!window.confirm(`"${ad.title}" hamesha ke liye delete karein?`)) return;
    setBusy(ad.id);
    const { error } = await supabase.from('bazaar_listings').delete().eq('id', ad.id);
    if (!error) {
      await supabase.rpc('log_admin_action', {
        _action: 'bazaar_delete', _entity_type: 'bazaar_listing', _entity_id: ad.id, _metadata: { title: ad.title },
      });
    }
    setBusy(null);
    if (error) { toast.error('Delete nahi hua'); return; }
    toast.success('Ad delete kiya');
    load();
  };

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Bazaar Ads</h1>
          <p className="text-sm text-muted-foreground">Purane saaman ke ads. Approve karne par hi ye sabko dikhte hain.</p>
        </div>
        <Button asChild variant="outline" size="sm"><Link to="/bazaar" target="_blank" className="gap-1.5"><ExternalLink className="h-4 w-4" />Bazaar dekhein</Link></Button>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as Status)} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({counts.pending ?? 0})</TabsTrigger>
          <TabsTrigger value="approved">Live ({counts.approved ?? 0})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected ?? 0})</TabsTrigger>
          <TabsTrigger value="sold">Sold ({counts.sold ?? 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : ads.length === 0 ? (
        <p className="rounded-lg border bg-card py-12 text-center text-muted-foreground">Is list me koi ad nahi hai.</p>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="flex flex-col gap-3 rounded-lg border bg-card p-3 md:flex-row">
              <div className="flex gap-1.5 overflow-x-auto md:w-72 md:shrink-0">
                {ad.images.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noreferrer" className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{ad.title}</p>
                  <Badge variant="secondary">{formatBazaarPrice(Number(ad.price))}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryLabel(ad.category)} · {conditionLabel(ad.condition)} · {ad.city}{ad.state ? `, ${ad.state}` : ''} · {ad.seller_name} · {timeAgo(ad.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">User ID: {ad.user_id}</p>
                {ad.description && <p className="line-clamp-3 whitespace-pre-line text-sm">{ad.description}</p>}
                {ad.admin_note && ad.status === 'rejected' && (
                  <p className="text-xs text-destructive">Wajah: {ad.admin_note}</p>
                )}
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-end">
                  {ad.status !== 'rejected' && (
                    <Textarea
                      value={notes[ad.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [ad.id]: e.target.value }))}
                      placeholder="Reject karne ki wajah (seller ko dikhegi)"
                      rows={1}
                      maxLength={500}
                      className="min-h-9 sm:max-w-xs"
                    />
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {ad.status !== 'approved' && ad.status !== 'sold' && (
                      <Button size="sm" className="gap-1" disabled={busy === ad.id} onClick={() => decide(ad, 'approved')}><Check className="h-4 w-4" />Approve</Button>
                    )}
                    {ad.status !== 'rejected' && (
                      <Button size="sm" variant="outline" className="gap-1" disabled={busy === ad.id} onClick={() => decide(ad, 'rejected')}><X className="h-4 w-4" />Reject</Button>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1 text-destructive" disabled={busy === ad.id} onClick={() => remove(ad)}><Trash2 className="h-4 w-4" />Delete</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBazaar;
