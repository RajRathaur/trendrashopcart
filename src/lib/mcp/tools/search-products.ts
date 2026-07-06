import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search Trendra's product catalog by keywords, with optional min/max price (INR). Returns up to 10 active products.",
  inputSchema: {
    query: z.string().describe("Free-text search across name and description, e.g. 'red kurta'"),
    minPrice: z.number().optional().describe("Minimum price in INR"),
    maxPrice: z.number().optional().describe("Maximum price in INR"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, minPrice, maxPrice }) => {
    let q = db()
      .from("products")
      .select("id,name,slug,price,mrp,discount_percent,images,description,stock")
      .eq("is_active", true)
      .limit(10);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (typeof minPrice === "number") q = q.gte("price", minPrice);
    if (typeof maxPrice === "number") q = q.lte("price", maxPrice);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
