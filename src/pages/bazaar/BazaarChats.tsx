import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BazaarShell } from '@/components/bazaar/BazaarShell';
import { Button } from '@/components/ui/button';
import { BazaarConversation, timeAgo } from '@/lib/bazaar';
import { Loader2, MessageCircle } from 'lucide-react';

const BazaarChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<BazaarConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bazaar_conversations')
      .select('*')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });
    setChats(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    document.title = 'Chats — Trendra Bazaar';
    load();
    const ch = supabase
      .channel(`bazaar-chats-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bazaar_conversations' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return (
    <BazaarShell>
      <div className="container mx-auto max-w-3xl px-3 py-5">
        <h1 className="mb-3 text-xl font-bold">Chats</h1>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : chats.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Abhi koi chat nahi hai</p>
            <p className="mt-1 text-sm text-muted-foreground">Koi ad pasand aaye to "Seller se chat karein" dabaiye.</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/bazaar">Ads dekhein</Link></Button>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {chats.map((c) => {
              const iAmBuyer = c.buyer_id === user?.id;
              const other = iAmBuyer ? c.seller_name : c.buyer_name;
              const unread = iAmBuyer ? c.buyer_unread : c.seller_unread;
              return (
                <li key={c.id}>
                  <Link to={`/bazaar/chats/${c.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {c.listing_image && <img src={c.listing_image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{other}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.last_message_at)}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {iAmBuyer ? 'Aap khareed rahe hain' : 'Aapka ad'} · {c.listing_title}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <span className={unread > 0 ? 'truncate text-sm font-semibold' : 'truncate text-sm text-muted-foreground'}>
                          {c.last_message ?? 'Chat shuru karein'}
                        </span>
                        {unread > 0 && (
                          <span className="shrink-0 rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">{unread}</span>
                        )}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </BazaarShell>
  );
};

export default BazaarChats;
