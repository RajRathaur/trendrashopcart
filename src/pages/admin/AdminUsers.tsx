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

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  is_blocked: boolean;
  created_at: string;
}

type Filter = 'all' | 'new' | 'active' | 'inactive' | 'blocked';

const DAY = 24 * 60 * 60 * 1000;

const AdminUsers = () => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [orderStats, setOrderStats] = useState<Record<string, { count: number; last: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate('/');
  }, [isLoading, isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: rolesData }, { data: orders }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,user_id,full_name,phone,city,state,is_blocked,created_at')
        .order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id,role'),
      supabase.from('orders').select('user_id,created_at'),
    ]);

    const rMap: Record<string, string[]> = {};
    (rolesData || []).forEach((r: any) => {
      rMap[r.user_id] = [...(rMap[r.user_id] || []), r.role];
    });

    const oMap: Record<string, { count: number; last: string | null }> = {};
    (orders || []).forEach((o: any) => {
      const cur = oMap[o.user_id] || { count: 0, last: null };
      cur.count += 1;
      if (!cur.last || new Date(o.created_at) > new Date(cur.last)) cur.last = o.created_at;
      oMap[o.user_id] = cur;
    });

    setProfiles((profs as ProfileRow[]) || []);
    setRoles(rMap);
    setOrderStats(oMap);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const now = Date.now();

  const enriched = useMemo(() => {
    return profiles.map((p) => {
      const created = new Date(p.created_at).getTime();
      const isNew = now - created < 7 * DAY;
      const stat = orderStats[p.user_id];
      const lastOrder = stat?.last ? new Date(stat.last).getTime() : 0;
      const isActive = lastOrder > 0 && now - lastOrder < 30 * DAY;
      return { ...p, isNew, isActive, orderCount: stat?.count || 0, lastOrder: stat?.last || null };
    });
  }, [profiles, orderStats, now]);

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
        <Input placeholder="Search by name, phone, city..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
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
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
              ) : filtered.map((u) => {
                const r = roles[u.user_id] || ['user'];
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || 'Unnamed'}</TableCell>
                    <TableCell className="text-sm">{u.phone || '—'}</TableCell>
                    <TableCell className="text-sm">{[u.city, u.state].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.map((role) => (
                          <Badge key={role} variant={role === 'admin' ? 'default' : role === 'seller' ? 'secondary' : 'outline'} className="text-xs capitalize">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.orderCount}
                      {u.lastOrder && <div className="text-xs text-muted-foreground">last {new Date(u.lastOrder).toLocaleDateString()}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString()}</TableCell>
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
