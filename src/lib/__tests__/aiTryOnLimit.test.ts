import { describe, expect, it } from 'vitest';
import {
  AI_TRYON_DAILY_LIMIT,
  istDayStart,
  outputSizeFor,
  remainingTryOns,
} from '../../../supabase/functions/ai-tryon/limit';

describe('AI Pro Try-On daily limit', () => {
  it('allows 5 AI try-ons per customer per day', () => {
    expect(AI_TRYON_DAILY_LIMIT).toBe(5);
    expect(remainingTryOns(0)).toBe(5);
    expect(remainingTryOns(4)).toBe(1);
    expect(remainingTryOns(5)).toBe(0);
    expect(remainingTryOns(9)).toBe(0);
  });

  it('resets at midnight India time, not UTC', () => {
    // 23 Oct 2026, 20:25 IST = 14:55 UTC → day started 22 Oct 18:30 UTC.
    expect(istDayStart(new Date('2026-10-23T14:55:00Z')).toISOString()).toBe('2026-10-22T18:30:00.000Z');
    // 00:10 IST on 24 Oct = 18:40 UTC on 23 Oct → new day.
    expect(istDayStart(new Date('2026-10-23T18:40:00Z')).toISOString()).toBe('2026-10-23T18:30:00.000Z');
  });

  it('picks a portrait output for a standing full-body photo', () => {
    expect(outputSizeFor(1.6)).toBe('1024x1536');
    expect(outputSizeFor(0.6)).toBe('1536x1024');
    expect(outputSizeFor(1)).toBe('1024x1024');
  });
});
