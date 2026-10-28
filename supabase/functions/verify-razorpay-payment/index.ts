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
    if (!timingSafeEqual(expected, String(razorpay_signature))) {
      return json({ error: 'Invalid signature' }, 400);
    }

    if (!trendraOrderId) return json({ error: 'Missing order' }, 400);

    // Bind the signed Razorpay order to this Trendra order: the Razorpay order
    // must have been priced by create-razorpay-order for this user + order,
    // and the payment must belong to it and be successful.
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    if (!keyId) return json({ error: 'Razorpay not configured' }, 500);
    const basic = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
    const [orderRes, payRes] = await Promise.all([
      fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(String(razorpay_order_id))}`, {
        headers: { Authorization: basic },
      }),
      fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(String(razorpay_payment_id))}`, {
        headers: { Authorization: basic },
      }),
    ]);
    if (!orderRes.ok || !payRes.ok) {
      console.error('Razorpay lookup failed', orderRes.status, payRes.status);
      return json({ error: 'Could not confirm payment with Razorpay' }, 502);
    }
    const rzpOrder = await orderRes.json();
    const rzpPayment = await payRes.json();
    const notes = rzpOrder?.notes ?? {};
    const bound =
      notes.server_priced === '1' &&
      notes.purpose === 'order' &&
      notes.trendra_order_id === trendraOrderId &&
      notes.user_id === userId &&
      rzpPayment?.order_id === razorpay_order_id &&
      ['captured', 'authorized'].includes(rzpPayment?.status) &&
      Number(rzpPayment?.amount) === Number(rzpOrder?.amount);
    if (!bound) {
      console.error('Razorpay payment not bound to order', { trendraOrderId, razorpay_order_id });
      return json({ error: 'Payment does not match this order' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Append the payment id to existing notes instead of overwriting them,
    // so customer/coupon details saved at order creation are preserved.
    const { data: existing } = await admin
      .from('orders')
      .select('notes, status')
      .eq('id', trendraOrderId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!existing) return json({ error: 'Order not found' }, 404);

    const prevNotes = (existing.notes as string | null) ?? '';
    const paidNote = `Razorpay paid: ${razorpay_payment_id}`;
    const newNotes = prevNotes.includes(paidNote)
      ? prevNotes
      : prevNotes
        ? `${prevNotes} | ${paidNote}`
        : paidNote;

    if (existing.status === 'pending') {
      const { error: updErr } = await admin
        .from('orders')
        .update({
          payment_method: 'razorpay',
          status: 'confirmed',
          notes: newNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trendraOrderId)
        .eq('user_id', userId)
        .eq('status', 'pending');
      if (updErr) {
        console.error('order update error:', updErr);
        return json({ error: 'Order update failed' }, 500);
      }
    }

    return json({ verified: true });
  } catch (e) {
    console.error('verify-razorpay-payment error:', e);
    return json({ error: 'Internal error' }, 500);
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
