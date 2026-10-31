import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { BazaarShell } from '@/components/bazaar/BazaarShell';
import { ListingCard } from '@/components/bazaar/ListingCard';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { BAZAAR_CATEGORIES, BazaarListing } from '@/lib/bazaar';
import { cn } from '@/lib/utils';
import { MapPin, PlusCircle, Search } from 'lucide-react';

const PAGE = 24;

const clean = (s: string) => s.replace(/[%,()*\\]/g, ' ').trim().slice(0, 60);

const BazaarHome = () => {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const q = params.get('q') ?? '';
  const city = params.get('city') ?? '';
  const [search, setSearch] = useState(q);
  const [cityInput, setCityInput] = useState(city);
  const [items, setItems] = useState<BazaarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const load = async (offset: number) => {
    setLoading(true);
    let query = supabase
      .from('bazaar_listings')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + PAGE - 1);
    if (category) query = query.eq('category', category);
    if (clean(q)) query = query.ilike('title', `%${clean(q)}%`);
    if (clean(city)) query = query.ilike('city', `%${clean(city)}%`);
    const { data } = await query;
    const rows = data ?? [];
    setItems((prev) => (offset === 0 ? rows : [...prev, ...rows]));
    setHasMore(rows.length === PAGE);
    setLoading(false);
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q, city]);

  const update = (next: Record<string, string>) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p, { replace: true });
  };

  return (
    <BazaarShell>
      <Seo
        title="Trendra Bazaar — Purana saaman becho aur kharido"
        description="Mobiles, bikes, furniture, electronics aur bahut kuch — apne shehar me second-hand saaman sasta kharidein ya apna purana saaman bechein."
        path="/bazaar"
      />
      <div className="container mx-auto px-3 py-4 space-y-4">
        <form
          onSubmit={(e) => { e.preventDefault(); update({ q: search.trim(), city: cityInput.trim() }); }}
          className="grid gap-2 sm:grid-cols-[1fr_200px_auto]"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Kya dhoondh rahe hain? e.g. iPhone, cycle" className="pl-9" maxLength={60} aria-label="Search ads" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Shehar" className="pl-9" maxLength={60} aria-label="City" />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => update({ category: '' })}
            className={cn('shrink-0 rounded-full border px-3 py-1.5 text-sm', !category ? 'border-primary bg-primary/10 text-primary font-medium' : 'bg-card')}
          >
            Sab
          </button>
          {BAZAAR_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ category: c.value })}
              className={cn('shrink-0 rounded-full border px-3 py-1.5 text-sm', category === c.value ? 'border-primary bg-primary/10 text-primary font-medium' : 'bg-card')}
            >
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="text-lg font-semibold">Abhi yahan koi ad nahi hai</p>
            <p className="mt-1 text-sm text-muted-foreground">Sabse pehle apna purana saaman bechiye.</p>
            <Button asChild className="mt-4 gap-2"><Link to="/bazaar/sell"><PlusCircle className="h-4 w-4" />Ad lagayein</Link></Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
            {hasMore && (
              <div className="text-center">
                <Button variant="outline" onClick={() => load(items.length)} disabled={loading}>
                  {loading ? 'Load ho raha hai…' : 'Aur dikhayein'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Link
        to="/bazaar/sell"
        className="fixed bottom-20 right-4 z-30 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg md:bottom-6"
      >
        <PlusCircle className="h-5 w-5" /> Becho
      </Link>
    </BazaarShell>
  );
};

export default BazaarHome;
