import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, ChevronRight, Loader2, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BuyNowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  /** Subtotal (price × quantity), before delivery or coupon */
  amount: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  freeDelivery?: boolean;
  deliveryCharge?: number | null;
}

const DEFAULT_DELIVERY = 40;

export const BuyNowDialog = ({
  open, onOpenChange, productId, productName, amount, quantity, size, color,
  freeDelivery = false, deliveryCharge = null,
}: BuyNowDialogProps) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string; discount_type: string; discount_value: number; max_discount_amount: number | null;
  } | null>(null);

  useEffect(() => {
    if (document.getElementById('razorpay-checkout-js')) return;
    const s = document.createElement('script');
    s.id = 'razorpay-checkout-js';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!open) { setCouponCode(''); setAppliedCoupon(null); }
  }, [open]);

  const subtotal = amount;
  const delivery = freeDelivery ? 0 : (deliveryCharge != null ? Number(deliveryCharge) : DEFAULT_DELIVERY);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    let d = appliedCoupon.discount_type === 'percentage'
      ? (subtotal * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value;
    if (appliedCoupon.max_discount_amount) d = Math.min(d, appliedCoupon.max_discount_amount);
    return Math.min(d, subtotal);
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal - couponDiscount + delivery);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return toast.error('Enter a coupon code');
    setCouponLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc('validate_coupon', {
        _code: couponCode.trim().toUpperCase(),
        _order_amount: subtotal,
      });
      if (error) { toast.error(error.message || 'Invalid coupon'); return; }
      const c = Array.isArray(data) ? data[0] : data;
      if (!c) { toast.error('Invalid coupon'); return; }
      setAppliedCoupon({
        code: c.code, discount_type: c.discount_type,
        discount_value: Number(c.discount_value),
        max_discount_amount: c.max_discount_amount != null ? Number(c.max_discount_amount) : null,
      });
      toast.success(`Coupon "${c.code}" applied!`);
    } finally { setCouponLoading(false); }
  };

  const buildCodUrl = () => {
    const params = new URLSearchParams({
      product: productName,
      amount: String(subtotal),
      delivery: String(delivery),
      productId,
      quantity: String(quantity),
    });
    if (couponDiscount > 0 && appliedCoupon) {
      params.set('coupon', appliedCoupon.code);
      params.set('couponDiscount', String(couponDiscount));
    }
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
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('id, name, price, images, seller_id')
        .eq('id', productId).single();
      if (prodErr) throw prodErr;

      const shippingAddress = profile?.address || 'To be collected';
      const shippingCity = profile?.city || 'N/A';
      const shippingState = profile?.state || 'N/A';
      const shippingPincode = profile?.pincode || '000000';
      const shippingPhone = (profile?.phone || '').trim();

      if (!/^[+0-9 ().\-]{7,20}$/.test(shippingPhone)) {
        toast.error('Please add a valid phone number in your profile before paying online.');
        onOpenChange(false);
        navigate('/profile');
        return;
      }

      const noteParts = [`Buy Now: ${productName}`, `Delivery: ₹${delivery}`];
      if (appliedCoupon) noteParts.push(`Coupon: ${appliedCoupon.code} (-₹${couponDiscount.toFixed(2)})`);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD${Date.now()}`,
          total_amount: total,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_state: shippingState,
          shipping_pincode: shippingPincode,
          shipping_phone: shippingPhone,
          payment_method: 'razorpay',
          notes: noteParts.join(' | '),
        })
        .select().single();
      if (orderError) throw orderError;

      const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: productId,
        seller_id: product?.seller_id || null,
        product_name: product?.name || productName,
        product_image: product?.images?.[0] || null,
        quantity,
        price: quantity > 0 ? subtotal / quantity : subtotal,
        size: size || null,
        color: color || null,
      });
      if (itemError) throw itemError;

      const { data: rzp, error: rzpErr } = await supabase.functions.invoke('create-razorpay-order', {
        body: { orderId: order.id, amount: total },
      });
      if (rzpErr || !rzp?.order_id) throw new Error(rzpErr?.message || 'Payment init failed');

      const RZP = (window as any).Razorpay;
      if (!RZP) { toast.error('Payment SDK not loaded. Refresh and try again.'); return; }

      onOpenChange(false);

      const rz = new RZP({
        key: rzp.key_id,
        order_id: rzp.order_id,
        amount: rzp.amount,
        currency: rzp.currency || 'INR',
        name: 'Trendra',
        description: `Order ${order.order_number}`,
        prefill: { name: profile?.full_name || '', contact: shippingPhone, email: user.email || '' },
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
          <DialogTitle>Order Summary</DialogTitle>
          <DialogDescription className="line-clamp-2">{productName}</DialogDescription>
        </DialogHeader>

        {/* Coupon */}
        <div className="pt-1">
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                <Tag className="h-4 w-4" /> {appliedCoupon.code} applied
              </span>
              <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="h-9 text-sm"
              />
              <Button size="sm" variant="outline" onClick={applyCoupon} disabled={couponLoading}>
                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon discount</span>
              <span>−₹{couponDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className={delivery === 0 ? 'text-green-600 font-semibold' : ''}>
              {delivery === 0 ? 'FREE' : `₹${delivery}`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1.5 border-t">
            <span>Total</span>
            <span className="text-primary">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="space-y-3">
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
              <div className="text-xs text-muted-foreground">Pay ₹{total.toLocaleString('en-IN')} when your order arrives</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
