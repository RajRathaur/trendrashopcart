import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, ExternalLink, Loader2, Plus, Trash2, X } from 'lucide-react';
import { FEED_SELECT, FeedReel, formatCount } from '@/lib/reels';
import { timeAgo } from '@/lib/bazaar';

type Status = 'pending' | 'approved' | 'rejected';

const AdminReels = () => {
  const [status, setStatus] = useState<Status>('pending');
  const [reels, setReels] = useState<FeedReel[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: all }] = await Promise.all([
      supabase.from('reels').select(FEED_SELECT).eq('status', status).order('created_at', { ascending: status === 'pending' }).limit(100),
      supabase.from('reels').select('status'),
    ]);
    setReels((data as unknown as FeedReel[] | null) ?? []);
    setCounts((all ?? []).reduce<Record<string, number>>((m, r) => ({ ...m, [r.status]: (m[r.status] ?? 0) + 1 }), {}));
    setLoading(false);
  }, [status]);

  useEffect(() => { document.title = 'Reels — Admin'; load(); }, [load]);

  const decide = async (r: FeedReel, next: 'approved' | 'rejected') => {
    const note = (notes[r.id] ?? '').trim().slice(0, 500);
    if (next === 'rejected' && !note) { toast.error('Reject karne ki wajah likhein, ye user ko dikhegi'); return; }
    setBusy(r.id);
    const { error } = await supabase.from('reels').update({ status: next, admin_note: next === 'rejected' ? note : null }).eq('id', r.id);
    if (!error) {
      await supabase.rpc('log_admin_action', {
        _action: next === 'approved' ? 'reel_approve' : 'reel_reject',
        _entity_type: 'reel', _entity_id: r.id, _metadata: { username: r.author?.username ?? null, note },
      });
    }
    setBusy(null);
    if (error) { toast.error('Update nahi hua'); return; }
    toast.success(next === 'approved' ? 'Reel live ho gayi' : 'Reel reject ki');
    load();
  };

  const remove = async (r: FeedReel) => {
    if (!window.confirm('Ye reel hamesha ke liye delete karein?')) return;
    setBusy(r.id);
    const { error } = await supabase.from('reels').delete().eq('id', r.id);
    if (!error) await supabase.rpc('log_admin_action', { _action: 'reel_delete', _entity_type: 'reel', _entity_id: r.id, _metadata: {} });
    setBusy(null);
    if (error) { toast.error('Delete nahi hui'); return; }
    toast.success('Reel delete ho gayi');
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Reels</h1>
            <p className="text-sm text-muted-foreground">Users ki reels check karke approve ya reject karein.</p>
          </div>
          <Button asChild><Link to="/reels/upload"><Plus className="mr-1 h-4 w-4" />Apni reel daalein</Link></Button>
        </div>

        <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({counts.pending ?? 0})</TabsTrigger>
            <TabsTrigger value="approved">Live ({counts.approved ?? 0})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected ?? 0})</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : reels.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Koi reel nahi</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reels.map((r) => (
              <div key={r.id} className="space-y-3 rounded-lg border bg-card p-3">
                <video src={r.video_url} poster={r.thumbnail_url ?? undefined} controls playsInline preload="none" className="aspect-[9/16] max-h-96 w-full rounded bg-reel object-contain" />
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Link to={`/u/${r.author?.username ?? ''}`} className="truncate font-semibold hover:underline">@{r.author?.username ?? 'user'}</Link>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.created_at)} · {Math.round(Number(r.duration_seconds))}s</span>
                </div>
                {r.caption && <p className="line-clamp-3 whitespace-pre-wrap text-sm">{r.caption}</p>}
                {r.product && (
                  <Link to={`/product/${r.product.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />Product: {r.product.name}
                  </Link>
                )}
                {r.status === 'approved' && (
                  <p className="text-xs text-muted-foreground">
                    {formatCount(r.view_count)} views · {formatCount(r.like_count)} likes · {formatCount(r.comment_count)} comments
                  </p>
                )}
                {r.status === 'rejected' && r.admin_note && <Badge variant="destructive">Wajah: {r.admin_note}</Badge>}

                {r.status !== 'approved' && (
                  <Textarea
                    placeholder="Reject ki wajah (user ko dikhegi)"
                    rows={2}
                    value={notes[r.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {r.status !== 'approved' && (
                    <Button size="sm" disabled={busy === r.id} onClick={() => decide(r, 'approved')}><Check className="mr-1 h-4 w-4" />Approve</Button>
                  )}
                  {r.status === 'pending' && (
                    <Button size="sm" variant="secondary" disabled={busy === r.id} onClick={() => decide(r, 'rejected')}><X className="mr-1 h-4 w-4" />Reject</Button>
                  )}
                  {r.status === 'approved' && (
                    <Button size="sm" variant="secondary" asChild><Link to={`/reels/${r.id}`}><ExternalLink className="mr-1 h-4 w-4" />Dekhein</Link></Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={busy === r.id} onClick={() => remove(r)}>
                    <Trash2 className="mr-1 h-4 w-4" />Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReels;
