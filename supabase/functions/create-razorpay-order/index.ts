// Creates a Razorpay order for an authenticated user and returns
// the order id + public key id so the client can open Checkout.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      return json({ error: 'Razorpay not configured' }, 500);
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: 'Unauthorized' }, 401);
    const userId = claimsData.claims.sub as string;

    // Input
    const body = await req.json().catch(() => ({}));
    const amountRupees = Number(body?.amount);
    // Accept both snake_case and camelCase from clients.
    const orderId: string | undefined = body?.order_id ?? body?.orderId ?? body?.trendra_order_id;
    if (!Number.isFinite(amountRupees) || amountRupees <= 0 || amountRupees > 1_000_000) {
      return json({ error: 'Invalid amount' }, 400);
    }

    const amountPaise = Math.round(amountRupees * 100);

    // Call Razorpay
    const auth = btoa(`${keyId}:${keySecret}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: (orderId ?? `usr_${userId}`).slice(0, 40),
        notes: { user_id: userId, trendra_order_id: orderId ?? '' },
      }),
    });

    const rzpBody = await rzpRes.text();
    if (!rzpRes.ok) {
      console.error('Razorpay order create failed:', rzpRes.status, rzpBody);
      return json({ error: 'Razorpay order failed', status: rzpRes.status, details: rzpBody }, rzpRes.status);
    }

    const rzpOrder = JSON.parse(rzpBody);
    return json({
      key_id: keyId,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    });
  } catch (e) {
    console.error('create-razorpay-order error:', e);
    return json({ error: (e as Error).message ?? 'Internal error' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
