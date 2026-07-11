import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Banknote, CheckCircle2, Loader2, ArrowRight, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const CodCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const productName = searchParams.get('product') || '';
  const subtotal = Number(searchParams.get('amount') || '0');
  const delivery = Number(searchParams.get('delivery') || '0');
  const couponCode = searchParams.get('coupon') || '';
  const couponDiscount = Number(searchParams.get('couponDiscount') || '0');
  const totalAmount = Math.max(0, subtotal - couponDiscount + delivery);
  const productId = searchParams.get('productId') || '';
  const quantity = Math.max(1, Number(searchParams.get('quantity')) || 1);
  const selectedSize = searchParams.get('size');
  const selectedColor = searchParams.get('color');

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setSubmitting(true);
    try {
      if (!user) {
        toast.error('Please log in to place order');
        navigate(`/login?redirect=${encodeURIComponent(`/cod-checkout?${searchParams.toString()}`)}`);
        return;
      }

      let product: any = null;
      if (productId) {
        const { data, error: productError } = await supabase
          .from('products')
          .select('id, name, price, images, seller_id')
          .eq('id', productId)
          .single();
        if (productError) throw productError;
        product = data;
      }

      const itemPrice = quantity > 0 ? subtotal / quantity : subtotal;
      const addressParts = address.trim().split(',').map((part) => part.trim()).filter(Boolean);
      const shippingCity = addressParts.length >= 2 ? addressParts[addressParts.length - 1] : 'Not provided';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD${Date.now()}`,
          total_amount: totalAmount,
          shipping_address: address.trim(),
          shipping_city: shippingCity,
          shipping_state: 'Not provided',
          shipping_pincode: pincode,
          shipping_phone: phone.trim(),
          payment_method: 'cod',
          notes: `COD Buy Now customer: ${customerName.trim()} | Delivery: ₹${delivery}${couponCode ? ` | Coupon: ${couponCode} (-₹${couponDiscount})` : ''}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId || null,
          seller_id: product?.seller_id || null,
          product_name: product?.name || productName || 'Unknown Product',
          product_image: product?.images?.[0] || null,
          quantity,
          price: itemPrice,
          size: selectedSize,
          color: selectedColor,
        });

      if (itemError) throw itemError;

      const { error } = await supabase
        .from('payment_confirmations' as any)
        .insert({
          customer_name: customerName.trim(),
          phone_number: phone.trim(),
          delivery_address: `${address.trim()}, PIN: ${pincode}`,
          product_name: `[COD] ${product?.name || productName || 'Unknown Product'}`,
          payment_amount: totalAmount,
          screenshot_url: 'COD',
          status: 'cod_pending',
          admin_notes: `Cash on Delivery order: ${order.order_number}`,
          product_id: productId || null,
          user_id: user.id,
        } as any);

      if (error) throw error;
      if (couponCode) {
        try { await (supabase as any).rpc('increment_coupon_usage', { _code: couponCode }); } catch (e) { console.warn('coupon increment failed', e); }
      }
      toast.success('COD order placed successfully!');
      navigate(`/order-success?order=${order.order_number}`);
    } catch (err: any) {
      console.error('COD submit error:', err);
      toast.error(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              Your Cash on Delivery order has been recorded. Pay ₹{totalAmount.toLocaleString('en-IN')} when your order arrives.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm text-left space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="font-medium">{productName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>Coupon ({couponCode})</span><span>−₹{couponDiscount.toLocaleString('en-IN')}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span></div>
              <div className="flex justify-between pt-2 border-t"><span className="font-semibold">Total (COD)</span><span className="font-bold text-primary">₹{totalAmount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium text-orange-600">Pending / COD</span></div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/orders')} className="flex-1">
                Track Order <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button onClick={() => navigate('/products')} variant="outline" className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden"
        >
          <div className="bg-green-500/5 border-b border-border/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Cash on Delivery</h1>
                <p className="text-muted-foreground text-xs">Pay in cash when your order is delivered</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="bg-muted/50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Order</span>
                <span className="font-medium truncate ml-2">{productName || '—'}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600"><span>Coupon ({couponCode})</span><span>−₹{couponDiscount.toLocaleString('en-IN')}</span></div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={delivery === 0 ? 'text-green-600 font-semibold' : ''}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Amount to Pay</span>
                <span className="font-bold text-lg text-primary">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\- ]/g, '').slice(0, 15))} placeholder="10-digit mobile number" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, street, area, city" required rows={3} maxLength={500} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit pincode" required />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing order...</>) : 'Place COD Order'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CodCheckout;
