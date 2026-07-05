import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Payment {
  id: string;
  customer_name: string;
  phone_number: string;
  product_name: string;
  payment_amount: number;
  status: string;
  created_at: string;
  screenshot_url: string | null;
}

const SellerPayments = () => {
  const { seller } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!seller?.id) return;
    (async () => {
      setLoading(true);
      // Get products for this seller
      const { data: prods } = await supabase.from('products').select('id').eq('seller_id', seller.id);
      const ids = (prods || []).map((p) => p.id);
      if (ids.length === 0) { setPayments([]); setLoading(false); return; }
      const { data } = await supabase
        .from('payment_confirmations')
        .select('id, customer_name, phone_number, product_name, payment_amount, status, created_at, screenshot_url')
        .in('product_id', ids)
        .order('created_at', { ascending: false });
      setPayments((data as Payment[]) || []);
      setLoading(false);
    })();
  }, [seller?.id]);

  return (
    <SellerLayout>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Screenshot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments yet.</TableCell></TableRow>
              ) : payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.created_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{p.phone_number}</div>
                  </TableCell>
                  <TableCell>{p.product_name}</TableCell>
                  <TableCell>₹{Number(p.payment_amount).toFixed(0)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.screenshot_url ? <a href={p.screenshot_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">View</a> : '—'}
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

export default SellerPayments;
