import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getPrintUrl, parsePrintDesign } from '@/lib/printDesign';
import { Download, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function PrintDesignDetails({ design }: { design: unknown }) {
  const parsed = parsePrintDesign(design);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  if (!parsed) return null;
  const show = async () => {
    setLoading(true);
    try {
      const entries = await Promise.all((['front', 'back'] as const).map(async (side) => {
        const item = parsed[side];
        return [side, item ? await getPrintUrl(item.path) : ''];
      }));
      setUrls(Object.fromEntries(entries)); setOpen(true);
    } catch { toast.error('Design could not load. Please try again.'); }
    finally { setLoading(false); }
  };
  return <>
    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void show()} disabled={loading}><ImageIcon className="w-3.5 h-3.5 mr-1" />{loading ? 'Loading…' : 'View print design'}</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Saved print designs</DialogTitle></DialogHeader>
      {(['front', 'back'] as const).map((side) => {
        const item = parsed[side];
        if (!item) return null;
        return <div key={side} className="space-y-2"><h4 className="font-medium capitalize">{side}</h4><div className="relative aspect-square bg-muted border border-dashed border-primary/50"><img src={urls[side]} alt={`${side} saved print`} className="absolute object-contain" style={{ width: `${item.size}%`, height: `${item.size}%`, left: `${item.x}%`, top: `${item.y}%` }} /></div><p className="text-xs text-muted-foreground break-all">{item.name} · Size {item.size}% · X {item.x}% · Y {item.y}%</p><Button variant="outline" size="sm" asChild><a href={urls[side]} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 mr-2" />Open original {side} design</a></Button></div>;
      })}
    </DialogContent></Dialog>
  </>;
}