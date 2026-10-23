// Shared daily-limit rules for the AI Pro Try-On (used by the edge function and the shop UI).

/** AI Pro Try-Ons each customer gets per day (India time). */
export const AI_TRYON_DAILY_LIMIT = 5;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Start of the current day in India (IST, UTC+5:30), as a UTC Date. */
export function istDayStart(now: Date = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

/** How many AI try-ons are left today given how many were already used. */
export function remainingTryOns(usedToday: number, limit = AI_TRYON_DAILY_LIMIT): number {
  return Math.max(0, limit - Math.max(0, Math.floor(usedToday)));
}

/** Picks the output size closest to the customer's photo shape. */
export function outputSizeFor(aspect: number): '1024x1536' | '1536x1024' | '1024x1024' {
  if (!Number.isFinite(aspect) || aspect <= 0) return '1024x1536';
  if (aspect >= 1.2) return '1024x1536';
  if (aspect <= 0.83) return '1536x1024';
  return '1024x1024';
}
