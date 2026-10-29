// Confirms that what was paid on Razorpay still matches the Trendra order
// total stored in the database. create-razorpay-order records the order
// total and the payable amount (paise) in the Razorpay order notes; if the
// order total changed afterwards, or the paid amount differs, the payment
// must not confirm the order.
export function paidAmountMatchesOrder(
  dbOrderTotal: unknown,
  notes: Record<string, unknown> | null | undefined,
  paidPaise: unknown,
): boolean {
  const total = Number(dbOrderTotal);
  const paid = Number(paidPaise);
  if (!Number.isFinite(total) || total <= 0) return false;
  if (!Number.isInteger(paid) || paid <= 0) return false;

  const n = notes ?? {};
  const notedTotal = typeof n.order_total === 'string' ? n.order_total : null;
  const notedPaise = Number(n.amount_paise);

  if (notedTotal !== null && Number.isInteger(notedPaise)) {
    return notedTotal === total.toFixed(2) && notedPaise === paid;
  }

  // Razorpay orders created before amounts were recorded in notes: the
  // payment must cover the full order total (no discount assumed).
  return paid >= Math.round(total * 100);
}
