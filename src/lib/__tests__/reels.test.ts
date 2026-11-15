import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { getReelFeedSelect } from '../reels';

describe('Reel feed privacy', () => {
  it('loads public reels and products without accessing private profiles', () => {
    const select = getReelFeedSelect(false);
    expect(select).toContain('product:products(id, name, price, images)');
    expect(select).not.toContain('social_profiles');
    expect(select).not.toContain('author:');
  });

  it('loads author information through profile access rules only after login', () => {
    expect(getReelFeedSelect(true)).toContain(
      'author:social_profiles!reels_user_id_fkey(user_id, username, display_name, avatar_url)',
    );
  });
});