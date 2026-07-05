import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText } from 'lucide-react';
import { generateTaxInvoice } from '@/lib/invoice';
import { toast } from 'sonner';

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  payment_method: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  items: { product_name: string; quantity: number; price: number; size: string | null; color: string | null }[];
  total: number;
}

const SellerOrders = () => {
  const { seller, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!seller?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      // Get all order_items for this seller
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, product_name, quantity, price, size, color')
        .eq('seller_id', seller.id);
      if (itemsError) {
        toast.error(`Orders load failed: ${itemsError.message}`);
        setOrders([]);
        setLoading(false);
        return;
      }
      if (!items || items.length === 0) { setOrders([]); setLoading(false); return; }
      const orderIds = [...new Set(items.map((i) => i.order_id))];
      const { data: ords, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, payment_method, shipping_address, shipping_city, shipping_state, shipping_pincode, shipping_phone')
        .in('id', orderIds)
        .order('created_at', { ascending: false });
      if (ordersError) {
        toast.error(`Orders load failed: ${ordersError.message}`);
        setOrders([]);
        setLoading(false);
        return;
      }
      // profiles for customer name
      const rows: OrderRow[] = (ords || []).map((o: any) => {
        const oItems = items.filter((i) => i.order_id === o.id);
        return {
          ...o,
          items: oItems,
          total: oItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0),
        };
      });
      setOrders(rows);
      setLoading(false);
    })();
  }, [authLoading, seller?.id]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status: status as any }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Status updated');
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const downloadInvoice = (o: OrderRow) => {
    generateTaxInvoice({
      order_number: o.order_number,
      order_date: o.created_at,
      customer_name: 'Customer',
      shipping_address: o.shipping_address,
      shipping_city: o.shipping_city,
      shipping_state: o.shipping_state,
      shipping_pincode: o.shipping_pincode,
      shipping_phone: o.shipping_phone,
      payment_method: o.payment_method,
      seller_name: seller?.business_name || 'Trendra Seller',
      seller_gstin: seller?.gstin,
      seller_address: [seller?.address, seller?.city, seller?.state, seller?.pincode].filter(Boolean).join(', '),
      items: o.items.map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        price: Number(i.price),
        size: i.size,
        color: i.color,
      })),
    });
  };

  return (
    <SellerLayout>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders yet.</TableCell></TableRow>
              ) : orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.order_number}</TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>{o.items.length}</TableCell>
                  <TableCell>₹{o.total.toFixed(0)}</TableCell>
                  <TableCell className="uppercase text-xs">{o.payment_method}</TableCell>
                  <TableCell>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1 bg-background"
                    >
                      {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => downloadInvoice(o)}>
                      <FileText className="h-4 w-4 mr-1" />PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SellerLayout>
  );
};

export default SellerOrders;
