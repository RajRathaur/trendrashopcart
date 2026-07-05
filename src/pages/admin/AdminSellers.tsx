import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Check, X, Ban, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

interface Seller {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string | null;
  business_phone: string | null;
  gstin: string | null;
  city: string | null;
  state: string | null;
  is_approved: boolean;
  is_blocked: boolean;
  created_at: string;
}

const AdminSellers = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/');
  }, [isLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sellers')
      .select('id,user_id,business_name,business_email,business_phone,gstin,city,state,is_approved,is_blocked,created_at')
      .order('created_at', { ascending: false });
    setSellers((data as Seller[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const update = async (id: string, patch: Partial<Seller>) => {
    const { error } = await supabase.from('sellers').update(patch).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated');
    load();
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Sellers</h1>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No seller registrations yet.</TableCell></TableRow>
              ) : sellers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.business_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{s.business_email || '—'}</div>
                    <div className="text-xs text-muted-foreground">{s.business_phone || '—'}</div>
                  </TableCell>
                  <TableCell className="text-sm">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  <TableCell className="text-xs">{s.gstin || '—'}</TableCell>
                  <TableCell>
                    {s.is_blocked ? <Badge variant="destructive">Blocked</Badge>
                      : s.is_approved ? <Badge>Approved</Badge>
                      : <Badge variant="secondary">Pending</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {!s.is_approved && !s.is_blocked && (
                      <>
                        <Button size="sm" onClick={() => update(s.id, { is_approved: true })}>
                          <Check className="h-3.5 w-3.5 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => update(s.id, { is_blocked: true })}>
                          <X className="h-3.5 w-3.5 mr-1" />Reject
                        </Button>
                      </>
                    )}
                    {s.is_approved && !s.is_blocked && (
                      <Button size="sm" variant="outline" onClick={() => update(s.id, { is_blocked: true })}>
                        <Ban className="h-3.5 w-3.5 mr-1" />Block
                      </Button>
                    )}
                    {s.is_blocked && (
                      <Button size="sm" variant="outline" onClick={() => update(s.id, { is_blocked: false, is_approved: true })}>
                        <Undo2 className="h-3.5 w-3.5 mr-1" />Unblock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSellers;
