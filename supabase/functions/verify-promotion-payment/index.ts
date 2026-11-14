import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@4';
import { promotionOrderMatches } from '../_shared/promotionPayment.ts';

const schema = z.object({ campaign_id: z.string().uuid(), razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/), razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/), razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = Deno.env.get('SUPABASE_URL'); const anon = Deno.env.get('SUPABASE_ANON_KEY'); const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const keyId = Deno.env.get('RAZORPAY_KEY_ID'); const secret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!url || !anon || !service || !keyId || !secret) return json({ error: 'Payment unavailable' }, 503);
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Login required' }, 401);
    const client = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data, error } = await client.auth.getClaims(authorization.slice(7));
    if (error || !data?.claims?.sub) return json({ error: 'Login required' }, 401);
    const userId = String(data.claims.sub);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: 'Invalid payment details' }, 400);
    const b = parsed.data;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${b.razorpay_order_id}|${b.razorpay_payment_id}`));
    const expected = [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
    let difference = 0; for (let i = 0; i < 64; i++) difference |= expected.charCodeAt(i) ^ b.razorpay_signature.charCodeAt(i);
    if (difference) return json({ error: 'Invalid signature' }, 400);
    const admin = createClient(url, service);
    const { data: campaign, error: ce } = await admin.from('video_campaigns').select('*').eq('id', b.campaign_id).eq('user_id', userId).maybeSingle();
    if (ce || !campaign) return json({ error: 'Campaign missing' }, 404);
    const headers = { Authorization: `Basic ${btoa(`${keyId}:${secret}`)}` };
    const [o, p] = await Promise.all([fetch(`https://api.razorpay.com/v1/orders/${b.razorpay_order_id}`, { headers }), fetch(`https://api.razorpay.com/v1/payments/${b.razorpay_payment_id}`, { headers })]);
    if (!o.ok || !p.ok) return json({ error: 'Payment check unavailable; retry verification' }, 502);
    if (!promotionOrderMatches(await o.json(), await p.json(), campaign, userId)) return json({ error: 'Payment does not match campaign' }, 400);
    if (campaign.payment_status === 'paid') return campaign.razorpay_payment_id === b.razorpay_payment_id ? json({ verified: true }) : json({ error: 'Campaign already paid with another payment; contact admin' }, 409);
    const { data: updated, error: ue } = await admin.from('video_campaigns').update({ payment_status: 'paid', razorpay_payment_id: b.razorpay_payment_id }).eq('id', campaign.id).eq('payment_status', 'unpaid').select('id');
    if (ue) return json({ error: 'Could not save payment; retry verification' }, 500);
    if (!updated?.length) {
      const { data: saved } = await admin.from('video_campaigns').select('razorpay_payment_id').eq('id', campaign.id).single();
      if (saved?.razorpay_payment_id !== b.razorpay_payment_id) return json({ error: 'Another payment was recorded; contact admin' }, 409);
    }
    return json({ verified: true });
  } catch { return json({ error: 'Payment verification unavailable; retry' }, 500); }
});