// AI product listing suggester: image -> title, description, category
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const { imageUrl, categories, hint } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") return json({ error: "imageUrl required" }, 400);
    const cats: string[] = Array.isArray(categories) ? categories.slice(0, 100).map(String) : [];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    const prompt = `You write product listings for Trendra, an Indian e-commerce store.
Look at the product photo and return:
- title: catchy, specific, max 80 chars (brand if visible, type, key feature, color)
- description: 60-120 words, benefits + features, simple English, no fake claims
- category: exactly one of [${cats.join(", ")}] (best match)
- tags: 3-6 short keywords
${hint ? `Seller note: ${String(hint).slice(0, 300)}` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [{ role: "user", content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: imageUrl },
        ] }],
        text: { format: { type: "json_schema", name: "listing", strict: true, schema: {
          type: "object", additionalProperties: false,
          required: ["title", "description", "category", "tags"],
          properties: {
            title: { type: "string" }, description: { type: "string" },
            category: { type: "string" }, tags: { type: "array", items: { type: "string" } },
          },
        } } },
      }),
    });

    if (!res.ok || !res.body) {
      const t = await res.text();
      console.error("gateway", res.status, t);
      const msg = res.status === 429 ? "Bahut requests — thodi der baad try karein."
        : res.status === 402 ? "AI credits khatam ho gaye hain."
        : "AI suggestion nahi mil paya.";
      return json({ error: msg }, res.status);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
          if (ev.type === "error" || ev.type === "response.failed") {
            return json({ error: "AI suggestion nahi mil paya." }, 502);
          }
        } catch { /* ignore */ }
      }
    }
    const parsed = JSON.parse(out);
    return json(parsed);
  } catch (e) {
    console.error("ai-product-suggest", e);
    return json({ error: "AI suggestion nahi mil paya." }, 500);
  }
});
