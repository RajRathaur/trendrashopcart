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

Deno.test("notify-admin-payment: missing Authorization returns 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("notify-admin-payment: invalid bearer returns 401", async () => {
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
  assertEquals(res.status, 401);
});
