// Pages anyone can open without logging in. Everything else (cart, Buy Now,
// checkout, orders, games, profile, admin, seller, contact form…) needs a login.
// Read-only info and policy pages are public so Google and new shoppers can read them.
const PUBLIC_EXACT = [
  '/', '/products', '/login', '/forgot-password', '/reset-password',
  '/about', '/help', '/shipping', '/privacy-policy', '/refund-policy', '/shipping-policy',
  '/bazaar',
];

export const isPublicPath = (pathname: string): boolean => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (PUBLIC_EXACT.includes(path)) return true;
  // Product pages: /product/<id>; used-item ads: /bazaar/item/<id>
  return /^\/product\/[^/]+$/.test(path) || /^\/bazaar\/item\/[^/]+$/.test(path);
};

/** Login page URL that brings the shopper back to `returnTo` afterwards. */
export const loginPath = (returnTo: string): string =>
  `/login?redirect=${encodeURIComponent(returnTo)}`;
