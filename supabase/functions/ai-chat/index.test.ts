// Smoke tests for ai-chat edge function.
// Validates the deployed function is reachable, handles CORS preflight,
// and rejects unauthenticated/invalid requests. Importing the module would
// boot Deno.serve, so we hit the live deployment via fetch instead — this
// also catches compile errors because a broken module fails to deploy.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;

Deno.test("ai-chat: OPTIONS returns CORS headers", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("ai-chat: missing Authorization returns 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ threadId: "x", messages: [] }),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("ai-chat: invalid bearer token returns 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ threadId: "x", messages: [] }),
  });
  await res.text();
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});
