import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const QIKINK_CLIENT_ID = '954239018677672';
const QIKINK_BASE = 'https://api.qikink.com';

async function getQikInkToken(clientSecret: string): Promise<string> {
  // QikInk token endpoint expects form-urlencoded ClientId + client_secret
  const params = new URLSearchParams();
  params.append('ClientId', QIKINK_CLIENT_ID);
  params.append('client_secret', clientSecret);
  const res = await fetch(`${QIKINK_BASE}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`QikInk token failed (${res.status}): ${text.slice(0, 200)}`);
  let data: any = {};
  try { data = JSON.parse(text); } catch { /* ignore */ }
  const token = data.Accesstoken || data.access_token;
  if (!token) throw new Error(`QikInk token missing: ${text.slice(0, 200)}`);
  return token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const clientSecret = Deno.env.get('QIKINK_CLIENT_SECRET');
    if (!clientSecret) {
      return new Response(JSON.stringify({ error: 'QikInk Client Secret configured nahi hai' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth: admin only
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Input
    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.order_id === 'string' ? body.order_id : null;
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch order + items
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, order_number, total_amount, status, payment_method, shipping_address, shipping_city, shipping_state, shipping_pincode, shipping_phone, user_id')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: items, error: itemsErr } = await admin
      .from('order_items')
      .select('product_name, quantity, price, size, color')
      .eq('order_id', orderId);
    if (itemsErr || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Order items not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Customer name from profile
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('user_id', order.user_id)
      .maybeSingle();
    const fullName = (profile?.full_name || 'Trendra Customer').trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '.';

    const token = await getQikInkToken(clientSecret);

    const { data: authUser } = await admin.auth.admin.getUserById(order.user_id);
    const orderNumber = String(order.order_number || order.id).replace(/[^A-Za-z0-9]/g, '').slice(-15);

    const payload = {
      order_number: orderNumber,
      qikink_shipping: '1',
      gateway: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      total_order_value: String(order.total_amount),
      line_items: items.map((item: any) => ({
        search_from_my_products: 1,
        quantity: String(item.quantity),
        price: String(item.price),
        sku: `${item.product_name}${item.size ? '-' + item.size : ''}${item.color ? '-' + item.color : ''}`.slice(0, 60),
      })),
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address1: order.shipping_address || 'N/A',
        address2: '',
        phone: (order.shipping_phone || '').replace(/\D/g, '').slice(-10),
        email: authUser?.user?.email || 'orders@trendra.store',
        city: order.shipping_city || 'N/A',
        zip: order.shipping_pincode || '000000',
        province: order.shipping_state || 'N/A',
        country_code: 'IN',
      },
    };

    const qikRes = await fetch(`${QIKINK_BASE}/api/order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ClientId: QIKINK_CLIENT_ID,
        Accesstoken: token,
      },
      body: JSON.stringify(payload),
    });
    const qikText = await qikRes.text();
    let qikData: any = null;
    try { qikData = JSON.parse(qikText); } catch { /* non-JSON */ }

    if (!qikRes.ok || /no store is linked/i.test(qikText)) {
      if (/no store is linked/i.test(qikText)) {
        return new Response(JSON.stringify({
          error: 'QikInk account me koi store linked nahi hai. QikInk dashboard → Integration → Custom API me Live API access request karein / Custom API store add karein.',
          detail: qikText.slice(0, 500),
        }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        error: `QikInk order failed (${qikRes.status})`,
        detail: qikText.slice(0, 500),
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, qikink: qikData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
