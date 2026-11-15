// Exercise the deployed handler's logic with isolated provider/database doubles;
// no real payment, credentials or wallet data are used.
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { coinOrderMatches } from '../../supabase/functions/_shared/promotionPayment';

async function harness(purpose: string) {
  const purchases: Record<string, unknown>[] = [];
  const wallet = { id: 'wallet_demo', balance: 10, total_earned: 10 };
  let handler: (req: Request) => Promise<Response> = async () => new Response();
  const admin = { from: (table: string) => {
    const query: any = {
      select: () => query, eq: () => query,
      maybeSingle: async () => ({ data: table === 'coin_wallet' ? { ...wallet } : purchases[0] ?? null }),
      insert: async (row: Record<string, unknown>) => {
        if (purchases.length) return { error: { code: '23505' } };
        purchases.push(row); return { error: null };
      },
      update: (values: typeof wallet) => ({ eq: async () => { Object.assign(wallet, values); return { error: null }; } }),
    };
    return query;
  } };
  const client = { auth: { getClaims: async () => ({ data: { claims: { sub: 'user_demo' } }, error: null }) } };
  const order = { id: 'order_Demo', amount: 1000, currency: 'INR', notes: { purpose, user_id: 'user_demo' } };
  const payment = { id: 'pay_Demo', order_id: order.id, amount: 1000, currency: 'INR', status: 'captured' };
  const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('/payments/') ? payment : order), { status: 200 }));
  const source = readFileSync('supabase/functions/verify-coin-purchase/index.ts', 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/Deno\.env\.get\(([^)]+)\)!/g, 'Deno.env.get($1)');
  // TypeScript is transpiled before evaluating, using the project's existing toolchain.
  const { transpile, ScriptTarget, ModuleKind } = await import('typescript');
  const js = transpile(source, { target: ScriptTarget.ES2022, module: ModuleKind.None });
  new Function('createClient', 'coinOrderMatches', 'Deno', 'fetch', 'crypto', js)(
    vi.fn().mockReturnValueOnce(client).mockReturnValueOnce(admin).mockReturnValueOnce(client).mockReturnValueOnce(admin),
    coinOrderMatches,
    { env: { get: () => 'dummy-test-value' }, serve: (fn: typeof handler) => { handler = fn; } },
    fetchMock, webcrypto,
  );
  const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode('dummy-test-value'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode('order_Demo|pay_Demo'));
  const signature = [...new Uint8Array(signed)].map(n => n.toString(16).padStart(2, '0')).join('');
  const request = () => new Request('http://localhost/verify', { method: 'POST', headers: { Authorization: 'Bearer dummy-test-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpay_order_id: order.id, razorpay_payment_id: payment.id, razorpay_signature: signature }) });
  return { run: () => handler(request()), wallet, purchases };
}

describe('coin verification handler', () => {
  it('rejects a correctly signed captured promotion without creating a coin record or changing the wallet', async () => {
    const h = await harness('promotion');
    expect((await h.run()).status).toBe(400);
    expect(h.purchases).toHaveLength(0);
    expect(h.wallet.balance).toBe(10);
  });
  it('credits a ₹10 coin purchase once, including when the same payment is verified again', async () => {
    const h = await harness('coins');
    expect(await (await h.run()).json()).toMatchObject({ verified: true, coins: 1000 });
    expect(await (await h.run()).json()).toMatchObject({ verified: true, already_credited: true });
    expect(h.purchases).toHaveLength(1);
    expect(h.wallet.balance).toBe(1010);
    expect(h.wallet.total_earned).toBe(1010);
  });
});