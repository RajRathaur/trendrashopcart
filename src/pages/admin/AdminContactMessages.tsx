import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Search, Check, Reply } from 'lucide-react';

interface Msg {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const AdminContactMessages = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'read'>('all');

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Failed to load', description: error.message, variant: 'destructive' });
    if (data) setMessages(data as Msg[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleRead = async (m: Msg, next: boolean) => {
    const { error } = await (supabase as any)
      .from('contact_messages')
      .update({ is_read: next })
      .eq('id', m.id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); return; }
    setMessages(prev => prev.map(x => x.id === m.id ? { ...x, is_read: next } : x));
  };

  const reply = (m: Msg) => {
    const subject = encodeURIComponent(`Re: ${m.subject || 'Your message to Trendra'}`);
    const body = encodeURIComponent(`Hi ${m.name},\n\nThanks for reaching out to Trendra.\n\n---\n> ${m.message.replace(/\n/g, '\n> ')}\n`);
    window.location.href = `mailto:${m.email}?subject=${subject}&body=${body}`;
    if (!m.is_read) toggleRead(m, true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter(m => {
      if (filter === 'new' && m.is_read) return false;
      if (filter === 'read' && !m.is_read) return false;
      if (!q) return true;
      return [m.name, m.email, m.phone, m.subject, m.message]
        .filter(Boolean).some(v => (v as string).toLowerCase().includes(q));
    });
  }, [messages, query, filter]);

  const newCount = messages.filter(m => !m.is_read).length;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Contact Messages</h1>
            {newCount > 0 && <Badge>{newCount} new</Badge>}
          </div>
          <div className="flex gap-2">
            {(['all', 'new', 'read'] as const).map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, subject, or message..."
            className="pl-9"
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No messages found.</Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <Card key={m.id} className={`p-4 ${!m.is_read ? 'border-primary/50' : ''}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{m.name}</span>
                      {m.is_read
                        ? <Badge variant="secondary">Read</Badge>
                        : <Badge>New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground break-all">
                      {m.email}{m.phone ? ` • ${m.phone}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleRead(m, !m.is_read)}>
                      <Check className="w-4 h-4 mr-1" />
                      {m.is_read ? 'Mark unread' : 'Mark read'}
                    </Button>
                    <Button size="sm" onClick={() => reply(m)}>
                      <Reply className="w-4 h-4 mr-1" /> Reply
                    </Button>
                  </div>
                </div>
                {m.subject && <p className="text-sm font-medium mt-2">{m.subject}</p>}
                <p className="text-sm whitespace-pre-wrap mt-1">{m.message}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContactMessages;
