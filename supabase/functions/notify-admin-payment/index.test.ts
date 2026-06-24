// Smoke tests for notify-admin-payment edge function.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/notify-admin-payment`;

Deno.test("notify-admin-payment: OPTIONS returns CORS headers", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS" });
  await res.text();
  assert(res.status === 200 || res.status === 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("notify-admin-payment: missing Authorization is rejected", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  await res.text();
  assert(res.status >= 400 && res.status < 500, `expected 4xx, got ${res.status}`);
});

Deno.test("notify-admin-payment: invalid bearer is rejected", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ customerName: "Test", productName: "X", paymentAmount: 100 }),
  });
  await res.text();
  assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`);
});
