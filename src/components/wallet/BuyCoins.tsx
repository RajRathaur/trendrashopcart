import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { loadRazorpay } from '@/lib/razorpay';
import { COINS_PER_RUPEE } from '@/hooks/useCoinWallet';

const PACKS = [
  { rupees: 10, coins: 1000 },
  { rupees: 20, coins: 2000 },
  { rupees: 50, coins: 5000 },
  { rupees: 100, coins: 10000 },
];

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface BuyCoinsProps {
  onCredited?: () => void;
}

export const BuyCoins = ({ onCredited }: BuyCoinsProps) => {
  const { user } = useAuth();
  const [buying, setBuying] = useState<number | null>(null);

  const handleBuy = async (pack: (typeof PACKS)[number]) => {
    if (!user) {
      toast({ title: 'Login zaroori hai', description: 'Coins khareedne ke liye pehle login karein.', variant: 'destructive' });
      return;
    }
    setBuying(pack.rupees);
    try {
      // 1. Create Razorpay order
      const { data: order, error: orderErr } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: pack.rupees },
      });
      if (orderErr || !order?.order_id) {
        throw new Error(order?.error || orderErr?.message || 'Order create nahi hua');
      }

      // 2. Open Razorpay checkout
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Razorpay load nahi hua');

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'Trendra Coins',
          description: `${pack.coins} coins (₹${pack.rupees})`,
          order_id: order.order_id,
          prefill: { email: user.email || '' },
          theme: { color: '#2563eb' },
          modal: { ondismiss: () => reject(new Error('Payment cancel ho gaya')) },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const { data: verify, error: vErr } = await supabase.functions.invoke('verify-coin-purchase', {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });
              if (vErr || !verify?.verified) {
                throw new Error(verify?.error || vErr?.message || 'Verify nahi hua');
              }
              toast({
                title: `🎉 ${verify.coins} coins mil gaye!`,
                description: 'Coins aapke wallet me jud gaye hain.',
              });
              onCredited?.();
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        });
        rzp.open();
      });
    } catch (e) {
      const msg = (e as Error).message || 'Payment fail ho gaya';
      if (!msg.includes('cancel')) {
        toast({ title: 'Payment fail', description: msg, variant: 'destructive' });
      }
    } finally {
      setBuying(null);
    }
  };

  return (
    <Card className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <IndianRupee className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Coins Khareedo</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {COINS_PER_RUPEE} coins = ₹1 • Minimum ₹10 • Razorpay se surakshit payment
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PACKS.map((pack) => (
          <Button
            key={pack.rupees}
            variant="outline"
            className="h-auto py-3 flex-col gap-1"
            disabled={buying !== null}
            onClick={() => handleBuy(pack)}
          >
            {buying === pack.rupees ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Coins className="w-5 h-5 text-yellow-500" />
            )}
            <span className="font-bold">{pack.coins.toLocaleString('en-IN')} coins</span>
            <span className="text-xs text-muted-foreground">₹{pack.rupees}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
