import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Send } from 'lucide-react';

const PRESETS: Record<string, { title: string; message: string }> = {
  site_live: {
    title: '🎉 Trendra is Live!',
    message: 'Great news! Trendra is now live and ready for you. Explore trending products, exclusive deals and fast delivery. Shop now and enjoy special launch offers!',
  },
  new_product: {
    title: '🆕 New Product Just Landed!',
    message: 'Fresh arrivals are here on Trendra. Check out our latest product added today — limited stock available. Grab yours before it sells out!',
  },
  flash_sale: {
    title: '⚡ Flash Sale — Up to 70% OFF',
    message: 'Hurry! A massive flash sale is now live on Trendra. Discounts up to 70% on top categories. Sale ends soon — shop now!',
  },
  restock: {
    title: '🔁 Back in Stock',
    message: 'Your favourite items are back in stock on Trendra. Order now before they run out again!',
  },
  order_update: {
    title: '📦 Delivery Update',
    message: 'We have improved our delivery experience on Trendra. Faster shipping, better tracking, and reliable support — every order, every time.',
  },
  festival: {
    title: '🪔 Festive Offers on Trendra',
    message: 'Celebrate the season with amazing festive offers on Trendra. Extra discounts, free shipping and gift coupons — only for a limited time!',
  },
  custom: { title: '', message: '' },
};


const AdminBroadcast = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Title and message are required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // 1. In-app notifications to all users
      const { data: count, error: notifErr } = await supabase.rpc('broadcast_notification', {
        _title: title,
        _message: message,
        _type: 'announcement',
      });
      if (notifErr) throw notifErr;

      let emailCount = 0;
      if (sendEmail) {
        const { data, error: emailErr } = await supabase.functions.invoke('broadcast-email', {
          body: { title, message },
        });
        if (emailErr) throw emailErr;
        emailCount = data?.sent ?? 0;
      }

      setLastResult(`Sent in-app notification to ${count} users${sendEmail ? `, email queued for ${emailCount} recipients` : ''}.`);
      toast({ title: 'Broadcast sent', description: `${count} users notified.` });
      setTitle('');
      setMessage('');
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Broadcast failed', description: e?.message ?? 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone className="h-7 w-7" />
          <h1 className="text-2xl font-bold">Broadcast to All Users</h1>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Big sale tomorrow!" maxLength={120} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Tell users what's happening…" maxLength={2000} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            Also send email to all users
          </label>
          <Button onClick={handleSend} disabled={loading} className="gap-2">
            <Send className="h-4 w-4" />
            {loading ? 'Sending…' : 'Send Broadcast'}
          </Button>
          {lastResult && <p className="text-sm text-muted-foreground">{lastResult}</p>}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBroadcast;
