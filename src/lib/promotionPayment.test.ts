import { describe, it, expect } from 'vitest';
import { coinOrderMatches, promotionOrderMatches } from '../../supabase/functions/_shared/promotionPayment';
const campaign = { id: 'c', user_id: 'u', amount_inr: 99 };
const order = { id: 'order_1', notes: { purpose: 'promotion', user_id: 'u', campaign_id: 'c' }, currency: 'INR', amount: 9900 };
const payment = { order_id: 'order_1', currency: 'INR', status: 'captured', amount: 9900 };
describe('promotion payment isolation', () => {
  it('accepts a captured ₹99 campaign payment', () => expect(promotionOrderMatches(order, payment, campaign, 'u')).toBe(true));
  it('rejects a payment with a different amount', () => expect(promotionOrderMatches(order, { ...payment, amount: 1000 }, campaign, 'u')).toBe(false));
  it('rejects another user', () => expect(promotionOrderMatches(order, payment, campaign, 'other')).toBe(false));
  it('rejects another campaign', () => expect(promotionOrderMatches(order, payment, { ...campaign, id: 'other' }, 'u')).toBe(false));
  it('requires captured status', () => expect(promotionOrderMatches(order, { ...payment, status: 'authorized' }, campaign, 'u')).toBe(false));
  it('does not credit promotion payments as coins', () => expect(coinOrderMatches(order, payment, 'u')).toBe(false));
  it.each([1000, 2000, 5000, 10000])('rejects promotion payments even at coin-pack amount %i paise', amount => {
    expect(coinOrderMatches({ ...order, amount }, { ...payment, amount }, 'u')).toBe(false);
  });
  it.each([[3, 99], [7, 199], [30, 699]])('accepts a captured %i-day ₹%i campaign', (_days, rupees) => {
    const amount = rupees * 100;
    expect(promotionOrderMatches({ ...order, amount }, { ...payment, amount }, { ...campaign, amount_inr: rupees }, 'u')).toBe(true);
  });
  it('rejects coin payments as promotion payments', () => {
    expect(promotionOrderMatches({ ...order, notes: { ...order.notes, purpose: 'coins' } }, payment, campaign, 'u')).toBe(false);
  });
  it('rejects a payment attached to a different Razorpay order', () => {
    expect(promotionOrderMatches(order, { ...payment, order_id: 'order_other' }, campaign, 'u')).toBe(false);
  });
  it('rejects non-INR payments', () => {
    expect(promotionOrderMatches(order, { ...payment, currency: 'USD' }, campaign, 'u')).toBe(false);
  });
  it('accepts the ₹10 coin pack only for its owner', () => {
    const coinOrder = { ...order, notes: { purpose: 'coins', user_id: 'u' }, amount: 1000 };
    expect(coinOrderMatches(coinOrder, { ...payment, amount: 1000 }, 'u')).toBe(true);
    expect(coinOrderMatches(coinOrder, { ...payment, amount: 1000 }, 'other')).toBe(false);
  });
});