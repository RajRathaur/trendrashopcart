import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Alert thresholds
const WINDOW_MINUTES = 15;
const DLQ_THRESHOLD = 1;          // any DLQ event triggers alert
const FAILURE_RATE_MIN_SENDS = 5; // need at least N attempts before rate matters
const FAILURE_RATE_THRESHOLD = 0.2; // 20% failures in window
const ALERT_COOLDOWN_MINUTES = 30;  // don't re-alert more often than this

const ADMIN_EMAILS = [
  'aksahuakhil@gmail.com',
  'rambaburathour133@gmail.com',
  'trendra.care.ac.in@gmail.com',
];

type LogRow = {
  id: string;
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    const admin = createClient(supabaseUrl, serviceKey);

    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data: logs, error: logErr } = await admin
      .from('email_send_log')
      .select('id, message_id, template_name, recipient_email, status, error_message, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (logErr) throw logErr;

    // Dedup by message_id (latest status wins — already desc order)
    const seen = new Set<string>();
    const dedup: LogRow[] = [];
    for (const r of (logs || []) as LogRow[]) {
      const k = r.message_id ?? r.id;
      if (seen.has(k)) continue;
      seen.add(k);
      dedup.push(r);
    }

    const total = dedup.length;
    const dlq = dedup.filter(r => r.status === 'dlq');
    const failed = dedup.filter(r => ['failed', 'bounced'].includes(r.status));
    const suppressed = dedup.filter(r => ['suppressed', 'complained'].includes(r.status));
    const sent = dedup.filter(r => r.status === 'sent').length;

    const failureRate = total >= FAILURE_RATE_MIN_SENDS
      ? (dlq.length + failed.length) / total
      : 0;

    const shouldAlert =
      dlq.length >= DLQ_THRESHOLD ||
      (total >= FAILURE_RATE_MIN_SENDS && failureRate >= FAILURE_RATE_THRESHOLD);

    if (!shouldAlert) {
      return json({ ok: true, alerted: false, total, dlq: dlq.length, failed: failed.length });
    }

    // Cooldown check
    const { data: state } = await admin
      .from('email_alert_state')
      .select('last_alerted_log_id, last_alert_at')
      .eq('id', 1)
      .maybeSingle();

    const newestLogId = dedup[0]?.id ?? null;
    const lastAlertAt = state?.last_alert_at ? new Date(state.last_alert_at).getTime() : 0;
    const cooldownActive = Date.now() - lastAlertAt < ALERT_COOLDOWN_MINUTES * 60 * 1000;
    const alreadyAlerted = state?.last_alerted_log_id && state.last_alerted_log_id === newestLogId;

    if (cooldownActive && alreadyAlerted) {
      return json({ ok: true, alerted: false, reason: 'cooldown', total, dlq: dlq.length });
    }

    // Build alert content
    const subject = `⚠️ Trendra email delivery alert: ${dlq.length} DLQ, ${failed.length} failed`;
    const failingByTemplate = groupCount(dedup.filter(r => ['dlq', 'failed', 'bounced'].includes(r.status)), r => r.template_name || 'unknown');
    const templateSummary = Object.entries(failingByTemplate)
      .map(([t, n]) => `${t}: ${n}`).join(', ') || 'none';

    const recentFailures = [...dlq, ...failed].slice(0, 10);
    const failureRows = recentFailures.map(r => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-family:monospace;font-size:12px">${escapeHtml(r.template_name || '—')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">${escapeHtml(r.recipient_email || '—')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px"><b style="color:#dc2626">${r.status}</b></td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px;color:#666">${escapeHtml((r.error_message || '').slice(0, 120))}</td>
      </tr>`).join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#fff;color:#111">
        <h1 style="color:#dc2626;font-size:22px;margin:0 0 8px">⚠️ Email Delivery Alert</h1>
        <p style="color:#666;margin:0 0 16px">Detected in the last ${WINDOW_MINUTES} minutes on Trendra.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;background:#f9fafb"><b>Total attempts</b></td><td style="padding:8px;background:#f9fafb">${total}</td></tr>
          <tr><td style="padding:8px"><b>Sent</b></td><td style="padding:8px;color:#16a34a">${sent}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb"><b>Dead-letter (permanently failed)</b></td><td style="padding:8px;background:#f9fafb;color:#dc2626"><b>${dlq.length}</b></td></tr>
          <tr><td style="padding:8px"><b>Failed (retrying)</b></td><td style="padding:8px;color:#dc2626">${failed.length}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb"><b>Suppressed</b></td><td style="padding:8px;background:#f9fafb;color:#ca8a04">${suppressed.length}</td></tr>
          <tr><td style="padding:8px"><b>Failure rate</b></td><td style="padding:8px">${(failureRate * 100).toFixed(1)}%</td></tr>
          <tr><td style="padding:8px;background:#f9fafb"><b>Templates affected</b></td><td style="padding:8px;background:#f9fafb">${escapeHtml(templateSummary)}</td></tr>
        </table>

        ${recentFailures.length ? `
        <h3 style="font-size:14px;margin:16px 0 8px">Recent failures</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee">
          <tr style="background:#f3f4f6"><th align="left" style="padding:6px 8px;font-size:12px">Template</th><th align="left" style="padding:6px 8px;font-size:12px">Recipient</th><th align="left" style="padding:6px 8px;font-size:12px">Status</th><th align="left" style="padding:6px 8px;font-size:12px">Error</th></tr>
          ${failureRows}
        </table>` : ''}

        <p style="margin:24px 0 0;font-size:13px;color:#666">
          Open the <b>Email Monitor</b> in the admin panel for full details:<br>
          <a href="https://trendrashopcart.lovable.app/admin/email-monitor" style="color:#2563eb">https://trendrashopcart.lovable.app/admin/email-monitor</a>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="font-size:11px;color:#999">Automated alert from Trendra email failure monitor. Retries continue automatically until an email is delivered or moved to DLQ after 5 attempts.</p>
      </div>`;

    // 1. Insert in-app notifications for all admins
    const { data: adminRows } = await admin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminRows?.length) {
      const notifications = adminRows.map((r: { user_id: string }) => ({
        user_id: r.user_id,
        title: subject,
        message: `${dlq.length} email(s) in dead-letter queue, ${failed.length} failed, ${suppressed.length} suppressed in the last ${WINDOW_MINUTES} min.`,
        type: 'email_alert',
        is_read: false,
      }));
      await admin.from('notifications').insert(notifications);
    }

    // 2. Send alert email via Resend
    let emailSent = false;
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Trendra Alerts <onboarding@resend.dev>',
          to: ADMIN_EMAILS,
          subject,
          html,
        }),
      });
      emailSent = res.ok;
      if (!res.ok) console.error('Alert email failed', res.status, await res.text());
    } else {
      console.warn('RESEND_API_KEY missing — skipping alert email');
    }

    // 3. Update alert state
    await admin.from('email_alert_state').upsert({
      id: 1,
      last_alerted_log_id: newestLogId,
      last_alert_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return json({
      ok: true,
      alerted: true,
      emailSent,
      total,
      dlq: dlq.length,
      failed: failed.length,
      suppressed: suppressed.length,
      failureRate: Number(failureRate.toFixed(3)),
    });
  } catch (e) {
    console.error('email-failure-monitor error', e);
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});

function groupCount<T>(items: T[], keyFn: (t: T) => string) {
  const out: Record<string, number> = {};
  for (const it of items) out[keyFn(it)] = (out[keyFn(it)] ?? 0) + 1;
  return out;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
