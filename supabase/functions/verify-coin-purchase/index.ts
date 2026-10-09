// Verifies a Razorpay payment for a coin pack and credits coins to the wallet.
// Idempotent: the same razorpay_payment_id is credited only once.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const COINS_PER_RUPEE = 100;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'Razorpay not configured' }, 500);

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
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: 'Missing fields' }, 400);
    }

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!timingSafeEqual(expected, razorpay_signature)) {
      return json({ error: 'Invalid signature' }, 400);
    }

    // Fetch the payment from Razorpay to get the authoritative amount + status.
    const auth = btoa(`${keyId}:${keySecret}`);
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!payRes.ok) {
      const t = await payRes.text();
      console.error('Razorpay payment fetch failed:', payRes.status, t);
      return json({ error: 'Payment fetch failed' }, 502);
    }
    const payment = JSON.parse(await payRes.text());
    if (payment.order_id !== razorpay_order_id) return json({ error: 'Order mismatch' }, 400);
    if (!['captured', 'authorized'].includes(payment.status)) {
      return json({ error: `Payment not successful (${payment.status})` }, 400);
    }

    const amountRupees = Math.round(Number(payment.amount) / 100);
    if (!Number.isFinite(amountRupees) || amountRupees < 10 || amountRupees > 100000) {
      return json({ error: 'Invalid amount' }, 400);
    }
    const coins = amountRupees * COINS_PER_RUPEE;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Idempotency: if this payment was already credited, just return success.
    const { data: existing } = await admin
      .from('coin_purchases')
      .select('id, status, coins')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .maybeSingle();
    if (existing?.status === 'credited') {
      return json({ verified: true, coins: existing.coins, already_credited: true });
    }

    // Record the purchase (unique razorpay_payment_id prevents double credit).
    const { error: insErr } = await admin.from('coin_purchases').insert({
      user_id: userId,
      razorpay_order_id,
      razorpay_payment_id,
      amount_inr: amountRupees,
      coins,
      status: 'credited',
    });
    if (insErr) {
      // Unique violation => another request already credited this payment.
      if (String(insErr.code) === '23505') {
        return json({ verified: true, coins, already_credited: true });
      }
      console.error('coin_purchases insert:', insErr);
      return json({ error: 'Could not record purchase' }, 500);
    }

    // Credit the wallet (upsert by user_id).
    const { data: wallet } = await admin
      .from('coin_wallet')
      .select('id, balance, total_earned')
      .eq('user_id', userId)
      .maybeSingle();
    if (wallet) {
      const { error: wErr } = await admin
        .from('coin_wallet')
        .update({
          balance: wallet.balance + coins,
          total_earned: wallet.total_earned + coins,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);
      if (wErr) {
        console.error('wallet update:', wErr);
        return json({ error: 'Wallet credit failed' }, 500);
      }
    } else {
      const { error: wErr } = await admin
        .from('coin_wallet')
        .insert({ user_id: userId, balance: coins, total_earned: coins });
      if (wErr) {
        console.error('wallet insert:', wErr);
        return json({ error: 'Wallet credit failed' }, 500);
      }
    }

    return json({ verified: true, coins });
  } catch (e) {
    console.error('verify-coin-purchase error:', e);
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
