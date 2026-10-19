// Verifies Razorpay checkout signature and marks the order paid.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) return json({ error: 'Razorpay not configured' }, 500);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};
    // Accept both snake_case and camelCase from clients.
    const trendraOrderId: string | null =
      body?.trendra_order_id ?? body?.order_id ?? body?.orderId ?? null;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing fields' }, 400);
    }

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!timingSafeEqual(expected, razorpay_signature)) {
      return json({ error: 'Invalid signature' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (trendraOrderId) {
      // Append the payment id to existing notes instead of overwriting them,
      // so customer/coupon details saved at order creation are preserved.
      const { data: existing } = await admin
        .from('orders')
        .select('notes')
        .eq('id', trendraOrderId)
        .eq('user_id', userId)
        .maybeSingle();
      const prevNotes = (existing?.notes as string | null) ?? '';
      const paidNote = `Razorpay paid: ${razorpay_payment_id}`;
      const notes = prevNotes.includes(paidNote)
        ? prevNotes
        : prevNotes
          ? `${prevNotes} | ${paidNote}`
          : paidNote;

      const { error: updErr } = await admin
        .from('orders')
        .update({
          payment_method: 'razorpay',
          status: 'confirmed',
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trendraOrderId)
        .eq('user_id', userId);
      if (updErr) console.error('order update error:', updErr);
    }

    return json({ verified: true });
  } catch (e) {
    console.error('verify-razorpay-payment error:', e);
    return json({ error: (e as Error).message ?? 'Internal error' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

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
