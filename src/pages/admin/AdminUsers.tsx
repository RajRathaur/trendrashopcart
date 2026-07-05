import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Ban, Undo2, Users as UsersIcon, UserPlus, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  is_blocked: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  order_count: number;
  last_order_at: string | null;
}

type Filter = 'all' | 'new' | 'active' | 'inactive' | 'blocked';

const DAY = 24 * 60 * 60 * 1000;

const AdminUsers = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/');
  }, [isLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_admin_users_overview');
    if (error) {
      toast.error(error.message);
      setUsers([]);
    } else {
      setUsers((data as UserRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const now = Date.now();

  const enriched = useMemo(() => {
    return users.map((p) => {
      const created = new Date(p.created_at).getTime();
      const isNew = now - created < 7 * DAY;
      const lastOrder = p.last_order_at ? new Date(p.last_order_at).getTime() : 0;
      const isActive = lastOrder > 0 && now - lastOrder < 30 * DAY;
      return { ...p, isNew, isActive };
    });
  }, [users, now]);


  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return enriched.filter((u) => {
      if (filter === 'new' && !u.isNew) return false;
      if (filter === 'active' && !u.isActive) return false;
      if (filter === 'inactive' && u.isActive) return false;
      if (filter === 'blocked' && !u.is_blocked) return false;
      if (!term) return true;
      return (
        (u.full_name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.phone || '').toLowerCase().includes(term) ||
        (u.city || '').toLowerCase().includes(term)
      );
    });
  }, [enriched, q, filter]);

  const stats = useMemo(() => ({
    total: enriched.length,
    newCount: enriched.filter((u) => u.isNew).length,
    activeCount: enriched.filter((u) => u.isActive).length,
    blockedCount: enriched.filter((u) => u.is_blocked).length,
  }), [enriched]);

  const toggleBlock = async (user_id: string, blocked: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_blocked: blocked }).eq('user_id', user_id);
    if (error) return toast.error(error.message);
    toast.success(blocked ? 'User blocked' : 'User unblocked');
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Users" value={stats.total} icon={<UsersIcon className="h-4 w-4" />} onClick={() => setFilter('all')} active={filter === 'all'} />
        <StatCard label="New (7d)" value={stats.newCount} icon={<UserPlus className="h-4 w-4" />} onClick={() => setFilter('new')} active={filter === 'new'} />
        <StatCard label="Active (30d)" value={stats.activeCount} icon={<Activity className="h-4 w-4" />} onClick={() => setFilter('active')} active={filter === 'active'} />
        <StatCard label="Blocked" value={stats.blockedCount} icon={<Ban className="h-4 w-4" />} onClick={() => setFilter('blocked')} active={filter === 'blocked'} />
      </div>

      <div className="flex gap-2 mb-4">
        <Input placeholder="Search by name, email, phone, city..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        {filter !== 'all' && (
          <Button variant="outline" size="sm" onClick={() => setFilter('all')}>Clear filter</Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
              ) : filtered.map((u) => {
                const r = u.roles && u.roles.length ? u.roles : ['user'];
                return (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{u.full_name || 'Unnamed'}</TableCell>
                    <TableCell className="text-sm">
                      {u.email ? <a href={`mailto:${u.email}`} className="hover:underline">{u.email}</a> : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.phone ? <a href={`tel:${u.phone}`} className="hover:underline">{u.phone}</a> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm max-w-[220px]">
                      {u.address || u.city || u.state || u.pincode ? (
                        <div>
                          {u.address && <div className="truncate" title={u.address}>{u.address}</div>}
                          <div className="text-xs text-muted-foreground">
                            {[u.city, u.state, u.pincode].filter(Boolean).join(', ') || '—'}
                          </div>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.map((role) => (
                          <Badge key={role} variant={role === 'admin' ? 'default' : role === 'seller' ? 'secondary' : 'outline'} className="text-xs capitalize">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.order_count}
                      {u.last_order_at && <div className="text-xs text-muted-foreground">last {new Date(u.last_order_at).toLocaleDateString()}</div>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{new Date(u.created_at).toLocaleDateString()}</div>
                      {u.last_sign_in_at && <div className="text-muted-foreground">seen {new Date(u.last_sign_in_at).toLocaleDateString()}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.is_blocked && <Badge variant="destructive" className="text-xs">Blocked</Badge>}
                        {u.isNew && !u.is_blocked && <Badge className="text-xs bg-green-600 hover:bg-green-600">New</Badge>}
                        {u.isActive && !u.is_blocked && <Badge variant="secondary" className="text-xs">Active</Badge>}
                        {!u.isActive && !u.isNew && !u.is_blocked && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {u.is_blocked ? (
                        <Button size="sm" variant="outline" onClick={() => toggleBlock(u.user_id, false)}>
                          <Undo2 className="h-3.5 w-3.5 mr-1" />Unblock
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => toggleBlock(u.user_id, true)}>
                          <Ban className="h-3.5 w-3.5 mr-1" />Block
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

const StatCard = ({ label, value, icon, onClick, active }: { label: string; value: number; icon: React.ReactNode; onClick: () => void; active: boolean }) => (
  <Card className={`cursor-pointer transition-colors ${active ? 'border-primary' : ''}`} onClick={onClick}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default AdminUsers;
