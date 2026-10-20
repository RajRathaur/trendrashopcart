import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, PartyPopper } from 'lucide-react';
import { FestivalSaleCard } from '@/components/home/FestivalSaleBanner';
import {
  FestivalSale,
  SALE_KEYS,
  SALE_PRESETS,
  SaleTheme,
  defaultSaleWindow,
  getSaleStatus,
  parseSale,
  toLocalInput,
} from '@/lib/festivalSale';

const statusLabel = {
  off: { text: 'Band hai', variant: 'secondary' as const },
  scheduled: { text: 'Shuru hone wala', variant: 'outline' as const },
  live: { text: 'Live chal raha hai', variant: 'default' as const },
  ended: { text: 'Khatam ho gaya', variant: 'destructive' as const },
};

const AdminFestivalSale = () => {
  const { content, loading } = useSiteContent();
  const [form, setForm] = useState<FestivalSale | null>(null);
  const [coupons, setCoupons] = useState<string[]>([]);
  const [syncCoupon, setSyncCoupon] = useState(true);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    document.title = 'Festival Sale — Trendra Admin';
    const id = setInterval(() => setNow(new Date()), 1000);
    supabase.from('coupons').select('code').eq('is_active', true).then(({ data }) => {
      setCoupons((data || []).map((c: any) => c.code));
    });
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!loading && !form) {
      const s = parseSale(content);
      if (!s.endAt) Object.assign(s, defaultSaleWindow());
      setForm(s);
    }
  }, [loading, content, form]);

  const status = useMemo(() => (form ? getSaleStatus(form, now) : 'off'), [form, now]);

  if (!form) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const update = (patch: Partial<FestivalSale>) => setForm({ ...form, ...patch });

  const applyPreset = (theme: SaleTheme) => {
    const p = SALE_PRESETS[theme];
    update({ theme, title: p.title, subtitle: p.subtitle });
  };

  const startNow24h = () => update(defaultSaleWindow());
  const extend = (hours: number) => {
    const base = form.endAt && form.endAt > new Date() ? form.endAt : new Date();
    update({ endAt: new Date(base.getTime() + hours * 3600_000) });
  };

  const save = async (override?: Partial<FestivalSale>) => {
    const data = { ...form, ...override };
    if (!data.title.trim()) return toast.error('Offer ka naam likhiye');
    if (!data.endAt) return toast.error('Khatam hone ka time chuniye');
    if (data.startAt && data.startAt >= data.endAt) return toast.error('Khatam hone ka time shuru hone ke baad hona chahiye');

    setSaving(true);
    const coupon = data.coupon.trim().toUpperCase();
    const rows = [
      [SALE_KEYS.enabled, String(data.enabled)],
      [SALE_KEYS.theme, data.theme],
      [SALE_KEYS.title, data.title.trim()],
      [SALE_KEYS.subtitle, data.subtitle.trim()],
      [SALE_KEYS.coupon, coupon],
      [SALE_KEYS.startAt, data.startAt ? data.startAt.toISOString() : ''],
      [SALE_KEYS.endAt, data.endAt.toISOString()],
    ].map(([content_key, content_value]) => ({ content_key, content_value, description: 'Festival sale setting' }));

    const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'content_key' });
    if (error) {
      setSaving(false);
      return toast.error(`Save nahi hua: ${error.message}`);
    }

    if (coupon && syncCoupon) {
      const { error: cErr } = await supabase
        .from('coupons')
        .update({ expires_at: data.endAt.toISOString() })
        .eq('code', coupon);
      if (cErr) toast.error(`Coupon ka time update nahi hua: ${cErr.message}`);
    }

    setForm({ ...data, coupon });
    setSaving(false);
    toast.success(data.enabled ? 'Sale save ho gayi — homepage par dikh rahi hai' : 'Sale band kar di');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PartyPopper className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Festival Sale</h1>
              <p className="text-sm text-muted-foreground">Diwali, Dussehra ya koi bhi offer — homepage par countdown ke saath</p>
            </div>
          </div>
          <Badge variant={statusLabel[status].variant}>{statusLabel[status].text}</Badge>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview (homepage par aisa dikhega)</Label>
          <FestivalSaleCard sale={{ ...form, enabled: true }} now={now} />
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="sale-on" className="text-base">Sale chalu karein</Label>
              <p className="text-xs text-muted-foreground">Band karne par homepage se turant hat jaayegi. Time khatam hone par apne aap hat jaayegi.</p>
            </div>
            <Switch id="sale-on" checked={form.enabled} onCheckedChange={(v) => update({ enabled: v })} />
          </div>

          <div className="space-y-2">
            <Label>Offer chuniye</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SALE_PRESETS) as SaleTheme[]).map((k) => (
                <Button key={k} type="button" variant={form.theme === k ? 'default' : 'outline'} size="sm" onClick={() => applyPreset(k)}>
                  {SALE_PRESETS[k].emoji} {SALE_PRESETS[k].label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sale-title">Offer ka naam</Label>
              <Input id="sale-title" value={form.title} maxLength={60} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sale-sub">Chhota message</Label>
              <Input id="sale-sub" value={form.subtitle} maxLength={120} onChange={(e) => update({ subtitle: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-coupon">Coupon code (optional)</Label>
              <Input
                id="sale-coupon"
                list="sale-coupon-list"
                value={form.coupon}
                placeholder="jaise DIWALI20"
                onChange={(e) => update({ coupon: e.target.value.toUpperCase() })}
              />
              <datalist id="sale-coupon-list">
                {coupons.map((c) => <option key={c} value={c} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Coupon pehle Admin → Coupons me banaiye, phir yahan likhiye.</p>
            </div>
            <div className="flex items-start gap-3 pt-6">
              <Switch id="sale-sync" checked={syncCoupon} onCheckedChange={setSyncCoupon} />
              <Label htmlFor="sale-sync" className="text-sm font-normal leading-snug">
                Coupon bhi sale ke saath hi khatam ho jaaye
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Sale ka time</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={startNow24h}>Abhi se 24 ghante</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => extend(1)}>+1 ghanta</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => extend(6)}>+6 ghante</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => extend(24)}>+1 din</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sale-start">Shuru</Label>
                <Input
                  id="sale-start"
                  type="datetime-local"
                  value={toLocalInput(form.startAt)}
                  onChange={(e) => update({ startAt: e.target.value ? new Date(e.target.value) : null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sale-end">Khatam</Label>
                <Input
                  id="sale-end"
                  type="datetime-local"
                  value={toLocalInput(form.endAt)}
                  onChange={(e) => update({ endAt: e.target.value ? new Date(e.target.value) : null })}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save karein
            </Button>
            {form.enabled && (
              <Button variant="outline" disabled={saving} onClick={() => { update({ enabled: false }); save({ enabled: false }); }}>
                Sale abhi band karein
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFestivalSale;
