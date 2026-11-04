import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Clapperboard, Info, Loader2, Search, ShoppingBag, X } from 'lucide-react';
import {
  MAX_CAPTION, MAX_REEL_MB, MAX_REEL_SECONDS, checkReelVideo, ensureSocialProfile, readVideo, uploadReelFile, uploadReelVideo,
} from '@/lib/reels';

type ProductHit = { id: string; name: string; price: number; images: string[] | null };

const ReelUpload = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [poster, setPoster] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('');
  const [product, setProduct] = useState<ProductHit | null>(null);
  const [search, setSearch] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = 'Reel daalein — Trendra'; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setHits([]); return; }
    const t = window.setTimeout(async () => {
      const { data } = await supabase.from('products').select('id, name, price, images')
        .eq('is_active', true).ilike('name', `%${q.replace(/[%_,()]/g, ' ')}%`).limit(6);
      setHits((data as ProductHit[] | null) ?? []);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setChecking(true);
    try {
      const meta = await readVideo(f);
      const err = checkReelVideo(f, meta.duration);
      if (err) { toast.error(err); return; }
      if (preview) URL.revokeObjectURL(preview);
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setPoster(meta.poster);
      setDuration(meta.duration);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Video nahi khul paya');
    } finally {
      setChecking(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async () => {
    if (!user || !file) return;
    setSaving(true);
    try {
      await ensureSocialProfile();
      const videoUrl = await uploadReelVideo(user.id, file);
      const thumbUrl = poster ? await uploadReelFile(user.id, poster, 'jpg', 'image/jpeg') : null;
      const { error } = await supabase.from('reels').insert({
        user_id: user.id,
        video_url: videoUrl,
        thumbnail_url: thumbUrl,
        caption: caption.trim().slice(0, MAX_CAPTION),
        product_id: product?.id ?? null,
        duration_seconds: Math.min(MAX_REEL_SECONDS, Math.round(duration * 10) / 10),
        ...(isAdmin ? { status: 'approved' } : {}),
      });
      if (error) throw new Error(error.message.includes('5 reels') ? 'Aapki 5 reels pehle se approval me hain. Unke approve hone ka intezaar karein.' : 'Reel save nahi hui, dobara try karein');
      toast.success(isAdmin ? 'Reel live ho gayi!' : 'Reel bhej di! Admin approve karte hi sabko dikhegi.');
      navigate('/u/me');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reel upload nahi hui');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="container mx-auto max-w-xl space-y-5 px-3 py-5">
        <div>
          <h1 className="text-xl font-bold">Nayi reel daalein</h1>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {MAX_REEL_SECONDS} second tak, {MAX_REEL_MB}MB tak. {isAdmin ? 'Admin ki reel turant live hoti hai.' : 'Har reel admin check karke live karta hai.'}
          </p>
        </div>

        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />

        {preview ? (
          <div className="relative mx-auto aspect-[9/16] max-h-[60svh] overflow-hidden rounded-xl bg-reel">
            <video src={preview} className="h-full w-full object-contain" controls playsInline loop />
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); setPoster(null); }}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-1"
              aria-label="Video hatayein"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-xs font-medium">
              {Math.round(duration)} sec
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={checking}
            className="flex aspect-[9/16] max-h-[50svh] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary"
          >
            {checking ? <Loader2 className="h-8 w-8 animate-spin" /> : <Clapperboard className="h-10 w-10" />}
            <span className="text-sm font-medium">{checking ? 'Video check ho raha hai…' : 'Video chunein'}</span>
          </button>
        )}

        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={MAX_CAPTION} rows={3} placeholder="Is reel ke baare me likhein… #fashion #ootd" />
          <p className="text-right text-xs text-muted-foreground">{caption.length}/{MAX_CAPTION}</p>
        </div>

        <div className="space-y-2">
          <Label>Product jodein (optional)</Label>
          {product ? (
            <div className="flex items-center gap-3 rounded-lg border p-2">
              {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-10 w-10 rounded object-cover" /> : <ShoppingBag className="h-5 w-5" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">₹{Math.round(Number(product.price)).toLocaleString('en-IN')}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setProduct(null)} aria-label="Product hatayein"><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Trendra product ka naam likhein" className="pl-9" />
              {hits.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border bg-popover shadow-md">
                  {hits.map((h) => (
                    <li key={h.id}>
                      <button type="button" onClick={() => { setProduct(h); setSearch(''); setHits([]); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted">
                        {h.images?.[0] ? <img src={h.images[0]} alt="" className="h-8 w-8 rounded object-cover" /> : <ShoppingBag className="h-4 w-4" />}
                        <span className="min-w-0 flex-1 truncate text-sm">{h.name}</span>
                        <span className="text-xs font-semibold">₹{Math.round(Number(h.price))}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Reel par chhota sa product link dikhega, video ko nahi dhakega.</p>
        </div>

        <Button type="button" className="w-full" size="lg" disabled={!file || saving} onClick={submit}>
          {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Upload ho raha hai…</> : 'Reel post karein'}
        </Button>
      </div>
    </Layout>
  );
};

export default ReelUpload;
