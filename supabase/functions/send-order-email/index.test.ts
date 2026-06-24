// Smoke tests for send-order-email edge function.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/send-order-email`;

Deno.test("send-order-email: OPTIONS returns CORS headers", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS" });
  await res.text();
  assert(res.status === 200 || res.status === 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("send-order-email: missing Authorization returns 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  await res.text();
  assertEquals(res.status, 401);
});

Deno.test("send-order-email: invalid bearer returns 401", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer invalid-token",
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      orderNumber: "T1",
      status: "confirmed",
      totalAmount: 100,
      shippingCity: "X",
      shippingState: "Y",
      customerUserId: "00000000-0000-0000-0000-000000000000",
    }),
  });
  await res.text();
  assertEquals(res.status, 401);
});
