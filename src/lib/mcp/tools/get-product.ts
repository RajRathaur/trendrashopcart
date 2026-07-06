import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description: "Fetch full details of a single product by its slug or id.",
  inputSchema: {
    slugOrId: z.string().describe("Product slug (preferred) or UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slugOrId }) => {
    const client = db();
    const isUuid = /^[0-9a-f-]{36}$/i.test(slugOrId);
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq(isUuid ? "id" : "slug", slugOrId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Product not found" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { product: data },
    };
  },
});
