import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Eye, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import { getWhatsAppLink, openWhatsApp } from '@/config/admin';
import { logAdminAction, maskPhone, addressSnippet } from '@/lib/auditLog';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  payment_method: string | null;
  created_at: string;
  user_id: string;
}

const statusOptions: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
];

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
};

const AdminOrders = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login?redirect=/admin/orders', { replace: true });
      } else if (!isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
    }
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      if (error) throw error;
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Find the order to get user_id and order_number
      const order = orders.find(o => o.id === orderId);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await logAdminAction('order_status_change', 'order', orderId, {
        order_number: order?.order_number,
        from: order?.status,
        to: newStatus,
        total_amount: order?.total_amount,
        shipping_pincode: order?.shipping_pincode ?? null,
        shipping_city: order?.shipping_city ?? null,
        shipping_state: order?.shipping_state ?? null,
        address_snippet: addressSnippet(order?.shipping_address),
        phone_masked: maskPhone(order?.shipping_phone),
      });

      // Create in-app notification for the customer
      if (order?.user_id) {
        const statusMessages: Record<OrderStatus, string> = {
          pending: 'Your order is pending confirmation.',
          confirmed: 'Your order has been confirmed!',
          shipped: 'Your order has been shipped and is on its way!',
          delivered: 'Your order has been delivered. Enjoy!',
          cancelled: 'Your order has been cancelled.',
          returned: 'Your order return has been processed.',
        };

        await supabase.from('notifications').insert({
          user_id: order.user_id,
          title: `Order #${order.order_number} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          message: statusMessages[newStatus],
          type: 'order_update',
          order_id: orderId,
        });

        // Send email notification via Resend
        try {
          const { error: emailError } = await supabase.functions.invoke('send-order-email', {
            body: {
              orderNumber: order.order_number,
              status: newStatus,
              totalAmount: order.total_amount,
              shippingCity: order.shipping_city,
              shippingState: order.shipping_state,
              customerUserId: order.user_id,
            },
          });

          if (emailError) {
            console.warn('Email notification failed:', emailError);
          }
        } catch (emailErr) {
          console.warn('Email notification error:', emailErr);
          // Don't block the status update if email fails
        }
      }

      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleWhatsAppNotify = (order: Order) => {
    const message = `Hi! Your Trendra order #${order.order_number} status has been updated to: *${order.status.toUpperCase()}*.\n\nTotal: ₹${order.total_amount.toLocaleString()}\nShipping to: ${order.shipping_city}, ${order.shipping_state}\n\nThank you for shopping with Trendra!`;
    const url = getWhatsAppLink(message);
    openWhatsApp(url);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const orderSnapshot = orders.find(o => o.id === orderId);

      // Delete order items first
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);
      if (itemsError) throw itemsError;

      // Delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      if (error) throw error;

      await logAdminAction('order_delete', 'order', orderId, {
        order_number: orderSnapshot?.order_number,
        total_amount: orderSnapshot?.total_amount,
        status: orderSnapshot?.status,
        shipping_pincode: orderSnapshot?.shipping_pincode ?? null,
        shipping_city: orderSnapshot?.shipping_city ?? null,
        address_snippet: addressSnippet(orderSnapshot?.shipping_address),
        phone_masked: maskPhone(orderSnapshot?.shipping_phone),
      });

      toast.success('Order deleted successfully');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Orders ({orders.length})</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <>
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          {format(new Date(order.created_at), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell>₹{order.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {order.shipping_city}, {order.shipping_state}
                        </TableCell>
                        <TableCell>{order.shipping_phone}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleExpand(order.id)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleWhatsAppNotify(order)}
                              title="Notify via WhatsApp"
                              className="text-green-600 hover:text-green-700"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Select
                              value={order.status}
                              onValueChange={(value: OrderStatus) => handleStatusChange(order.id, value)}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((status) => (
                                  <SelectItem key={status} value={status} className="capitalize">
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Order</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete order #{order.order_number}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedOrder === order.id && (
                        <TableRow key={`${order.id}-details`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Shipping Address</h4>
                                <p className="text-sm text-muted-foreground">
                                  {order.shipping_address}<br />
                                  {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}<br />
                                  Phone: {order.shipping_phone}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Order Items</h4>
                                {orderItems[order.id] ? (
                                  <div className="space-y-2">
                                    {orderItems[order.id].map(item => (
                                      <div key={item.id} className="flex gap-2 items-center text-sm">
                                        <img
                                          src={item.product_image || '/placeholder.svg'}
                                          alt=""
                                          className="w-10 h-10 rounded object-cover"
                                        />
                                        <div className="flex-1">
                                          <p className="font-medium line-clamp-1">{item.product_name}</p>
                                          <p className="text-muted-foreground text-xs">
                                            Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                                            {item.size && ` • ${item.size}`}
                                            {item.color && ` • ${item.color}`}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
