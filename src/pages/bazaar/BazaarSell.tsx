import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BazaarShell } from '@/components/bazaar/BazaarShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  BAZAAR_CATEGORIES, BAZAAR_CONDITIONS, MAX_BAZAAR_PHOTOS, uploadBazaarPhoto, validateBazaarListing,
} from '@/lib/bazaar';
import { ImagePlus, Info, Loader2, X } from 'lucide-react';

const BazaarSell = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', category: '', condition: '', city: '', state: '',
    images: [] as string[],
  });

  useEffect(() => {
    document.title = editing ? 'Ad badlein — Trendra Bazaar' : 'Purana saaman bechein — Trendra Bazaar';
  }, [editing]);

  // Prefill city/state from profile for new ads; load the ad when editing.
  useEffect(() => {
    if (!user) return;
    if (editing && id) {
      supabase.from('bazaar_listings').select('*').eq('id', id).eq('user_id', user.id).maybeSingle().then(({ data }) => {
        if (!data) { toast.error('Ye ad nahi mila'); navigate('/bazaar/my-ads'); return; }
        setForm({
          title: data.title, description: data.description, price: String(Number(data.price)),
          category: data.category, condition: data.condition, city: data.city, state: data.state ?? '',
          images: data.images,
        });
        setLoading(false);
      });
    } else {
      supabase.from('profiles').select('city, state').eq('user_id', user.id).maybeSingle().then(({ data }) => {
        if (data) setForm((f) => ({ ...f, city: f.city || data.city || '', state: f.state || data.state || '' }));
      });
    }
  }, [user, editing, id, navigate]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const room = MAX_BAZAAR_PHOTOS - form.images.length;
    if (room <= 0) { toast.error(`Zyada se zyada ${MAX_BAZAAR_PHOTOS} photos`); return; }
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, room)) {
        const url = await uploadBazaarPhoto(user.id, file);
        setForm((f) => ({ ...f, images: [...f.images, url] }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Photo upload nahi hui');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const result = validateBazaarListing({
      ...form,
      price: form.price.trim() === '' ? NaN : Number(form.price),
      category: form.category || undefined,
      condition: form.condition || undefined,
    });
    if (!result.ok) { toast.error(result.error); return; }
    const d = result.data;
    const row = {
      title: d.title, description: d.description, price: d.price, category: d.category,
      condition: d.condition, city: d.city, state: d.state || null, images: d.images,
    };
    setSaving(true);
    const { error } = editing && id
      ? await supabase.from('bazaar_listings').update(row).eq('id', id)
      : await supabase.from('bazaar_listings').insert({ ...row, user_id: user.id });
    setSaving(false);
    if (error) {
      toast.error(error.message.includes('5 ads') ? 'Aapke 5 ads pehle se approval me hain. Unke approve hone ka intezaar karein.' : 'Ad save nahi hua. Dobara try karein.');
      return;
    }
    toast.success('Ad bhej diya! Admin approve karte hi ye sabko dikhega.');
    navigate('/bazaar/my-ads');
  };

  if (loading) {
    return <BazaarShell><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></BazaarShell>;
  }

  return (
    <BazaarShell>
      <form onSubmit={submit} className="container mx-auto max-w-2xl space-y-5 px-3 py-5">
        <div>
          <h1 className="text-xl font-bold">{editing ? 'Apna ad badlein' : 'Purana saaman bechein'}</h1>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Har ad admin check karke live karta hai. {editing && 'Badlaav ke baad ad phir se approval me jayega.'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Photos ({form.images.length}/{MAX_BAZAAR_PHOTOS}) *</Label>
          <div className="grid grid-cols-4 gap-2">
            {form.images.map((src, i) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-foreground/70 py-0.5 text-center text-[10px] text-background">Cover</span>}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, images: f.images.filter((x) => x !== src) }))}
                  className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5"
                  aria-label="Photo hatayein"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {form.images.length < MAX_BAZAAR_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                {uploading ? 'Upload…' : 'Photo jodein'}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bz-title">Kya bech rahe hain? *</Label>
          <Input id="bz-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Redmi Note 12, 6GB, 1 saal purana" maxLength={100} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue placeholder="Chunein" /></SelectTrigger>
              <SelectContent>
                {BAZAAR_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Haalat *</Label>
            <Select value={form.condition} onValueChange={(v) => set('condition', v)}>
              <SelectTrigger><SelectValue placeholder="Chunein" /></SelectTrigger>
              <SelectContent>
                {BAZAAR_CONDITIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bz-price">Price (₹) *</Label>
          <Input id="bz-price" type="number" inputMode="numeric" min={0} step={1} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="e.g. 8500" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bz-desc">Details</Label>
          <Textarea id="bz-desc" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Kitna purana hai, koi kharabi, bill/box hai ya nahi…" maxLength={2000} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bz-city">Shehar *</Label>
            <Input id="bz-city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Jaipur" maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bz-state">Rajya</Label>
            <Input id="bz-state" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Rajasthan" maxLength={60} />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={saving || uploading}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editing ? 'Badlaav save karein' : 'Ad approval ke liye bhejein'}
        </Button>
      </form>
    </BazaarShell>
  );
};

export default BazaarSell;
