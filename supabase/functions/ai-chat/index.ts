// AI shopping assistant streaming chat
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "npm:ai";
import { z } from "npm:zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Trendra's friendly shopping assistant for an Indian e-commerce app.
- Greet customers warmly. Reply in the same language the user writes in (Hindi, Hinglish, or English).
- Help them discover products in our catalog. Whenever the user describes what they want (e.g. "blue running shoes under 2000"), CALL the search_products tool. Do not invent products.
- After search results, recommend 1-4 best matches with short bullet points: name, price (₹), and why it fits. Include the product link as /product/<id>.
- If results are empty, suggest alternatives or ask a clarifying question.
- Keep replies short, helpful, and friendly. Use simple markdown.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const threadId: string = body.threadId;
    const clientMessages: unknown[] = Array.isArray(body.messages) ? body.messages : [];
    if (!threadId || typeof threadId !== "string") {
      return new Response("threadId required", { status: 400, headers: corsHeaders });
    }

    // Verify thread ownership
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id,user_id,title")
      .eq("id", threadId)
      .single();
    if (!thread || thread.user_id !== userId) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // Conversation history comes only from what the server saved earlier.
    // From the client we accept just the newest message, forced to the
    // "user" role with text-only parts, so callers cannot forge assistant
    // or system turns.
    const { data: saved } = await supabase
      .from("chat_messages")
      .select("role,content,created_at")
      .eq("thread_id", threadId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(100);
    const history: UIMessage[] = (saved ?? [])
      .filter((m: any) => (m.role === "user" || m.role === "assistant") && m.content && typeof m.content === "object")
      .map((m: any) => ({ ...(m.content as UIMessage), role: m.role }));

    const rawLast = clientMessages[clientMessages.length - 1] as any;
    let newUserMsg: UIMessage | null = null;
    if (rawLast && rawLast.role === "user" && Array.isArray(rawLast.parts)) {
      const text = rawLast.parts
        .filter((p: any) => p && p.type === "text" && typeof p.text === "string")
        .map((p: any) => p.text)
        .join("\n")
        .slice(0, 4000)
        .trim();
      if (text) {
        newUserMsg = {
          id: typeof rawLast.id === "string" ? rawLast.id.slice(0, 100) : crypto.randomUUID(),
          role: "user",
          parts: [{ type: "text", text }],
        } as UIMessage;
      }
    }
    const alreadySaved = newUserMsg && history.some((m) => m.id === newUserMsg!.id);
    const messages: UIMessage[] = newUserMsg && !alreadySaved ? [...history, newUserMsg] : history;

    // Persist the latest user message
    if (newUserMsg && !alreadySaved) {
      const lastMsg = newUserMsg;
      await supabase.from("chat_messages").insert({
        thread_id: threadId,
        user_id: userId,
        role: "user",
        content: lastMsg as unknown as Record<string, unknown>,
      });

      // Auto-title from first user message
      if (thread.title === "New chat") {
        const text = (lastMsg.parts ?? [])
          .map((p: any) => (p.type === "text" ? p.text : ""))
          .join(" ")
          .trim()
          .slice(0, 60);
        if (text) {
          await supabase.from("chat_threads").update({ title: text, last_message_at: new Date().toISOString() }).eq("id", threadId);
        }
      } else {
        await supabase.from("chat_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
      }
    }

    if (messages.length === 0) {
      return new Response("message required", { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });

    const provider = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": apiKey },
    });

    const tools = {
      search_products: tool({
        description: "Search the Trendra product catalog by keywords, category, or price range. Returns up to 8 matching products.",
        inputSchema: z.object({
          query: z.string().describe("Free-text search keywords like 'red kurta' or 'wireless earbuds'"),
          maxPrice: z.number().optional().describe("Maximum price in INR"),
          minPrice: z.number().optional().describe("Minimum price in INR"),
        }),
        execute: async ({ query, maxPrice, minPrice }) => {
          let q = supabase
            .from("products")
            .select("id,name,slug,price,mrp,discount_percent,images,category_id,description,stock")
            .eq("is_active", true)
            .limit(8);
          // Keep only letters, numbers, spaces and hyphens so the text can't
          // change the filter (commas, dots, brackets, wildcards are removed).
          const term = String(query ?? "")
            .replace(/[^\p{L}\p{N}\s-]/gu, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
          if (term) q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
          if (Number.isFinite(maxPrice)) q = q.lte("price", maxPrice);
          if (Number.isFinite(minPrice)) q = q.gte("price", minPrice);
          const { data, error } = await q;
          if (error) return { error: "Search failed", products: [] };
          return { products: data ?? [] };
        },
      }),
    };

    const result = streamText({
      model: provider("google/gemini-3-flash-preview"),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      headers: corsHeaders,
      onFinish: async ({ responseMessage }) => {
        try {
          await supabase.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "assistant",
            content: responseMessage as unknown as Record<string, unknown>,
          });
          await supabase.from("chat_threads").update({ last_message_at: new Date().toISOString() }).eq("id", threadId);
        } catch (e) {
          console.error("save assistant msg failed", e);
        }
      },
    });
  } catch (e) {
    console.error("ai-chat error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
