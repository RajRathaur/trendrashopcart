import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PaymentConfirmation {
  id: string;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  product_name: string;
  payment_amount: number;
  screenshot_url: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const AdminPayments = () => {
  const [confirmations, setConfirmations] = useState<PaymentConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PaymentConfirmation | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchConfirmations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_confirmations' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching:', error);
      toast.error('Failed to load payment confirmations');
    } else {
      setConfirmations((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchConfirmations(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from('payment_confirmations' as any)
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Payment ${status === 'verified' ? 'verified' : 'rejected'}`);
      fetchConfirmations();
      setSelectedItem(null);
    }
    setUpdating(null);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payment Confirmations</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : confirmations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No payment confirmations yet.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {confirmations.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{item.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{item.phone_number}</div>
                    </td>
                    <td className="p-3">{item.product_name}</td>
                    <td className="p-3 font-medium">₹{item.payment_amount}</td>
                    <td className="p-3">
                      <Badge variant={statusColor(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedItem(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => { setSelectedItem(null); setSignedUrl(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Confirmation Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer</span>
                  <p className="font-medium">{selectedItem.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone</span>
                  <p className="font-medium">{selectedItem.phone_number}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Address</span>
                  <p className="font-medium">{selectedItem.delivery_address}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Product</span>
                  <p className="font-medium">{selectedItem.product_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="font-bold">₹{selectedItem.payment_amount}</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground block mb-2">Payment Screenshot</span>
                {signedUrl ? (
                  <img
                    src={signedUrl}
                    alt="Payment screenshot"
                    className="w-full rounded-lg border max-h-72 object-contain bg-muted"
                  />
                ) : (
                  <div className="w-full h-40 rounded-lg border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                    Loading screenshot…
                  </div>
                )}
              </div>

              {selectedItem.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => updateStatus(selectedItem.id, 'verified')}
                    disabled={!!updating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Payment
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => updateStatus(selectedItem.id, 'rejected')}
                    disabled={!!updating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPayments;
