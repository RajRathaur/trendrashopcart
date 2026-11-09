import { describe, expect, it } from 'vitest';
import { checkTechVideo, searchTerm } from '../techVideos';
describe('Technical video limits', () => {
  it('accepts 30 minutes and rejects longer videos', () => {
    expect(checkTechVideo({ type: 'video/mp4', size: 100 }, 1800)).toBeNull();
    expect(checkTechVideo({ type: 'video/mp4', size: 100 }, 1801)).not.toBeNull();
  });
  it('accepts 500MB and rejects larger files', () => {
    expect(checkTechVideo({ type: 'video/mp4', size: 500 * 1024 * 1024 }, 60)).toBeNull();
    expect(checkTechVideo({ type: 'video/mp4', size: 500 * 1024 * 1024 + 1 }, 60)).not.toBeNull();
  });
  it('rejects non-video uploads', () => {
    expect(checkTechVideo({ type: 'text/html', size: 100 }, 60)).not.toBeNull();
  });
  it('removes query control characters', () => { expect(searchTerm('raj%,(test)')).toBe('rajtest'); });
});