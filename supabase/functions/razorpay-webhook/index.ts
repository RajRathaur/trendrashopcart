// Razorpay webhook receiver — verifies signature and reconciles orders.
// Public endpoint: no JWT (verify_jwt=false in config).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-razorpay-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
  if (!webhookSecret) return new Response('Not configured', { status: 500 });

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const rawBody = await req.text();
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  if (!timingSafeEqual(expected, signature)) {
    console.warn('razorpay-webhook: signature mismatch');
    return new Response('Invalid signature', { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const type: string = event.event;
    const payment = event.payload?.payment?.entity;
    const trendraOrderId = payment?.notes?.trendra_order_id || null;

    if (type === 'payment.captured' || type === 'order.paid') {
      if (trendraOrderId) {
        await admin.from('orders').update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        }).eq('id', trendraOrderId);
      }
    } else if (type === 'payment.failed') {
      if (trendraOrderId) {
        await admin.from('orders').update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        }).eq('id', trendraOrderId);
      }
    } else if (type === 'refund.processed') {
      if (trendraOrderId) {
        await admin.from('orders').update({
          payment_status: 'refunded',
          status: 'refunded',
          updated_at: new Date().toISOString(),
        }).eq('id', trendraOrderId);
      }
    }

    // Log every event for reconciliation (best-effort).
    try {
      await admin.from('payment_confirmations').insert({
        order_id: trendraOrderId,
        provider: 'razorpay',
        provider_payment_id: payment?.id ?? null,
        provider_order_id: payment?.order_id ?? null,
        status: type,
      } as never);
    } catch (logErr) {
      console.warn('payment_confirmations insert failed:', logErr);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('razorpay-webhook processing error:', e);
    return new Response('Server error', { status: 500 });
  }
});

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
