import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, RefreshCw, KeyRound, CheckCircle2, XCircle, ShieldAlert, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

type LogRow = {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
};

type SuppressedRow = {
  id: string;
  email: string;
  reason: string | null;
  created_at: string;
};

// Auth-related templates (OTP, magic link, recovery, signup, invite, etc.)
const AUTH_TEMPLATES = ['magiclink', 'recovery', 'signup', 'invite', 'email_change', 'reauthentication'];

const RANGES = [
  { key: '1h', label: 'Last 1 hour', hours: 1 },
  { key: '24h', label: 'Last 24 hours', hours: 24 },
  { key: '7d', label: 'Last 7 days', hours: 24 * 7 },
];

const statusColor = (s: string) => {
  if (s === 'sent') return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30';
  if (['dlq', 'failed', 'bounced'].includes(s)) return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
  if (['suppressed', 'complained'].includes(s)) return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
  if (s === 'pending') return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
  return 'bg-muted text-muted-foreground';
};

/** Human-readable diagnosis from an error_message */
const diagnose = (err: string | null): string => {
  if (!err) return 'No error detail recorded.';
  const e = err.toLowerCase();
  if (e.includes('suppress')) return 'Recipient is on the suppression list (previous bounce/complaint/unsubscribe). Remove them or ask the user to try another email.';
  if (e.includes('bounce') || e.includes('mailbox') || e.includes('does not exist') || e.includes('no such user')) return 'Recipient mailbox does not exist. Typo in email address is the most common cause.';
  if (e.includes('rate') || e.includes('429') || e.includes('too many')) return 'Provider rate-limited the send. The queue will retry automatically after cool-down.';
  if (e.includes('spam') || e.includes('complaint')) return 'Marked as spam / complaint. Sender reputation issue.';
  if (e.includes('timeout') || e.includes('timed out')) return 'Network/provider timeout. The queue retries automatically.';
  if (e.includes('401') || e.includes('403') || e.includes('unauthorized') || e.includes('forbidden')) return 'Auth issue with the email provider. Service role key may have rotated — re-run email infra setup.';
  if (e.includes('invalid') && e.includes('domain')) return 'Sender domain not verified or DNS not propagated yet.';
  if (e.includes('template')) return 'Template rendering error. Check the template file for missing props.';
  return 'Unrecognised error — see raw message below.';
};

const PAGE_SIZE = 50;

