import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate caller is admin
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? '').trim();
    const message = String(body.message ?? '').trim();
    if (!title || !message || title.length > 200 || message.length > 5000) {
      return new Response(JSON.stringify({ error: 'Invalid title or message' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Collect recipients from auth.users
    const recipients: string[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      for (const u of data.users) if (u.email) recipients.push(u.email);
      if (data.users.length < 1000) break;
      page++;
      if (page > 20) break;
    }

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;color:#111">
        <h1 style="font-size:22px;margin:0 0 16px">${title.replace(/</g, '&lt;')}</h1>
        <p style="white-space:pre-wrap;line-height:1.6;font-size:15px">${message.replace(/</g, '&lt;')}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
        <p style="font-size:12px;color:#666">— Trendra</p>
      </div>`;

    let sent = 0;
    const CHUNK = 50;
    for (let i = 0; i < recipients.length; i += CHUNK) {
      const chunk = recipients.slice(i, i + CHUNK);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Trendra <onboarding@resend.dev>',
          to: ['onboarding@resend.dev'],
          bcc: chunk,
          subject: title,
          html,
        }),
      });
      if (res.ok) sent += chunk.length;
      else console.error('Resend chunk failed', res.status, await res.text());
    }

    return new Response(JSON.stringify({ sent, total: recipients.length }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
