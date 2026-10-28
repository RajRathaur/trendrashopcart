// Creates a Razorpay order for an authenticated user and returns
// the order id + public key id so the client can open Checkout.
//
// The amount is always decided on the server:
// - Shop orders: taken from the caller's own pending order (items + delivery)
//   minus a coupon discount that is re-validated here.
// - Coin packs: must be one of the fixed pack prices.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Coin packs sold on the Redeem page (₹). Keep in sync with BuyCoins.tsx.
const COIN_PACK_RUPEES = [10, 20, 50, 100];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // Accept both snake_case and camelCase from clients.
    const rawOrderId = body?.order_id ?? body?.orderId ?? body?.trendra_order_id;
    const orderId: string | null = typeof rawOrderId === 'string' && rawOrderId ? rawOrderId : null;
    const couponCode: string | null =
      typeof body?.coupon_code === 'string' && body.coupon_code.trim()
        ? body.coupon_code.trim().toUpperCase().slice(0, 40)
        : null;

    let amountPaise: number;
    let purpose: 'order' | 'coins';

    if (orderId) {
      if (!UUID_RE.test(orderId)) return json({ error: 'Invalid order' }, 400);
      purpose = 'order';

      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data: order, error: orderErr } = await admin
        .from('orders')
        .select('id, user_id, status, total_amount, delivery_fee')
        .eq('id', orderId)
        .maybeSingle();
      if (orderErr || !order || order.user_id !== userId) {
        return json({ error: 'Order not found' }, 404);
      }
      if (order.status !== 'pending') {
        return json({ error: 'This order is no longer awaiting payment' }, 409);
      }

      // total_amount = items (priced by the database) + delivery fee.
      const total = Number(order.total_amount) || 0;
      const delivery = Math.max(0, Number(order.delivery_fee) || 0);
      const subtotal = Math.max(0, total - delivery);

      let discount = 0;
      if (couponCode) {
        // validate_coupon raises if the code is inactive, expired, used up
        // or below the minimum order amount.
        const { data: cData, error: cErr } = await supabase.rpc('validate_coupon', {
          _code: couponCode,
          _order_amount: subtotal,
        });
        const c = Array.isArray(cData) ? cData[0] : cData;
        if (cErr || !c) {
          return json({ error: cErr?.message || 'Invalid coupon' }, 400);
        }
        const value = Number(c.discount_value) || 0;
        discount = c.discount_type === 'percentage' ? (subtotal * value) / 100 : value;
        if (c.max_discount_amount != null) discount = Math.min(discount, Number(c.max_discount_amount));
        discount = Math.max(0, Math.min(discount, subtotal));
      }

      const payable = Math.max(1, total - discount);
      amountPaise = Math.round(payable * 100);
    } else {
      purpose = 'coins';
      const amountRupees = Number(body?.amount);
      if (!COIN_PACK_RUPEES.includes(amountRupees)) {
        return json({ error: 'Invalid coin pack' }, 400);
      }
      amountPaise = amountRupees * 100;
    }

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
        notes: {
          user_id: userId,
          trendra_order_id: orderId ?? '',
          purpose,
          coupon_code: couponCode ?? '',
          server_priced: '1',
        },
      }),
    });

    const rzpBody = await rzpRes.text();
    if (!rzpRes.ok) {
      console.error('Razorpay order create failed:', rzpRes.status, rzpBody);
      return json({ error: 'Razorpay order failed' }, 502);
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
    return json({ error: 'Internal error' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
