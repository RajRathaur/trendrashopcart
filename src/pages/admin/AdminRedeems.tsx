import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Gift, Coins } from 'lucide-react';

interface Req {
  id: string;
  user_id: string;
  coins_spent: number;
  amount_inr: number;
  status: string;
  google_play_code: string | null;
  admin_notes: string | null;
  contact_email: string | null;
  created_at: string;
}

const AdminRedeems = () => {
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, { code: string; notes: string }>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('redeem_requests').select('*').order('created_at', { ascending: false });
    if (data) setRequests(data as Req[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setEdit = (id: string, k: 'code' | 'notes', v: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || { code: '', notes: '' }), [k]: v } }));
  };

  const updateStatus = async (r: Req, status: 'approved' | 'rejected') => {
    const e = edits[r.id] || { code: '', notes: '' };
    if (status === 'approved' && !e.code.trim()) {
      toast({ title: 'Google Play code required', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase as any).from('redeem_requests').update({
      status,
      google_play_code: status === 'approved' ? e.code.trim() : null,
      admin_notes: e.notes.trim() || null,
    }).eq('id', r.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    // If rejected, refund coins
    if (status === 'rejected') {
      await (supabase as any).from('coin_wallet').select('balance').eq('user_id', r.user_id).maybeSingle().then(async ({ data }: any) => {
        if (data) {
          await (supabase as any).from('coin_wallet').update({ balance: data.balance + r.coins_spent }).eq('user_id', r.user_id);
        }
      });
    }
    toast({ title: `Request ${status}` });
    load();
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return <Badge className="bg-green-500">Approved</Badge>;
    if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Redeem Requests</h1>
        </div>

        {loading ? <p>Loading...</p> : requests.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No redeem requests yet.</Card>
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold">₹{Number(r.amount_inr).toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" />{r.coins_spent}</span>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">📧 {r.contact_email || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">User: {r.user_id.slice(0, 8)}... • {new Date(r.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {r.status === 'pending' ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Google Play Redeem Code"
                      value={edits[r.id]?.code || ''}
                      onChange={e => setEdit(r.id, 'code', e.target.value)}
                    />
                    <Textarea
                      placeholder="Admin notes (optional)"
                      rows={2}
                      value={edits[r.id]?.notes || ''}
                      onChange={e => setEdit(r.id, 'notes', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => updateStatus(r, 'approved')} className="bg-green-600 hover:bg-green-700">Approve & Send Code</Button>
                      <Button onClick={() => updateStatus(r, 'rejected')} variant="destructive">Reject & Refund</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-3 rounded space-y-1">
                    {r.google_play_code && <p className="text-sm"><span className="font-semibold">Code:</span> <code className="font-mono">{r.google_play_code}</code></p>}
                    {r.admin_notes && <p className="text-sm text-muted-foreground italic">{r.admin_notes}</p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRedeems;
