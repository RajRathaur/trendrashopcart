import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tag, Loader2 } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: '' as number | '',
  usage_limit: '' as number | '',
  is_active: true,
  expires_at: '',
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setCoupons((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      min_order_amount: Number(c.min_order_amount || 0),
      max_discount_amount: c.max_discount_amount != null ? Number(c.max_discount_amount) : '',
      usage_limit: c.usage_limit != null ? Number(c.usage_limit) : '',
      is_active: c.is_active,
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) return toast.error('Code required');
    if (!form.discount_value || form.discount_value <= 0) return toast.error('Discount value must be > 0');
    if (form.discount_type === 'percentage' && form.discount_value > 100) return toast.error('Percentage cannot exceed 100');

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount) || 0,
      max_discount_amount: form.max_discount_amount === '' ? null : Number(form.max_discount_amount),
      usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    const res = editingId
      ? await supabase.from('coupons').update(payload).eq('id', editingId)
      : await supabase.from('coupons').insert(payload);

    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(editingId ? 'Coupon updated' : 'Coupon created');
    setOpen(false);
    fetchCoupons();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return toast.error(error.message);
    fetchCoupons();
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="h-6 w-6" /> Coupons</h1>
            <p className="text-sm text-muted-foreground">Create promo codes users can apply at checkout.</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Coupon</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">No coupons yet. Create your first promo code.</div>
        ) : (
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-3">Code</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3">Min Order</th>
                    <th className="p-3">Max Cap</th>
                    <th className="p-3">Usage</th>
                    <th className="p-3">Expires</th>
                    <th className="p-3">Active</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 font-mono font-semibold">{c.code}</td>
                      <td className="p-3">
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                      </td>
                      <td className="p-3">₹{c.min_order_amount || 0}</td>
                      <td className="p-3">{c.max_discount_amount ? `₹${c.max_discount_amount}` : '—'}</td>
                      <td className="p-3">{c.used_count || 0}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                      <td className="p-3">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                      <td className="p-3"><Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} /></td>
                      <td className="p-3 text-right space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE10" maxLength={30} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off on all orders" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type *</Label>
                <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage %</SelectItem>
                    <SelectItem value="fixed">Fixed ₹</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value *</Label>
                <Input type="number" min={1} value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Min Order ₹</Label>
                <Input type="number" min={0} value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Max Discount ₹</Label>
                <Input type="number" min={0} value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="No cap" />
              </div>
              <div>
                <Label>Usage Limit</Label>
                <Input type="number" min={1} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="Unlimited" />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCoupons;
