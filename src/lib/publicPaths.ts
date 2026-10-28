// Pages anyone can open without logging in. Everything else (cart, Buy Now,
// checkout, orders, games, profile, admin, seller…) needs a login.
const PUBLIC_EXACT = ['/', '/products', '/login', '/forgot-password', '/reset-password'];

export const isPublicPath = (pathname: string): boolean => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (PUBLIC_EXACT.includes(path)) return true;
  // Product pages: /product/<id>
  return /^\/product\/[^/]+$/.test(path);
};

/** Login page URL that brings the shopper back to `returnTo` afterwards. */
export const loginPath = (returnTo: string): string =>
  `/login?redirect=${encodeURIComponent(returnTo)}`;
