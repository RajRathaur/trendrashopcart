/** Bulk/pack pricing: e.g. [{qty:10, price:60}] means 10 units together cost ₹60. */
export interface PriceTier {
  qty: number;
  price: number;
}

export const parseTiers = (raw: unknown): PriceTier[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t: any) => ({ qty: Number(t?.qty), price: Number(t?.price) }))
    .filter((t) => Number.isFinite(t.qty) && t.qty > 1 && Number.isFinite(t.price) && t.price > 0)
    .sort((a, b) => b.qty - a.qty);
};

/** Cheapest total for `quantity` units using packs (largest first) + single unit price for the rest. */
export const getLineTotal = (
  product: { price?: number | null; price_tiers?: unknown } | null | undefined,
  quantity: number,
): number => {
  const unit = Number(product?.price ?? 0);
  const tiers = parseTiers(product?.price_tiers);
  let remaining = Math.max(0, quantity);
  let total = 0;
  for (const t of tiers) {
    // Only use a pack if it is actually cheaper than buying singles
    if (t.price >= unit * t.qty) continue;
    const packs = Math.floor(remaining / t.qty);
    if (packs > 0) {
      total += packs * t.price;
      remaining -= packs * t.qty;
    }
  }
  return Math.round((total + remaining * unit) * 100) / 100;
};
