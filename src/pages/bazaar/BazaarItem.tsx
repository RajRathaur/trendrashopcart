import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BazaarShell } from '@/components/bazaar/BazaarShell';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { loginPath } from '@/lib/publicPaths';
import {
  BAZAAR_SAFETY_TIPS, BazaarListing, categoryEmoji, categoryLabel, conditionLabel, formatBazaarPrice, timeAgo,
} from '@/lib/bazaar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, MapPin, MessageCircle, Pencil, ShieldAlert, User } from 'lucide-react';

const BazaarItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<BazaarListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase.from('bazaar_listings').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      setListing(data);
      setActive(0);
      setLoading(false);
    });
  }, [id]);

  const startChat = async () => {
    if (!listing) return;
    if (!user) { navigate(loginPath(`/bazaar/item/${listing.id}`)); return; }
    setStarting(true);
    const { data: existing } = await supabase
      .from('bazaar_conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', user.id)
      .maybeSingle();
    if (existing) { navigate(`/bazaar/chats/${existing.id}`); return; }
    const { data, error } = await supabase
      .from('bazaar_conversations')
      .insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.user_id })
      .select('id')
      .single();
    setStarting(false);
    if (error || !data) { toast.error('Chat shuru nahi ho payi. Thodi der baad try karein.'); return; }
    navigate(`/bazaar/chats/${data.id}`);
  };

  if (loading) {
    return (
      <BazaarShell>
        <div className="container mx-auto grid gap-4 px-3 py-4 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-3"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-6 w-2/3" /><Skeleton className="h-24" /></div>
        </div>
      </BazaarShell>
    );
  }

  if (!listing) {
    return (
      <BazaarShell>
        <div className="container mx-auto px-3 py-16 text-center">
          <p className="text-lg font-semibold">Ye ad nahi mila</p>
          <p className="text-sm text-muted-foreground">Ho sakta hai ye hata diya gaya ho.</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/bazaar">Bazaar par wapas</Link></Button>
        </div>
      </BazaarShell>
    );
  }

  const isOwner = user?.id === listing.user_id;
  const price = formatBazaarPrice(Number(listing.price));

  return (
    <BazaarShell>
      <Seo
        title={`${listing.title} — ${price} | Trendra Bazaar`}
        description={`${listing.title} ${listing.city} me ${price} me. ${listing.description.slice(0, 120)}`}
        path={`/bazaar/item/${listing.id}`}
        image={listing.images[0]}
      />
      <div className="container mx-auto px-3 py-4">
        <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Wapas
        </button>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
              <img src={listing.images[active]} alt={listing.title} className="h-full w-full object-contain" />
              {listing.status === 'sold' && (
                <span className="absolute left-3 top-3 rounded bg-foreground px-2 py-1 text-xs font-bold text-background">SOLD</span>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {listing.images.map((src, i) => (
                  <button key={src} onClick={() => setActive(i)} className={cn('h-16 w-16 shrink-0 overflow-hidden rounded-md border-2', i === active ? 'border-primary' : 'border-transparent')} aria-label={`Photo ${i + 1}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {listing.status !== 'approved' && listing.status !== 'sold' && (
              <Badge variant={listing.status === 'rejected' ? 'destructive' : 'secondary'}>
                {listing.status === 'pending' ? 'Admin approval ka intezaar' : 'Reject hua'}
              </Badge>
            )}
            <div>
              <p className="text-3xl font-bold">{price}</p>
              <h1 className="mt-1 text-xl font-semibold leading-snug">{listing.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{listing.city}{listing.state ? `, ${listing.state}` : ''}</span>
                <span>{timeAgo(listing.approved_at ?? listing.created_at)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{categoryEmoji(listing.category)} {categoryLabel(listing.category)}</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="text-xs text-muted-foreground">Haalat</p>
                <p className="font-medium">{conditionLabel(listing.condition)}</p>
              </div>
            </div>

            {listing.description && (
              <div>
                <h2 className="mb-1 text-sm font-semibold">Details</h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{listing.description}</p>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><User className="h-5 w-5" /></span>
              <div>
                <p className="text-xs text-muted-foreground">Bechne wale</p>
                <p className="font-medium">{listing.seller_name}</p>
              </div>
            </div>

            {isOwner ? (
              <Button asChild variant="outline" className="w-full gap-2"><Link to={`/bazaar/edit/${listing.id}`}><Pencil className="h-4 w-4" />Apna ad badlein</Link></Button>
            ) : listing.status === 'approved' ? (
              <Button className="w-full gap-2" size="lg" onClick={startChat} disabled={starting}>
                {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                Seller se chat karein
              </Button>
            ) : (
              <Button className="w-full" size="lg" disabled>Ye saaman bik chuka hai</Button>
            )}

            <div className="rounded-lg border border-dashed p-3 text-sm">
              <p className="mb-1 flex items-center gap-1.5 font-semibold"><ShieldAlert className="h-4 w-4 text-primary" />Surakshit rahein</p>
              <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
                {BAZAAR_SAFETY_TIPS.map((t) => <li key={t}>{t}</li>)}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Paisa aap dono aapas me dete hain. Trendra is len-den me shaamil nahi hai.</p>
            </div>
          </div>
        </div>
      </div>
    </BazaarShell>
  );
};

export default BazaarItem;
