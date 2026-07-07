import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreditCard, Banknote, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  amount: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export const BuyNowDialog = ({ open, onOpenChange, productId, productName, amount, quantity, size, color }: BuyNowDialogProps) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document.getElementById('razorpay-checkout-js')) return;
    const s = document.createElement('script');
    s.id = 'razorpay-checkout-js';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const buildCodUrl = () => {
    const params = new URLSearchParams({
      product: productName,
      amount: String(amount),
      productId,
      quantity: String(quantity),
    });
    if (size) params.set('size', size);
    if (color) params.set('color', color);
    return `/cod-checkout?${params.toString()}`;
  };

  const handleCOD = () => {
    onOpenChange(false);
    navigate(buildCodUrl());
  };

  const handleRazorpay = async () => {
    if (!user) {
      toast.error('Please log in to continue');
      onOpenChange(false);
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Fetch product for seller + image
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('id, name, price, images, seller_id')
        .eq('id', productId)
        .single();
      if (prodErr) throw prodErr;

      const totalAmount = amount;
      const shippingAddress = profile?.address || 'To be collected';
      const shippingCity = profile?.city || 'N/A';
      const shippingState = profile?.state || 'N/A';
      const shippingPincode = profile?.pincode || '000000';
      const shippingPhone = profile?.phone || '';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD${Date.now()}`,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_state: shippingState,
          shipping_pincode: shippingPincode,
          shipping_phone: shippingPhone,
          payment_method: 'razorpay',
          notes: `Buy Now: ${productName}`,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: productId,
        seller_id: product?.seller_id || null,
        product_name: product?.name || productName,
        product_image: product?.images?.[0] || null,
        quantity,
        price: quantity > 0 ? totalAmount / quantity : totalAmount,
        size: size || null,
        color: color || null,
      });
      if (itemError) throw itemError;

      const { data: rzp, error: rzpErr } = await supabase.functions.invoke('create-razorpay-order', {
        body: { orderId: order.id, amount: totalAmount },
      });
      if (rzpErr || !rzp?.order_id) throw new Error(rzpErr?.message || 'Payment init failed');

      const RZP = (window as any).Razorpay;
      if (!RZP) {
        toast.error('Payment SDK not loaded. Please refresh and try again.');
        setLoading(false);
        return;
      }

      onOpenChange(false);

      const rz = new RZP({
        key: rzp.key_id,
        order_id: rzp.order_id,
        amount: rzp.amount,
        currency: rzp.currency || 'INR',
        name: 'Trendra',
        description: `Order ${order.order_number}`,
        prefill: {
          name: profile?.full_name || '',
          contact: shippingPhone,
          email: user.email || '',
        },
        theme: { color: '#2874f0' },
        handler: async (resp: any) => {
          try {
            await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                orderId: order.id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
              },
            });
            toast.success('Payment successful!');
            navigate(`/order-success?order=${order.order_number}`);
          } catch (e) {
            console.error('Verify error:', e);
            toast.error('Payment received — verification pending.');
            navigate('/orders');
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled. Order saved as pending.');
            navigate('/orders');
          },
        },
      });
      rz.open();
    } catch (err: any) {
      console.error('Buy Now error:', err);
      toast.error(err?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            {productName} — <span className="font-semibold text-primary">₹{amount.toLocaleString('en-IN')}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleRazorpay}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {loading ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <CreditCard className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Pay Online</div>
              <div className="text-xs text-muted-foreground">Cards, UPI, Netbanking, Wallets</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={handleCOD}
            disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Banknote className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">Cash on Delivery</div>
              <div className="text-xs text-muted-foreground">Pay when your order arrives</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
