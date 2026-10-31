import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

import { formatBazaarPrice, validateBazaarListing } from '../bazaar';

const valid = {
  title: 'Purani cycle',
  description: 'Achhi haalat',
  price: 2500,
  category: 'sports',
  condition: 'good',
  city: 'Jaipur',
  state: '',
  images: ['https://x.supabase.co/storage/v1/object/public/product-images/bazaar/u/1.jpg'],
};

describe('validateBazaarListing', () => {
  it('accepts a complete ad', () => {
    expect(validateBazaarListing(valid).ok).toBe(true);
  });

  it('requires at least one photo', () => {
    expect(validateBazaarListing({ ...valid, images: [] }).ok).toBe(false);
  });

  it('allows at most 8 photos', () => {
    expect(validateBazaarListing({ ...valid, images: Array(9).fill(valid.images[0]) }).ok).toBe(false);
  });

  it('rejects prices above ₹1 crore', () => {
    expect(validateBazaarListing({ ...valid, price: 10_000_001 }).ok).toBe(false);
  });

  it('rejects negative prices', () => {
    expect(validateBazaarListing({ ...valid, price: -1 }).ok).toBe(false);
  });

  it('requires a city', () => {
    expect(validateBazaarListing({ ...valid, city: ' ' }).ok).toBe(false);
  });

  it('rejects unknown categories', () => {
    expect(validateBazaarListing({ ...valid, category: 'weapons' }).ok).toBe(false);
  });
});

describe('formatBazaarPrice', () => {
  it('shows 0 as Free and formats Indian rupees', () => {
    expect(formatBazaarPrice(0)).toBe('Free');
    expect(formatBazaarPrice(125000)).toBe('₹1,25,000');
  });
});
