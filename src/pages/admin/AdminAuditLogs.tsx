import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  admin_name?: string | null;
}

const actionColor = (action: string) => {
  if (/approve|verify|confirm/i.test(action)) return 'bg-green-100 text-green-700';
  if (/reject|block|delete|cancel/i.test(action)) return 'bg-red-100 text-red-700';
  if (/update|change/i.test(action)) return 'bg-blue-100 text-blue-700';
  return 'bg-muted text-muted-foreground';
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Failed to load audit logs:', error);
        setLogs([]);
      } else {
        const rows = (data as AuditLog[]) || [];
        const adminIds = [...new Set(rows.map((r) => r.admin_id))];
        if (adminIds.length) {
          const { data: profiles } = await (supabase as any).rpc('get_public_profiles', {
            _user_ids: adminIds,
          });
          const map = new Map<string, string>(
            ((profiles as Array<{ user_id: string; full_name: string | null }>) || [])
              .map((p) => [p.user_id, p.full_name ?? ''])
          );
          rows.forEach((r) => { r.admin_name = map.get(r.admin_id) || null; });
        }
        setLogs(rows);
      }
      setLoading(false);
    })();
  }, []);

  const entityTypes = [...new Set(logs.map((l) => l.entity_type))];

  const filtered = logs.filter((l) => {
    if (entityFilter !== 'all' && l.entity_type !== entityFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.entity_id || '').toLowerCase().includes(q) ||
      (l.admin_name || '').toLowerCase().includes(q) ||
      JSON.stringify(l.metadata || {}).toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Audit Logs</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search action, ID, admin, metadata…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-md"
          />
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            No audit log entries yet.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">When</th>
                  <th className="text-left p-3 font-medium">Admin</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">Entity</th>
                  <th className="text-left p-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium">{log.admin_name || '—'}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {log.admin_id.slice(0, 8)}…
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={actionColor(log.action)} variant="secondary">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{log.entity_type}</div>
                      {log.entity_id && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.entity_id.slice(0, 12)}…
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <pre className="text-xs bg-muted/50 rounded p-2 max-w-md overflow-auto">
{JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogs;
