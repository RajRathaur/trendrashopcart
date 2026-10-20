import { describe, it, expect } from 'vitest';
import { defaultSaleWindow, getSaleStatus, getTimeLeft } from '../festivalSale';

const now = new Date('2026-10-20T10:00:00Z');
const h = (n: number) => new Date(now.getTime() + n * 3600_000);

describe('festival sale', () => {
  it('default sale window lasts exactly 24 hours', () => {
    const w = defaultSaleWindow(now);
    expect(w.endAt.getTime() - w.startAt.getTime()).toBe(24 * 3600_000);
  });

  it('is live when switched on and before end time', () => {
    expect(getSaleStatus({ enabled: true, startAt: h(-1), endAt: h(5) }, now)).toBe('live');
  });

  it('ends automatically once end time passes', () => {
    expect(getSaleStatus({ enabled: true, startAt: h(-30), endAt: h(-6) }, now)).toBe('ended');
  });

  it('waits until admin-set start time', () => {
    expect(getSaleStatus({ enabled: true, startAt: h(2), endAt: h(26) }, now)).toBe('scheduled');
  });

  it('stays hidden when admin switches it off', () => {
    expect(getSaleStatus({ enabled: false, startAt: h(-1), endAt: h(5) }, now)).toBe('off');
  });

  it('counts down hours, minutes and seconds', () => {
    const end = new Date(now.getTime() + (23 * 3600 + 59 * 60 + 30) * 1000);
    expect(getTimeLeft(end, now)).toEqual({ days: 0, hours: 23, minutes: 59, seconds: 30 });
  });
});
