import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Package, ChevronRight, ShoppingBag, Truck, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_city: string;
  shipping_state: string;
  payment_method: string;
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Order Placed', color: 'bg-yellow-500', icon: Package },
  confirmed: { label: 'Confirmed', color: 'bg-blue-500', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive', icon: XCircle },
  returned: { label: 'Returned', color: 'bg-muted-foreground', icon: RotateCcw },
};

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);

        // Fetch order items for each order
        if (ordersData && ordersData.length > 0) {
          const orderIds = ordersData.map(o => o.id);
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', orderIds);

          if (itemsError) throw itemsError;

          // Group items by order_id
          const itemsByOrder: Record<string, OrderItem[]> = {};
          itemsData?.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
              itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
          });
          setOrderItems(itemsByOrder);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  if (!user) return null;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (orders.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-2xl font-bold mb-2">No Orders Yet</h1>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders. Start shopping to see your orders here!
            </p>
            <Button onClick={() => navigate('/products')} className="btn-primary-gradient">
              Start Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">My Orders</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        <div className="space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const items = orderItems[order.id] || [];
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="bg-card rounded-lg shadow-sm overflow-hidden">
                {/* Order Header */}
                <div className="bg-muted/50 p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order #{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${status.color} text-white`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    <span className="font-bold">₹{order.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {items.slice(0, 2).map(item => (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.product_image || '/placeholder.svg'}
                          alt={item.product_name}
                          className="w-16 h-16 rounded object-cover bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-1">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity}
                            {item.size && ` • Size: ${item.size}`}
                            {item.color && ` • Color: ${item.color}`}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {items.length > 2 && (
                      <p className="text-sm text-muted-foreground">
                        +{items.length - 2} more item(s)
                      </p>
                    )}
                  </div>

                  {/* Shipping Info & Track */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        📍 {order.shipping_city}, {order.shipping_state}
                      </span>
                      <span className="flex items-center gap-1 mt-1">
                        💵 {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <Truck className="h-3.5 w-3.5 mr-1" />
                      Track Order
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default OrdersPage;
