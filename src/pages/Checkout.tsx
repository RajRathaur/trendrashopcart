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
import { ChevronRight, Truck, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

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
  
  // Calculate coupon discount
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
      // Validate
      if (!formData.fullName || !formData.phone || !formData.address || 
          !formData.city || !formData.state || !formData.pincode) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: `ORD${Date.now()}`, // Will be replaced by trigger
          total_amount: finalAmount,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_pincode: formData.pincode,
          shipping_phone: formData.phone,
          payment_method: 'cod',
          notes: formData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
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

      // Clear cart
      await clearCart();

      toast.success('Order placed successfully!');
      navigate(`/order-success?order=${order.order_number}`);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/cart" className="hover:text-primary">Cart</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Checkout</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Shipping Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Details
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      required
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Any special instructions"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </h2>

                <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Cash on Delivery (COD)</span>
                      <p className="text-sm text-muted-foreground">
                        Pay when you receive your order
                      </p>
                    </div>
                    <span className="ml-auto text-2xl">💵</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-card rounded-lg p-6 shadow-sm">
                <h2 className="font-bold text-lg mb-4">Order Items ({items.length})</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 py-2 border-b last:border-0">
                      <img
                        src={item.product?.images?.[0] || '/placeholder.svg'}
                        alt=""
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.size && `Size: ${item.size}`} {item.color && `Color: ${item.color}`}
                        </p>
                        <p className="text-sm">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-medium">
                        ₹{((item.product?.price ?? 0) * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg p-4 shadow-sm sticky top-24">
                <h2 className="font-bold text-lg mb-4">Order Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className={deliveryFee === 0 ? 'discount-text' : 'font-medium'}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>

                  <hr />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-4 btn-deal"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order (COD)'}
                </Button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Your order is secure
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
