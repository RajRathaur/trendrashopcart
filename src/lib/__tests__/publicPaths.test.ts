import { describe, expect, it } from 'vitest';
import { isPublicPath, loginPath } from '../publicPaths';

describe('isPublicPath', () => {
  it('opens the home page without login', () => {
    expect(isPublicPath('/')).toBe(true);
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

  it.each(['/cart', '/checkout', '/cod-checkout', '/orders', '/order/123', '/ludo', '/hill-climb', '/spin-wheel', '/fruit-game', '/dead-roads', '/redeem', '/wishlist', '/admin', '/product', '/contact', '/become-seller'])(
    'keeps %s behind login',
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );
});

describe('loginPath', () => {
  it('sends the shopper back to the product after login', () => {
    expect(loginPath('/product/abc')).toBe('/login?redirect=%2Fproduct%2Fabc');
  });
});
