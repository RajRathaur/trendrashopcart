export function coinOrderMatches(order: any, payment: any, userId: string): boolean {
  return order?.notes?.purpose === 'coins' && order.notes.user_id === userId &&
    order.currency === 'INR' && payment.currency === 'INR' && payment.status === 'captured' &&
    payment.order_id === order.id && payment.amount === order.amount &&
    [1000, 2000, 5000, 10000].includes(order.amount);
}

export function promotionOrderMatches(order: any, payment: any, campaign: any, userId: string): boolean {
  return campaign.user_id === userId && order?.notes?.purpose === 'promotion' &&
    order.notes.user_id === userId && order.notes.campaign_id === campaign.id &&
    order.currency === 'INR' && payment.currency === 'INR' && payment.status === 'captured' &&
    payment.order_id === order.id && payment.amount === order.amount &&
    order.amount === Math.round(Number(campaign.amount_inr) * 100);
}