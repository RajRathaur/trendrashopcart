import { supabase } from '@/integrations/supabase/client';

/**
 * Record a sensitive admin action in admin_audit_logs.
 * Caller must be an admin — the server function enforces this and stamps admin_id.
 * Failures are logged but never throw, so the primary admin action isn't blocked.
 */
export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { error } = await (supabase as any).rpc('log_admin_action', {
      _action: action,
      _entity_type: entityType,
      _entity_id: entityId ?? null,
      _metadata: metadata,
    });
    if (error) console.warn('Audit log failed:', error.message);
  } catch (err) {
    console.warn('Audit log error:', err);
  }
}
