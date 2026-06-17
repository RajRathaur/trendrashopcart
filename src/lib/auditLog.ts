import { supabase } from '@/integrations/supabase/client';

/* ---------- Masking helpers ---------- */

/** Mask all but last 4 digits of a phone number: +91 98765 43210 -> ******3210 */
export function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '*'.repeat(Math.max(4, digits.length - 4)) + digits.slice(-4);
}

/** Mask an email: john.doe@example.com -> jo****@example.com */
export function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const [user, domain] = email.split('@');
  if (!domain) return '****';
  const visible = user.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(2, user.length - 2))}@${domain}`;
}

/** Keep only a short, non-PII snippet of an address (first 24 chars, no digits at end). */
export function addressSnippet(address?: string | null, len = 24): string | null {
  if (!address) return null;
  const cleaned = address.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= len) return cleaned;
  return cleaned.slice(0, len) + '…';
}

/** Pincode is non-sensitive on its own; keep as-is but coerce to string. */
export function normalizePincode(p?: string | number | null): string | null {
  if (p === null || p === undefined || p === '') return null;
  return String(p);
}

/* ---------- Admin context (IP + UA) ---------- */

let cachedIp: string | null | undefined;

async function getClientIp(): Promise<string | null> {
  if (cachedIp !== undefined) return cachedIp;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
    clearTimeout(t);
    const json = await res.json();
    cachedIp = (json?.ip as string) || null;
  } catch {
    cachedIp = null;
  }
  return cachedIp;
}

function getUserAgent(): string | null {
  if (typeof navigator === 'undefined') return null;
  // Trim very long UA strings
  return navigator.userAgent?.slice(0, 256) || null;
}

/* ---------- Logger ---------- */

/**
 * Record a sensitive admin action in admin_audit_logs.
 *
 * Structured metadata layout (sensitive fields are masked by the helpers above
 * before being passed in):
 * {
 *   ...callerMetadata,
 *   _ctx: { ip, user_agent, ts, url }
 * }
 *
 * Caller must be an admin — the server RPC enforces this and stamps admin_id.
 * Failures are logged but never throw, so the primary admin action isn't blocked.
 */
export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const ip = await getClientIp();
    const payload = {
      ...metadata,
      _ctx: {
        ip,
        user_agent: getUserAgent(),
        ts: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.pathname : null,
      },
    };
    const { error } = await (supabase as any).rpc('log_admin_action', {
      _action: action,
      _entity_type: entityType,
      _entity_id: entityId ?? null,
      _metadata: payload,
    });
    if (error) console.warn('Audit log failed:', error.message);
  } catch (err) {
    console.warn('Audit log error:', err);
  }
}
