// AI Pro Try-On: dresses the customer's uploaded photo in the product garment.
// The garment photo always comes from the product record, never from the client.
// Customer photos are sent to the AI only for this one request and are not stored.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { editImage, GatewayError } from 'npm:@lovable.dev/ai-gateway@0.1.8';
import { AI_TRYON_DAILY_LIMIT, istDayStart, outputSizeFor, remainingTryOns } from './limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const PROMPT = `You are a professional fashion photo retoucher for an online clothing store.
Image 1 is a photo of a real customer. Image 2 is the product photo of a garment.
Dress the customer from image 1 in the exact garment from image 2, fully replacing the top they are currently wearing so none of the old top shows.
Keep the customer's face, identity, hair, skin tone, body shape, pose, hands, background, camera angle and lighting exactly as in image 1.
Reproduce the garment faithfully: same colour, fabric, neckline, sleeve length, print, logo and text placement. Fit it naturally to the body with realistic folds, drape, seams, shadows and highlights that match the scene lighting.
Photorealistic, high quality catalogue look. Do not add any extra text, watermark, or accessories.`;

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Please log in to use AI Try-On.' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
  if (claimsErr || !claims?.claims?.sub) return json({ error: 'Please log in to use AI Try-On.' }, 401);
  const userId = claims.claims.sub as string;

  const body = await req.json().catch(() => null);
  const productId = body?.productId;
  const photo = body?.photo;
  const garmentIndex = Number.isInteger(body?.garmentIndex) ? body.garmentIndex : 0;
  const aspect = Number(body?.aspect);
  if (typeof productId !== 'string' || !UUID.test(productId)) return json({ error: 'Invalid product' }, 400);
  if (typeof photo !== 'string' || photo.length < 100 || !/^[A-Za-z0-9+/=]+$/.test(photo)) {
    return json({ error: 'Please upload a JPG photo.' }, 400);
  }
  if (photo.length * 0.75 > MAX_PHOTO_BYTES) return json({ error: 'Photo is too large.' }, 400);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: product } = await admin
    .from('products')
    .select('id, name, images, is_active')
    .eq('id', productId)
    .maybeSingle();
  const images: string[] = product?.images ?? [];
  if (!product || product.is_active === false || !images.length) return json({ error: 'Product not found' }, 404);
  const garmentUrl = images[Math.min(Math.max(0, garmentIndex), images.length - 1)];

  // Daily limit (India time). Failed attempts are not counted.
  const { count } = await admin
    .from('ai_tryon_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'failed')
    .gte('created_at', istDayStart().toISOString());
  const used = count ?? 0;
  if (remainingTryOns(used) <= 0) {
    return json({ error: `Aaj ke ${AI_TRYON_DAILY_LIMIT} AI Try-On ho gaye. Kal phir try karein.`, remaining: 0 }, 429);
  }

  const { data: usage, error: usageErr } = await admin
    .from('ai_tryon_usage')
    .insert({ user_id: userId, product_id: productId, status: 'started' })
    .select('id')
    .single();
  if (usageErr || !usage) {
    console.error('usage insert failed', usageErr);
    return json({ error: 'AI Try-On abhi shuru nahi ho paya.' }, 500);
  }
  const markUsage = (status: 'done' | 'failed') =>
    admin.from('ai_tryon_usage').update({ status }).eq('id', usage.id);

  try {
    const garmentRes = await fetch(garmentUrl);
    if (!garmentRes.ok) throw new Error(`garment fetch ${garmentRes.status}`);
    const garmentType = garmentRes.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    const garmentBlob = new Blob([await garmentRes.arrayBuffer()], { type: garmentType });
    const personBlob = new Blob([decodeBase64(photo)], { type: 'image/jpeg' });

    const result = await editImage({
      model: 'openai/gpt-image-2.5-sunburst',
      prompt: PROMPT,
      image: [personBlob, garmentBlob],
      size: outputSizeFor(aspect),
      quality: 'medium',
      output_format: 'jpeg',
      user: userId,
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('no image returned');

    await markUsage('done');
    return json({ image: `data:image/jpeg;base64,${b64}`, remaining: remainingTryOns(used + 1) });
  } catch (e) {
    await markUsage('failed');
    if (e instanceof GatewayError) {
      console.error('ai-tryon gateway', e.code, e.httpStatus, e.ids);
      if (e.httpStatus === 429) return json({ error: 'Abhi bahut log try kar rahe hain. Thodi der baad try karein.' }, 429);
      if (e.httpStatus === 402) return json({ error: 'AI Try-On abhi band hai. Baad me try karein.' }, 402);
      if (e.httpStatus === 400) return json({ error: 'Is photo par AI Try-On nahi ho paya. Doosri photo try karein.' }, 400);
    } else {
      console.error('ai-tryon', e);
    }
    return json({ error: 'AI Try-On nahi ho paya. Dobara try karein.' }, 502);
  }
});
