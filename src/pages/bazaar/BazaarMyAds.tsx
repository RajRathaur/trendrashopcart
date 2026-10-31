import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BazaarShell } from '@/components/bazaar/BazaarShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { BazaarListing, formatBazaarPrice, timeAgo } from '@/lib/bazaar';
import { CheckCircle2, Loader2, Pencil, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';

const statusInfo: Record<string, { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { text: 'Approval ka intezaar', variant: 'secondary' },
  approved: { text: 'Live hai', variant: 'default' },
  rejected: { text: 'Reject hua', variant: 'destructive' },
  sold: { text: 'Bik gaya', variant: 'outline' },
};

const BazaarMyAds = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<BazaarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('bazaar_listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAds(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { document.title = 'Mere Ads — Trendra Bazaar'; load(); }, [load]);

  const setStatus = async (ad: BazaarListing, status: 'sold' | 'approved') => {
    setBusy(ad.id);
    const { error } = await supabase.from('bazaar_listings').update({ status }).eq('id', ad.id);
    setBusy(null);
    if (error) { toast.error('Update nahi hua'); return; }
    toast.success(status === 'sold' ? 'Ad "bik gaya" mark ho gaya' : 'Ad phir se live hai');
    load();
  };

  const remove = async (ad: BazaarListing) => {
    setBusy(ad.id);
    const { error } = await supabase.from('bazaar_listings').delete().eq('id', ad.id);
    if (!error && user) {
      const paths = ad.images
        .map((u) => u.split('/storage/v1/object/public/product-images/')[1])
        .filter((p): p is string => Boolean(p) && p.startsWith(`bazaar/${user.id}/`));
      if (paths.length) await supabase.storage.from('product-images').remove(paths);
    }
    setBusy(null);
    if (error) { toast.error('Ad delete nahi hua'); return; }
    toast.success('Ad hata diya');
    load();
  };

  return (
    <BazaarShell>
      <div className="container mx-auto max-w-3xl space-y-3 px-3 py-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Mere Ads</h1>
          <Button asChild size="sm" className="gap-1.5"><Link to="/bazaar/sell"><PlusCircle className="h-4 w-4" />Naya ad</Link></Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : ads.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="font-semibold">Aapne abhi koi ad nahi lagaya</p>
            <p className="mt-1 text-sm text-muted-foreground">Ghar me pada purana saaman bechkar paise kamaiye.</p>
          </div>
        ) : (
          ads.map((ad) => {
            const s = statusInfo[ad.status] ?? statusInfo.pending;
            return (
              <div key={ad.id} className="flex gap-3 rounded-xl border bg-card p-3">
                <Link to={`/bazaar/item/${ad.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={ad.images[0]} alt={ad.title} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={s.variant}>{s.text}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(ad.created_at)}</span>
                  </div>
                  <p className="truncate font-medium">{ad.title}</p>
                  <p className="text-sm font-bold">{formatBazaarPrice(Number(ad.price))}</p>
                  {ad.status === 'rejected' && ad.admin_note && (
                    <p className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">Admin: {ad.admin_note}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button asChild size="sm" variant="outline" className="h-8 gap-1"><Link to={`/bazaar/edit/${ad.id}`}><Pencil className="h-3.5 w-3.5" />Badlein</Link></Button>
                    {ad.status === 'approved' && (
                      <Button size="sm" variant="outline" className="h-8 gap-1" disabled={busy === ad.id} onClick={() => setStatus(ad, 'sold')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />Bik gaya
                      </Button>
                    )}
                    {ad.status === 'sold' && (
                      <Button size="sm" variant="outline" className="h-8 gap-1" disabled={busy === ad.id} onClick={() => setStatus(ad, 'approved')}>
                        <RotateCcw className="h-3.5 w-3.5" />Phir live karein
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-destructive" disabled={busy === ad.id}><Trash2 className="h-3.5 w-3.5" />Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ye ad delete karein?</AlertDialogTitle>
                          <AlertDialogDescription>Ad aur uski saari chats hamesha ke liye hat jayengi.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Nahi</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(ad)}>Haan, delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </BazaarShell>
  );
};

export default BazaarMyAds;
