import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, ChevronRight, Truck, CheckCircle, XCircle, 
  RotateCcw, Clock, MapPin, CreditCard, ArrowLeft, ShoppingBag
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  payment_method: string;
  notes: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: ShoppingBag, description: 'Your order has been placed successfully' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Seller has confirmed your order' },
  { key: 'shipped', label: 'Shipped', icon: Truck, description: 'Your order is on the way' },
  { key: 'delivered', label: 'Delivered', icon: Package, description: 'Order delivered successfully' },
];

const terminalStatuses: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-destructive', description: 'This order has been cancelled' },
  returned: { label: 'Returned', icon: RotateCcw, color: 'text-muted-foreground', description: 'This order has been returned' },
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/orders');
      return;
    }
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const [orderRes, itemsRes] = await Promise.all([
          supabase.from('orders').select('*').eq('id', id).eq('user_id', user.id).single(),
          supabase.from('order_items').select('*').eq('order_id', id),
        ]);

        if (orderRes.error) throw orderRes.error;
        setOrder(orderRes.data);
        setItems(itemsRes.data || []);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Order not found');
        navigate('/orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();

    // Real-time subscription
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder(prev => prev ? { ...prev, ...payload.new } as Order : null);
          toast.success('Order status updated!', {
            description: `Status changed to ${(payload.new as any).status}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, id, navigate]);

  if (!user) return null;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-48" />
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-40 bg-muted rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  const isTerminal = order.status === 'cancelled' || order.status === 'returned';
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const estimatedDelivery = addDays(new Date(order.created_at), 7);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/orders" className="hover:text-primary">Orders</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">#{order.order_number}</span>
        </div>

        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/orders')} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Button>

        {/* Order Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-sm border p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold">Order #{order.order_number}</h1>
            <span className="text-lg font-bold text-primary">₹{order.total_amount.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
          </p>
          {!isTerminal && currentStepIndex < 3 && (
            <p className="text-sm text-primary mt-1 font-medium">
              Estimated delivery by {format(estimatedDelivery, 'dd MMM yyyy')}
            </p>
          )}
        </motion.div>

        {/* Status Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl shadow-sm border p-5 mb-4"
        >
          <h2 className="font-semibold mb-5 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Order Tracking
          </h2>

          {isTerminal ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10">
              {(() => {
                const ts = terminalStatuses[order.status];
                const Icon = ts.icon;
                return (
                  <>
                    <Icon className={`h-8 w-8 ${ts.color}`} />
                    <div>
                      <p className={`font-semibold ${ts.color}`}>{ts.label}</p>
                      <p className="text-sm text-muted-foreground">{ts.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(order.updated_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="relative pl-8">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pb-8 last:pb-0"
                  >
                    {/* Connector line */}
                    {index < statusSteps.length - 1 && (
                      <div className={`absolute left-[-20px] top-8 w-0.5 h-full ${
                        index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}

                    {/* Status dot */}
                    <div className={`absolute left-[-28px] top-0.5 w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center ${
                      isCompleted
                        ? 'bg-primary border-primary'
                        : 'bg-background border-muted-foreground/30'
                    }`}>
                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-primary-foreground rounded-full"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`${isCurrent ? '' : 'opacity-60'}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`font-medium text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                              Current
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      {isCompleted && isCurrent && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(new Date(order.updated_at), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      )}
                      {isCompleted && !isCurrent && index === 0 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Order Items */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl shadow-sm border p-5 mb-4"
        >
          <h2 className="font-semibold mb-4">Items ({items.length})</h2>
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex gap-3">
                <img
                  src={item.product_image || '/placeholder.svg'}
                  alt={item.product_name}
                  className="w-16 h-16 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-2">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qty: {item.quantity}
                    {item.size && ` • Size: ${item.size}`}
                    {item.color && ` • ${item.color}`}
                  </p>
                  <p className="text-sm font-semibold mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Shipping & Payment */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl shadow-sm border p-5 mb-6"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" /> Shipping Address
              </h3>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address}<br />
                {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}<br />
                Phone: {order.shipping_phone}
              </p>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" /> Payment
              </h3>
              <p className="text-sm text-muted-foreground">
                {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Help */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">Need help with this order?</p>
          <Button variant="link" size="sm" onClick={() => navigate('/help')} className="text-primary">
            Contact Support
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetail;
