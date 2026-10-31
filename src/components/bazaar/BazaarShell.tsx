import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MessageCircle, PlusCircle, Recycle, Store } from 'lucide-react';

const tabs = [
  { href: '/bazaar', label: 'Kharido', icon: Store },
  { href: '/bazaar/sell', label: 'Becho', icon: PlusCircle },
  { href: '/bazaar/my-ads', label: 'Mere Ads', icon: Recycle },
  { href: '/bazaar/chats', label: 'Chats', icon: MessageCircle },
];

/** Shared header + tab bar for the Trendra Bazaar (used items) panel. */
export const BazaarShell = ({ children, hideFooter }: { children: ReactNode; hideFooter?: boolean }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('bazaar_conversations')
        .select('buyer_id, buyer_unread, seller_unread')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
      if (cancelled || !data) return;
      setUnread(data.reduce((n, c) => n + (c.buyer_id === user.id ? c.buyer_unread : c.seller_unread), 0));
    };
    load();
    const ch = supabase
      .channel(`bazaar-unread-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bazaar_conversations' }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [user]);

  const active = (href: string) =>
    href === '/bazaar' ? pathname === '/bazaar' || pathname.startsWith('/bazaar/item') : pathname.startsWith(href);

  return (
    <Layout hideFooter={hideFooter}>
      <div className="border-b bg-card">
        <div className="container mx-auto px-3 pt-4 pb-2">
          <Link to="/bazaar" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Recycle className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight">Trendra Bazaar</span>
              <span className="block text-xs text-muted-foreground">Purana saaman becho, sasta kharido</span>
            </span>
          </Link>
          <nav className="mt-3 flex gap-1 overflow-x-auto no-scrollbar" aria-label="Bazaar">
            {tabs.map((t) => (
              <Link
                key={t.href}
                to={t.href}
                className={cn(
                  'relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active(t.href) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.href === '/bazaar/chats' && unread > 0 && (
                  <span className="ml-0.5 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </Layout>
  );
};
