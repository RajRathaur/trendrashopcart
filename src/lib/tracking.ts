export const COURIER_OPTIONS = [
  'Flipkart/Ekart',
  'Delhivery',
  'BlueDart',
  'IndiaPost',
] as const;

export type CourierName = (typeof COURIER_OPTIONS)[number] | string;

export function getTrackingUrl(courier: string | null | undefined, awb: string | null | undefined): string | null {
  if (!awb || !awb.trim()) return null;
  const num = awb.trim();
  if (courier === 'Flipkart/Ekart') {
    return `https://ekartlogistics.com/shipment/${encodeURIComponent(num)}`;
  }
  const c = courier?.trim() || 'courier';
  return `https://www.google.com/search?q=${encodeURIComponent(`${c} tracking ${num}`)}`;
}
