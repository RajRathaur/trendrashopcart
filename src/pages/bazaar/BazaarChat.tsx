import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BazaarShell } from '@/components/bazaar/BazaarShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BAZAAR_SAFETY_TIPS, BazaarConversation, BazaarMessage, MAX_BAZAAR_MESSAGE, cleanBazaarMessage } from '@/lib/bazaar';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, SendHorizonal, ShieldAlert } from 'lucide-react';

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

const BazaarChat = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [conv, setConv] = useState<BazaarConversation | null>(null);
  const [messages, setMessages] = useState<BazaarMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    (async () => {
      const [{ data: c }, { data: m }] = await Promise.all([
        supabase.from('bazaar_conversations').select('*').eq('id', id).maybeSingle(),
        supabase.from('bazaar_messages').select('*').eq('conversation_id', id).order('created_at').limit(500),
      ]);
      if (cancelled) return;
      setConv(c);
      setMessages(m ?? []);
      setLoading(false);
      if (c) supabase.rpc('mark_bazaar_read', { _conversation_id: id });
    })();

    const ch = supabase
      .channel(`bazaar-chat-${id}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bazaar_messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          const msg = payload.new as BazaarMessage;
          setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
          if (msg.sender_id !== user.id) supabase.rpc('mark_bazaar_read', { _conversation_id: id });
        },
      )
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [id, user]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  useEffect(() => {
    if (conv) document.title = `${conv.listing_title} — Chat | Trendra Bazaar`;
  }, [conv]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    const body = cleanBazaarMessage(text);
    if (!body) return;
    setSending(true);
    const { data, error } = await supabase
      .from('bazaar_messages')
      .insert({ conversation_id: id, sender_id: user.id, body })
      .select('*')
      .single();
    setSending(false);
    if (error || !data) { toast.error('Message nahi gaya, dobara try karein'); return; }
    setText('');
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  };

  if (loading) {
    return <BazaarShell hideFooter><div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></BazaarShell>;
  }

  if (!conv) {
    return (
      <BazaarShell>
        <div className="container mx-auto px-3 py-16 text-center">
          <p className="text-lg font-semibold">Ye chat nahi mili</p>
          <Button asChild variant="outline" className="mt-4"><Link to="/bazaar/chats">Saari chats</Link></Button>
        </div>
      </BazaarShell>
    );
  }

  const iAmBuyer = conv.buyer_id === user?.id;
  const other = iAmBuyer ? conv.seller_name : conv.buyer_name;

  return (
    <BazaarShell hideFooter>
      <div className="container mx-auto flex max-w-3xl flex-col px-0 sm:px-3">
        <div className="flex items-center gap-3 border-b bg-card px-3 py-2.5">
          <Link to="/bazaar/chats" aria-label="Saari chats" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <Link to={`/bazaar/item/${conv.listing_id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
              {conv.listing_image && <img src={conv.listing_image} alt="" className="h-full w-full object-cover" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{other}</span>
              <span className="block truncate text-xs text-muted-foreground">{conv.listing_title}</span>
            </span>
          </Link>
        </div>

        <div className="flex h-[calc(100svh-17rem)] min-h-[320px] flex-col gap-2 overflow-y-auto bg-muted/30 px-3 py-3">
          <div className="mx-auto max-w-sm rounded-lg border border-dashed bg-card p-2.5 text-xs text-muted-foreground">
            <p className="mb-1 flex items-center gap-1 font-semibold text-foreground"><ShieldAlert className="h-3.5 w-3.5 text-primary" />Surakshit rahein</p>
            {BAZAAR_SAFETY_TIPS.join(' ')}
          </div>
          {messages.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {iAmBuyer ? 'Namaste likhkar poochiye ki saaman abhi bhi available hai ya nahi.' : 'Abhi koi message nahi.'}
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
                  mine ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm border bg-card',
                )}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn('mt-0.5 text-right text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{timeOf(m.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="flex gap-2 border-t bg-card p-2.5 pb-20 md:pb-2.5">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_BAZAAR_MESSAGE))}
            placeholder="Message likhein…"
            aria-label="Message"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={sending || !cleanBazaarMessage(text)} aria-label="Bhejein">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </BazaarShell>
  );
};

export default BazaarChat;