const AdminOtpDebug = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [rangeKey, setRangeKey] = useState('24h');
  const [status, setStatus] = useState('all');
  const [template, setTemplate] = useState('all');
  const [emailSearch, setEmailSearch] = useState('');
  const [rows, setRows] = useState<LogRow[]>([]);
  const [suppressed, setSuppressed] = useState<SuppressedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const range = RANGES.find(r => r.key === rangeKey)!;
  const since = useMemo(
    () => new Date(Date.now() - range.hours * 3600 * 1000).toISOString(),
    [range.hours],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [logRes, suppRes] = await Promise.all([
        supabase
          .from('email_send_log')
          .select('id, message_id, template_name, recipient_email, status, error_message, metadata, created_at')
          .in('template_name', AUTH_TEMPLATES)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('suppressed_emails')
          .select('id, email, reason, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (logRes.error) throw logRes.error;
      if (suppRes.error) throw suppRes.error;
      setRows((logRes.data || []) as LogRow[]);
      setSuppressed((suppRes.data || []) as SuppressedRow[]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load OTP logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [since]);
  useEffect(() => { setPage(0); }, [rangeKey, status, template, emailSearch]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [autoRefresh, since]);

  // Dedupe by message_id (latest wins)
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

  const filtered = useMemo(() => {
    const q = emailSearch.trim().toLowerCase();
    return deduped.filter(r => {
      if (template !== 'all' && r.template_name !== template) return false;
      if (status !== 'all') {
        if (status === 'failed' && !['dlq', 'failed', 'bounced'].includes(r.status)) return false;
        if (status === 'sent' && r.status !== 'sent') return false;
        if (status === 'pending' && r.status !== 'pending') return false;
        if (status === 'suppressed' && !['suppressed', 'complained'].includes(r.status)) return false;
      }
      if (q && !(r.recipient_email || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [deduped, template, status, emailSearch]);

  const stats = useMemo(() => {
    let sent = 0, failed = 0, suppressedCount = 0, pending = 0;
    for (const r of filtered) {
      if (r.status === 'sent') sent++;
      else if (['dlq', 'failed', 'bounced'].includes(r.status)) failed++;
      else if (['suppressed', 'complained'].includes(r.status)) suppressedCount++;
      else if (r.status === 'pending') pending++;
    }
    const successRate = filtered.length ? Math.round((sent / filtered.length) * 100) : 0;
    return { total: filtered.length, sent, failed, suppressed: suppressedCount, pending, successRate };
  }, [filtered]);

  // Group failure reasons
  const topErrors = useMemo(() => {
    const buckets = new Map<string, { count: number; sample: LogRow }>();
    for (const r of filtered) {
      if (!['dlq', 'failed', 'bounced', 'suppressed', 'complained'].includes(r.status)) continue;
      const key = (r.error_message || r.status || 'unknown').slice(0, 200);
      const b = buckets.get(key);
      if (b) b.count++;
      else buckets.set(key, { count: 1, sample: r });
    }
    return Array.from(buckets.entries())
      .map(([msg, v]) => ({ msg, count: v.count, sample: v.sample }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filtered]);

  const templates = useMemo(() => {
    const s = new Set<string>();
    deduped.forEach(r => r.template_name && s.add(r.template_name));
    return Array.from(s).sort();
  }, [deduped]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" /> OTP Debug
            </h1>
            <p className="text-sm text-muted-foreground">
              Trace login OTP, password reset, and other auth email deliveries with failure reasons.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(v => !v)}
            >
              <Clock className="h-4 w-4 mr-2" />
              {autoRefresh ? 'Live (10s)' : 'Live off'}
            </Button>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={rangeKey} onValueChange={setRangeKey}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGES.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Template" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All auth templates</SelectItem>
              {templates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed / DLQ</SelectItem>
              <SelectItem value="suppressed">Suppressed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search recipient email…"
            value={emailSearch}
            onChange={e => setEmailSearch(e.target.value)}
            className="w-[240px]"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={<KeyRound className="h-5 w-5" />} label="Total OTPs" value={stats.total} />
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} label="Sent" value={stats.sent} />
          <StatCard icon={<XCircle className="h-5 w-5 text-red-500" />} label="Failed" value={stats.failed} />
          <StatCard icon={<ShieldAlert className="h-5 w-5 text-yellow-500" />} label="Suppressed" value={stats.suppressed} />
          <StatCard icon={<AlertTriangle className="h-5 w-5 text-blue-500" />} label="Success rate" value={`${stats.successRate}%`} />
        </div>

        {/* Top failure reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> Top failure reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topErrors.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No failures in this window — OTP delivery is healthy.
              </div>
            ) : (
              <div className="space-y-3">
                {topErrors.map((e, i) => (
                  <div key={i} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-mono text-xs text-red-600 break-all flex-1">{e.msg}</div>
                      <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30 shrink-0">
                        {e.count}× occurrences
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      <span className="font-semibold text-foreground">Likely cause: </span>
                      {diagnose(e.msg)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last seen: {new Date(e.sample.created_at).toLocaleString()} · {e.sample.recipient_email || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">OTP delivery log</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : paged.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No auth emails match these filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Error / Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.template_name || '—'}</TableCell>
                        <TableCell className="text-sm">{r.recipient_email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs max-w-[340px]">
                          {r.error_message ? (
                            <div>
                              <div className="text-red-600 truncate" title={r.error_message}>{r.error_message}</div>
                              <div className="text-muted-foreground mt-0.5">{diagnose(r.error_message)}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pageCount > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-muted-foreground">Page {page + 1} of {pageCount} · {filtered.length} emails</span>
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

        {/* Suppression list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-500" /> Recent suppressed emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suppressed.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">No suppressed emails — clean sender list.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Suppressed at</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppressed.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{s.email}</TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                            {s.reason || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p><b>Tip:</b> If OTP is stuck in <span className="font-mono">pending</span>, the queue processor may be paused. Failed sends auto-retry up to 5 times before landing in <span className="font-mono">dlq</span>.</p>
          <p><b>Suppressed</b> recipients will never receive future emails until removed from the suppression list.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) => (
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

export default AdminOtpDebug;
