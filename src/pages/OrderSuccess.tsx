import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, Truck, Clock, CreditCard, Banknote, CalendarDays, Loader2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { getWhatsAppLink, openWhatsApp } from '@/config/admin';

interface OrderInfo {
  id: string;
  order_number: string;
  total_amount: number;
  status: string | null;
  payment_method: string | null;
  cod_confirmed: boolean | null;
  created_at: string;
  shipping_city: string;
  shipping_state: string;
  shipping_address?: string | null;
  shipping_phone?: string | null;
  user_id?: string | null;
}

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order') || '';
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!orderNumber) { setLoading(false); return; }
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, payment_method, cod_confirmed, created_at, shipping_city, shipping_state, shipping_address, shipping_phone, user_id')
        .eq('order_number', orderNumber)
        .maybeSingle();
      if (cancelled) return;
      setOrder(data as OrderInfo | null);
      setLoading(false);

      // Auto-send confirmation email once per order (per browser)
      if (data) {
        const notifyKey = `order-notified-${data.order_number}`;
        if (!sessionStorage.getItem(notifyKey)) {
          sessionStorage.setItem(notifyKey, '1');
          const emailStatus = (data.status && data.status !== 'pending') ? data.status : 'pending';
          supabase.functions.invoke('send-order-email', {
            body: {
              orderNumber: data.order_number,
              status: emailStatus,
              totalAmount: data.total_amount,
              shippingCity: data.shipping_city,
              shippingState: data.shipping_state,
              customerUserId: data.user_id,
            },
          }).catch((e) => console.warn('confirmation email failed:', e));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [orderNumber]);

  const isCod = (order?.payment_method || '').toLowerCase() === 'cod';
  const isRazorpay = (order?.payment_method || '').toLowerCase() === 'razorpay';
  const paymentLabel = isCod ? 'Cash on Delivery' : isRazorpay ? 'Razorpay (Online)' : (order?.payment_method || 'Online');
  // For online payments treat any non-pending status as Paid/Confirmed.
  const paid = !isCod && !!order?.status && order.status !== 'pending';
  const paymentStatusLabel = isCod
    ? (order?.cod_confirmed ? 'COD Confirmed' : 'Pay on Delivery')
    : paid ? 'Paid • Confirmed' : 'Confirming…';
  const paymentStatusClass = isCod
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    : paid
      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300';

  const createdAt = order?.created_at ? new Date(order.created_at) : new Date();
  const etaFrom = addDays(createdAt, 3);
  const etaTo = addDays(createdAt, 7);

  const currentStep = (() => {
    const s = order?.status || 'pending';
    if (s === 'delivered') return 3;
    if (s === 'shipped') return 2;
    if (s === 'confirmed' || (!isCod && paid)) return 1;
    return 0;
  })();

  const timeline = [
    { icon: CheckCircle, label: 'Placed' },
    { icon: Clock, label: 'Processing' },
    { icon: Truck, label: 'Shipped' },
    { icon: Package, label: 'Delivered' },
  ];

  const handleWhatsAppConfirm = () => {
    if (!order) return;
    const msg = `Hi Trendra! Please confirm my order.\n\nOrder ID: ${order.order_number}\nAmount: ₹${Number(order.total_amount).toLocaleString('en-IN')}\nPayment: ${paymentLabel}\nShipping: ${order.shipping_city}, ${order.shipping_state}${order.shipping_phone ? `\nMobile: ${order.shipping_phone}` : ''}`;
    openWhatsApp(getWhatsAppLink(msg));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isCod ? 'Order Placed — Please Confirm!' : 'Order Confirmed!'}
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            {isCod
              ? 'Ek confirmation email bhej diya hai. Kripya WhatsApp par bhi confirm karein taki hum jaldi dispatch kar sakein.'
              : 'Payment received. Confirmation email aapke inbox mein bhej diya hai.'}
          </p>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="bg-card rounded-xl border border-border/50 p-5 mb-4 text-left">
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-border/50">
                  <div>
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Order ID</span>
                    </div>
                    <p className="text-lg font-bold text-foreground font-mono">{order?.order_number || orderNumber}</p>
                  </div>
                  {order && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-lg font-bold text-foreground">₹{Number(order.total_amount).toLocaleString('en-IN')}</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      {isCod ? <Banknote className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                      <span className="text-xs font-semibold uppercase tracking-wide">Payment</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{paymentLabel}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${paymentStatusClass}`}>
                      {paymentStatusLabel}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Est. Delivery</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {format(etaFrom, 'dd MMM')} – {format(etaTo, 'dd MMM yyyy')}
                    </p>
                    {order && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">to {order.shipping_city}, {order.shipping_state}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border/50 p-5 mb-4">
                <div className="flex items-center justify-between">
                  {timeline.map((step, i) => {
                    const active = i <= currentStep;
                    const color = active
                      ? 'text-green-600 bg-green-100 dark:bg-green-950/30'
                      : 'text-muted-foreground bg-muted';
                    return (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                          <step.icon className="h-4 w-4" />
                        </div>
                        <span className={`text-[10px] font-medium ${active ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {order && (
                <Button
                  onClick={handleWhatsAppConfirm}
                  className="w-full mb-3 bg-[#25D366] hover:bg-[#128C7E] text-white"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {isCod ? 'Confirm Order on WhatsApp' : 'Get Update on WhatsApp'}
                </Button>
              )}
            </>
          )}

          <div className="space-y-3">
            <Link to="/orders">
              <Button className="w-full" size="lg" variant="outline">
                Track Your Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" className="w-full" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderSuccessPage;
