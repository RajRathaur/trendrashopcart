import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, IndianRupee, Boxes } from 'lucide-react';

const SellerDashboard = () => {
  const { seller } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, stock: 0 });

  useEffect(() => {
    if (!seller?.id) return;
    (async () => {
      const { data: products } = await supabase
        .from('products')
        .select('id, stock')
        .eq('seller_id', seller.id);
      const { data: items } = await supabase
        .from('order_items')
        .select('quantity, price, order_id')
        .eq('seller_id', seller.id);
      const revenue = (items || []).reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      const orderIds = new Set((items || []).map((i) => i.order_id));
      setStats({
        products: products?.length || 0,
        orders: orderIds.size,
        revenue,
        stock: (products || []).reduce((s, p) => s + (p.stock || 0), 0),
      });
    })();
  }, [seller?.id]);

  const cards = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'text-blue-600' },
    { label: 'Orders Received', value: stats.orders, icon: ShoppingCart, color: 'text-green-600' },
    { label: 'Total Revenue', value: `₹${stats.revenue.toFixed(0)}`, icon: IndianRupee, color: 'text-yellow-600' },
    { label: 'Stock On Hand', value: stats.stock, icon: Boxes, color: 'text-purple-600' },
  ];

  return (
    <SellerLayout>
      <h1 className="text-2xl font-bold mb-6">Welcome, {seller?.business_name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;
