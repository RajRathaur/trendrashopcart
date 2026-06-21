import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Truck, Shield, CreditCard, Tag, X, ShoppingBag, Package, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const CheckoutPage = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    max_discount_amount: number | null;
  } | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    pincode: profile?.pincode || '',
    notes: '',
  });

  const deliveryFee = totalAmount >= 499 ? 0 : 40;
  
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      couponDiscount = (totalAmount * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_amount) {
        couponDiscount = Math.min(couponDiscount, appliedCoupon.max_discount_amount);
      }
    } else {
      couponDiscount = appliedCoupon.discount_value;
    }
    couponDiscount = Math.min(couponDiscount, totalAmount);
  }
  
  const finalAmount = totalAmount - couponDiscount + deliveryFee;

  if (!user) {
    navigate('/login?redirect=/checkout');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Invalid coupon code');
        setCouponLoading(false);
        return;
      }

      const coupon = data as any;
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error('This coupon has expired');
        setCouponLoading(false);
        return;
      }
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast.error('This coupon has reached its usage limit');
        setCouponLoading(false);
        return;
      }
      if (coupon.min_order_amount && totalAmount < coupon.min_order_amount) {
        toast.error(`Minimum order amount is ₹${coupon.min_order_amount}`);
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
      });
      toast.success(`Coupon "${coupon.code}" applied!`);
    } catch (err) {
      toast.error('Failed to apply coupon');
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.fullName || !formData.phone || !formData.address || 
          !formData.city || !formData.state || !formData.pincode) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD${Date.now()}`,
          total_amount: finalAmount,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_pincode: formData.pincode,
          shipping_phone: formData.phone,
          payment_method: paymentMethod,
          notes: formData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        seller_id: item.product?.seller_id,
        product_name: item.product?.name || 'Unknown Product',
        product_image: item.product?.images?.[0],
        quantity: item.quantity,
        price: item.product?.price || 0,
        size: item.size,
        color: item.color,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      try {
        const itemNames = items.map(i => `${i.product?.name} (x${i.quantity})`).join(', ');
        await supabase.functions.invoke('notify-admin-payment', {
          body: {
            customerName: formData.fullName,
            phoneNumber: formData.phone,
            deliveryAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
            productName: itemNames,
            paymentAmount: finalAmount,
            paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
          },
        });
      } catch (emailErr) {
        console.warn('Admin notification failed:', emailErr);
      }

      await clearCart();

      if (paymentMethod === 'online') {
        navigate(`/confirm-payment?order=${order.order_number}&amount=${finalAmount}&orderId=${order.id}`);
      } else {
        toast.success('Order placed successfully!');
        navigate(`/order-success?order=${order.order_number}`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-4 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/cart" className="hover:text-primary transition-colors">Cart</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Checkout</span>
        </nav>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8 max-w-md mx-auto">
          {[
            { label: 'Cart', icon: ShoppingBag, active: false, done: true },
            { label: 'Checkout', icon: CreditCard, active: true, done: false },
            { label: 'Confirmation', icon: Package, active: false, done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step.active 
                    ? 'bg-primary text-primary-foreground' 
                    : step.done 
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-xs ${step.active ? 'text-primary font-medium' : step.done ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-16 h-0.5 mx-2 mt-[-16px] ${
                  step.done ? 'bg-green-500' : step.active ? 'bg-primary/30' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Shipping Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border/50 p-5"
              >
                <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  Shipping Details
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-sm">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="address" className="text-sm">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="House no., Street, Landmark"
                      required
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-sm">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-sm">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pincode" className="text-sm">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="6-digit pincode"
                      required
                      maxLength={6}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm">Order Notes <span className="text-muted-foreground">(Optional)</span></Label>
                    <Input
                      id="notes"
                      placeholder="Any special instructions"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Payment Method */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border border-border/50 p-5"
              >
                <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  Payment Method
                </h2>
                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground'}`}>
                        {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-sm">Cash on Delivery (COD)</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Pay when you receive your order</p>
                      </div>
                      <span className="text-2xl">💵</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('online')}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-muted-foreground/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'online' ? 'border-primary' : 'border-muted-foreground'}`}>
                        {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-sm">Online Payment (UPI)</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Pay via UPI screenshot verification</p>
                      </div>
                      <span className="text-2xl">📱</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border/50 p-5"
              >
                <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  Order Items ({items.length})
                </h2>
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <img
                        src={item.product?.images?.[0] || '/placeholder.svg'}
                        alt={item.product?.name || 'Product image'}
                        className="w-14 h-14 rounded-lg object-cover border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.size && <span className="text-xs text-muted-foreground">Size: {item.size}</span>}
                          {item.color && <span className="text-xs text-muted-foreground">Color: {item.color}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-sm whitespace-nowrap">
                        ₹{((item.product?.price ?? 0) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border/50 p-5 sticky top-24 space-y-4">
                <h2 className="font-bold text-lg">Order Summary</h2>

                {/* Coupon Code */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                      </div>
                      <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                        maxLength={20}
                      />
                      <Button variant="outline" onClick={applyCoupon} disabled={couponLoading} size="sm" className="shrink-0">
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coupon Discount</span>
                      <span className="text-green-600 font-semibold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : 'font-medium'}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span>₹{finalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {couponDiscount > 0 && (
                    <p className="text-xs text-green-600 font-medium">You save ₹{couponDiscount.toLocaleString('en-IN')} with this coupon!</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...</>
                  ) : paymentMethod === 'cod' ? (
                    'Place Order (COD)'
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Your order is 100% secure</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
