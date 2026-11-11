import { describe, expect, it } from 'vitest';
import { isPublicPath, loginPath } from '../publicPaths';

describe('isPublicPath', () => {
  it('opens the home page without login', () => {
    expect(isPublicPath('/')).toBe(true);
  });

  it('opens the shop page without login', () => {
    expect(isPublicPath('/shop')).toBe(true);
  });

  it('opens the product list without login', () => {
    expect(isPublicPath('/products')).toBe(true);
  });

  it('opens product pages without login', () => {
    expect(isPublicPath('/product/ed797879-2731-4a89-b786-689856d57b1c')).toBe(true);
  });

  it.each(['/about', '/help', '/privacy-policy', '/refund-policy', '/shipping-policy'])(
    'opens info page %s without login',
    (path) => {
      expect(isPublicPath(path)).toBe(true);
    },
  );

  it.each(['/cart', '/checkout', '/cod-checkout', '/orders', '/order/123', '/ludo', '/hill-climb', '/spin-wheel', '/fruit-game', '/dead-roads', '/redeem', '/wishlist', '/admin', '/product', '/contact', '/become-seller', '/bazaar/sell', '/bazaar/my-ads', '/bazaar/chats', '/bazaar/chats/abc', '/bazaar/edit/abc', '/admin/bazaar'])(
    'keeps %s behind login',
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );

  it('opens the used-items Bazaar and its ads without login', () => {
    expect(isPublicPath('/bazaar')).toBe(true);
    expect(isPublicPath('/bazaar/item/ed797879-2731-4a89-b786-689856d57b1c')).toBe(true);
  });
});

describe('Reels pages', () => {
  it('opens the reels feed and a single reel without login', () => {
    expect(isPublicPath('/reels')).toBe(true);
    expect(isPublicPath('/reels/ed797879-2731-4a89-b786-689856d57b1c')).toBe(true);
    expect(isPublicPath('/u/trendra_1234')).toBe(false);
  });

  it.each(['/reels/upload', '/reels/search', '/u/me', '/admin/reels', '/u', '/videos/upload', '/creator/earnings', '/admin/videos', '/admin/creators'])('keeps %s behind login', (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe('Technical videos', () => {
  it('allows public watching', () => {
    expect(isPublicPath('/videos')).toBe(true);
    expect(isPublicPath('/videos/123')).toBe(true);
  });
});

describe('loginPath', () => {
  it('sends the shopper back to the product after login', () => {
    expect(loginPath('/product/abc')).toBe('/login?redirect=%2Fproduct%2Fabc');
  });
});
