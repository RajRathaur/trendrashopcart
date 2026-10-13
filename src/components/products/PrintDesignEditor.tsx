import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PrintDesign, PrintSide, getPrintUrl } from '@/lib/printDesign';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function PrintDesignEditor({ images, productId, value, onChange }: {
  images: string[]; productId: string; value: PrintDesign | null; onChange: (value: PrintDesign | null) => void;
}) {
  const { user } = useAuth();
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const current = value?.[side];
  useEffect(() => {
    let active = true;
    setUrl('');
    if (current) getPrintUrl(current.path).then((u) => { if (active) setUrl(u); }).catch(() => toast.error('Design preview could not load'));
    return () => { active = false; };
  }, [current?.path]);
  const update = (patch: Partial<PrintSide>) => {
    if (!current || !value) return;
    onChange({ ...value, [side]: { ...current, ...patch } });
  };
  const upload = async (file?: File) => {
    if (!file || !user) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error('Choose a PNG or JPG up to 5 MB'); return;
    }
    setUploading(true);
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > 25000000) { bitmap.close(); throw new Error('Image is too large. Use an image under 25 megapixels.'); }
      // Re-encode pixels to reject disguised files and strip private EXIF metadata.
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Image could not be processed');
      ctx.drawImage(bitmap, 0, 0); bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Invalid image')), 'image/png'));
      if (blob.size > 5 * 1024 * 1024) throw new Error('Processed image exceeds 5 MB; choose a smaller image');
      const path = `${user.id}/${crypto.randomUUID()}.png`;
      const { error } = await supabase.storage.from('print-designs').upload(path, blob, { contentType: 'image/png', upsert: false });
      if (error) throw error;
      onChange({ ...value, version: 1, [side]: { path, name: file.name.slice(0, 120), size: 60, x: 20, y: 10 } });
      toast.success(`${side === 'front' ? 'Front' : 'Back'} design saved`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Upload failed'); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ''; }
  };
  return (
    <section className="space-y-4 border-t pt-5" aria-label="Custom print editor">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Your custom print</h3>
        <div className="flex gap-1" role="group" aria-label="Print side">
          {(['front', 'back'] as const).map((s) => <Button key={s} size="sm" variant={side === s ? 'default' : 'outline'} aria-pressed={side === s} onClick={() => setSide(s)} disabled={uploading || (s === 'back' && images.length < 2)}>{s === 'front' ? 'Front' : 'Back'}{value?.[s] ? ' ✓' : ''}</Button>)}
        </div>
      </div>
      <div className="relative aspect-square max-w-sm mx-auto bg-muted overflow-hidden rounded-md" data-testid="print-preview">
        <img src={images[side === 'front' ? 0 : 1] || images[0] || '/placeholder.svg'} alt={`${side} T-shirt preview`} className="w-full h-full object-contain" />
        <div className="absolute left-[32%] top-[30%] w-[36%] aspect-square border border-dashed border-primary/60">
          {current && url && <img src={url} alt={`${side} uploaded design`} className="absolute object-contain" style={{ width: `${current.size}%`, height: `${current.size}%`, left: `${current.x}%`, top: `${current.y}%` }} />}
        </div>
      </div>
      {user ? <>
        <input ref={fileInput} type="file" className="hidden" accept="image/png,image/jpeg" aria-label="Upload print design" onChange={(e) => void upload(e.target.files?.[0])} />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading} className="flex-1"><>{uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}{current ? 'Replace design' : 'Upload design'}</></Button>
          {current && <Button variant="ghost" size="icon" aria-label="Remove design" disabled={uploading} onClick={() => { if (!value) return; const next = { ...value }; delete next[side]; onChange(next.front || next.back ? next : null); }}><Trash2 className="h-4 w-4" /></Button>}
        </div>
      </> : <Button asChild variant="outline" className="w-full"><Link to={`/login?redirect=${encodeURIComponent(`/product/${productId}`)}`}>Log in to upload design</Link></Button>}
      {current && <div className="space-y-4">
        <p className="text-xs text-muted-foreground break-all">{current.name}</p>
        <div className="flex items-center justify-between"><span className="text-sm font-medium">Print placement</span><Button size="icon" variant="ghost" aria-label="Reset print placement" onClick={() => update({ size: 60, x: 20, y: 10 })}><RotateCcw className="h-4 w-4" /></Button></div>
        <Label className="flex justify-between">Size <span>{current.size}%</span></Label>
        <Slider aria-label="Print size" value={[current.size]} min={30} max={100} step={1} onValueChange={([size]) => update({ size, x: Math.min(current.x, 100 - size), y: Math.min(current.y, 100 - size) })} />
        <Label>Horizontal position</Label><Slider aria-label="Horizontal print position" value={[current.x]} min={0} max={Math.max(1, 100 - current.size)} disabled={current.size === 100} step={1} onValueChange={([x]) => update({ x })} />
        <Label>Vertical position</Label><Slider aria-label="Vertical print position" value={[current.y]} min={0} max={Math.max(1, 100 - current.size)} disabled={current.size === 100} step={1} onValueChange={([y]) => update({ y })} />
      </div>}
      <p className="text-xs text-muted-foreground">PNG / JPG · Up to 5 MB · Preview is approximate</p>
    </section>
  );
}