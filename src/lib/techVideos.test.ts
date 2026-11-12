import { describe, expect, it } from 'vitest';
import { timeAgo } from './techVideos';
const now = Date.parse('2026-11-12T00:00:00Z');
describe('timeAgo', () => {
  it('days', () => expect(timeAgo('2026-11-09T00:00:00Z', now)).toBe('3 din pehle'));
  it('just now', () => expect(timeAgo('2026-11-11T23:59:30Z', now)).toBe('abhi abhi'));
});
