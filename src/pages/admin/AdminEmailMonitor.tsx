import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw, Mail, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

type LogRow = {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

const RANGES = [
  { key: '24h', label: 'Last 24h', hours: 24 },
  { key: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { key: '30d', label: 'Last 30 days', hours: 24 * 30 },
];

const statusColor = (status: string) => {
  switch (status) {
    case 'sent': return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30';
    case 'dlq':
    case 'failed':
    case 'bounced':
      return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
    case 'suppressed':
    case 'complained':
      return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
    case 'pending':
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const PAGE_SIZE = 50;

const AdminEmailMonitor = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [rangeKey, setRangeKey] = useState('7d');
  const [template, setTemplate] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const range = RANGES.find(r => r.key === rangeKey)!;
  const since = useMemo(
    () => new Date(Date.now() - range.hours * 3600 * 1000).toISOString(),
    [range.hours],
  );

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_send_log')
        .select('id, message_id, template_name, recipient_email, status, error_message, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      setRows((data || []) as LogRow[]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [since]);
  useEffect(() => { setPage(0); }, [rangeKey, template, status]);

  // Deduplicate by message_id, keeping latest row (rows already desc by created_at)
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of rows) {
      const key = r.message_id ?? r.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [rows]);

  const templates = useMemo(() => {
    const s = new Set<string>();
    deduped.forEach(r => r.template_name && s.add(r.template_name));
    return Array.from(s).sort();
  }, [deduped]);

  const filtered = useMemo(() => {
    return deduped.filter(r => {
      if (template !== 'all' && r.template_name !== template) return false;
      if (status !== 'all') {
        if (status === 'failed' && !['dlq', 'failed', 'bounced'].includes(r.status)) return false;
        if (status === 'sent' && r.status !== 'sent') return false;
        if (status === 'suppressed' && !['suppressed', 'complained'].includes(r.status)) return false;
        if (status === 'pending' && r.status !== 'pending') return false;
      }
      return true;
    });
  }, [deduped, template, status]);

  const stats = useMemo(() => {
    let sent = 0, failed = 0, suppressed = 0, pending = 0;
    for (const r of filtered) {
      if (r.status === 'sent') sent++;
      else if (['dlq', 'failed', 'bounced'].includes(r.status)) failed++;
      else if (['suppressed', 'complained'].includes(r.status)) suppressed++;
      else if (r.status === 'pending') pending++;
    }
    return { total: filtered.length, sent, failed, suppressed, pending };
  }, [filtered]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Email Monitoring</h1>
            <p className="text-sm text-muted-foreground">
              Delivery status across auth and app emails. Retries are handled automatically by the queue.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={rangeKey} onValueChange={setRangeKey}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGES.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All templates</SelectItem>
              {templates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Mail className="h-5 w-5" />} label="Total" value={stats.total} />
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} label="Sent" value={stats.sent} />
          <StatCard icon={<XCircle className="h-5 w-5 text-red-500" />} label="Failed" value={stats.failed} />
          <StatCard icon={<ShieldAlert className="h-5 w-5 text-yellow-500" />} label="Suppressed" value={stats.suppressed} />
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery log</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : paged.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No emails match these filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent at</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.template_name || '—'}</TableCell>
                        <TableCell className="text-sm">{r.recipient_email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColor(r.status)}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-red-600 max-w-[280px] truncate" title={r.error_message || ''}>
                          {r.error_message || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pageCount > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-muted-foreground">
                      Page {page + 1} of {pageCount} · {filtered.length} emails
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
                      <Button variant="outline" size="sm" disabled={page + 1 >= pageCount} onClick={() => setPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Automatic retries: failed sends stay in the queue and retry up to 5 times.
          After that they move to the dead-letter queue and appear here as <span className="font-mono">dlq</span>.
          Bounces and complaints are added to the suppression list to protect sender reputation.
        </p>
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

export default AdminEmailMonitor;
