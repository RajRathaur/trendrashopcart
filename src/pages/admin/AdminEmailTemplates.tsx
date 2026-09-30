import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSiteContent } from '@/hooks/useSiteContent';
import { toast } from 'sonner';

const STATUSES: { key: string; label: string; subject: string; body: string }[] = [
  { key: 'pending', label: 'Pending', subject: '⏳ Order #{order} placed', body: 'Hi {name}, your order #{order} has been placed. Total: {amount}.' },
  { key: 'confirmed', label: 'Confirmed', subject: '✅ Order #{order} confirmed', body: 'Great news {name}! Your order has been confirmed and is being prepared.' },
  { key: 'shipped', label: 'Shipped', subject: '🚚 Order #{order} shipped', body: 'Your order has been shipped and is on its way to you!' },
  { key: 'delivered', label: 'Delivered', subject: '📦 Order #{order} delivered', body: 'Your order has been delivered. We hope you love it!' },
  { key: 'cancelled', label: 'Cancelled', subject: '❌ Order #{order} cancelled', body: 'Your order has been cancelled. If you have questions, contact us.' },
  { key: 'returned', label: 'Returned', subject: '🔄 Order #{order} returned', body: 'Your order return has been processed successfully.' },
];

const AdminEmailTemplates = () => {
  const { get, set, loading } = useSiteContent();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    const d: Record<string, string> = { email_from: get('email_from', '') };
    for (const s of STATUSES) {
      d[`email_status_${s.key}_subject`] = get(`email_status_${s.key}_subject`, s.subject);
      d[`email_status_${s.key}_body`] = get(`email_status_${s.key}_body`, s.body);
    }
    setDraft(d);
  }, [loading, get]);

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const [k, v] of Object.entries(draft)) await set(k, v);
      toast.success('Email templates saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const upd = (k: string, v: string) => setDraft((p) => ({ ...p, [k]: v }));

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <p className="text-sm text-muted-foreground">
          Order ka status badalte hi customer ko ye mail apne aap jayega. Use karein: {'{name}'}, {'{order}'}, {'{status}'}, {'{amount}'}.
        </p>
        <Card className="p-4 space-y-2">
          <label className="text-sm font-medium">Sender (From) — optional</label>
          <Input placeholder="Trendra <orders@trendra.store>" value={draft.email_from || ''} onChange={(e) => upd('email_from', e.target.value)} />
          <p className="text-xs text-muted-foreground">Resend me verified domain ka address hi daalein, warna mail sirf aapke Resend account email par jayega.</p>
        </Card>
        {STATUSES.map((s) => (
          <Card key={s.key} className="p-4 space-y-2">
            <h2 className="font-semibold">{s.label}</h2>
            <Input value={draft[`email_status_${s.key}_subject`] || ''} maxLength={200} onChange={(e) => upd(`email_status_${s.key}_subject`, e.target.value)} />
            <Textarea rows={3} maxLength={2000} value={draft[`email_status_${s.key}_body`] || ''} onChange={(e) => upd(`email_status_${s.key}_body`, e.target.value)} />
          </Card>
        ))}
        <Button onClick={saveAll} disabled={saving}>{saving ? 'Saving…' : 'Save All'}</Button>
      </div>
    </AdminLayout>
  );
};

export default AdminEmailTemplates;
