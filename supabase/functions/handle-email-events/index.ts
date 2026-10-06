import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.3.1'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Notification-only record of terminal outcomes (Lovable enforces suppression).
async function record(
  eventId: string,
  recipient: string,
  logStatus: 'bounced' | 'complained' | 'suppressed',
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  message: string,
) {
  const email = recipient.toLowerCase()
  const { error: logError } = await supabase.from('email_send_log').insert({
    template_name: 'system',
    recipient_email: email,
    status: logStatus,
    error_message: message,
  })
  if (logError) {
    console.error('email_send_log insert failed', { event_id: eventId, code: logError.code, message: logError.message })
    throw new Error('log insert failed')
  }
  const { error: supError } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (supError) {
    console.error('suppressed_emails upsert failed', { event_id: eventId, code: supError.code, message: supError.message })
    throw new Error('suppression upsert failed')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record(event.event_id, event.data.recipient, 'bounced', 'bounce', 'Email bounced')
    },
    'email.complaint': async (event) => {
      await record(event.event_id, event.data.recipient, 'complained', 'complaint', 'Spam complaint received')
    },
    'email.unsubscribed': async (event) => {
      await record(event.event_id, event.data.recipient, 'suppressed', 'unsubscribe', 'Recipient unsubscribed')
    },
  },
})

Deno.serve((req) => handler(req))
