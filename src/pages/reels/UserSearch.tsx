import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { VideoNav } from '@/components/reels/VideoNav';
import { supabase } from '@/integrations/supabase/client';
import { SocialProfile, avatarLetter } from '@/lib/reels';
import { searchTerm } from '@/lib/techVideos';
import { Loader2 } from 'lucide-react';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<SocialProfile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    const q = searchTerm(query.replace(/^@/, ''));
    if (!q) { setPeople([]); setBusy(false); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      const { data, error: e } = await supabase.from('social_profiles').select('*').ilike('username', `%${q}%`).order('username').limit(30);
      if (live) { setPeople(data ?? []); setError(e ? 'Search nahi hui, dobara try karein' : ''); setBusy(false); }
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [query]);
  return <Layout><div className="container mx-auto max-w-3xl px-3 py-6"><VideoNav /><h1 className="mb-4 text-2xl font-bold">Username search</h1><Input aria-label="Username search" placeholder="@username" value={query} onChange={e => setQuery(e.target.value)} />
    {busy ? <Loader2 className="mx-auto my-10 animate-spin" /> : error ? <p role="alert" className="py-8 text-destructive">{error}</p> : <ul className="mt-5 divide-y">{people.map(p => <li key={p.user_id}><Link to={`/u/${p.username}`} className="flex items-center gap-3 py-4">{p.avatar_url ? <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">{avatarLetter(p)}</span>}<span className="min-w-0"><strong className="block truncate">@{p.username}</strong><span className="block truncate text-sm text-muted-foreground">{p.display_name}</span></span></Link></li>)}</ul>}
    {!busy && query && !people.length && !error && <p className="py-10 text-center text-muted-foreground">Koi username nahi mila</p>}
  </div></Layout>;
}