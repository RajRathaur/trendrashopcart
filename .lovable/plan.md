
# Trendra — Market Launch Plan

Goal: website ko fully production-ready banana — bugs fix, security tight, Razorpay live-ready, custom domain **trendra.store**, mobile polish, SEO, performance aur essential growth features.

Plan 6 phases me hai. Har phase alag milestone hai, sequentially chalega.

---

## Phase 1 — Security & Backend Audit (blocking for launch)

1. Full security scan chalayenge (`run_security_scan` + `linter`).
2. Har table ki RLS + GRANTs verify:
   - `orders`, `order_items`, `payment_confirmations` — sirf owner + admin + seller (order ka)
   - `product_reviews`, `wishlist_items`, `cart_items` — sirf owner
   - `coin_wallet`, `redeem_requests`, `game_rewards` — sirf owner
   - `admin_audit_logs` — sirf admin
   - `phone_otps`, `email_send_log` — server-only
3. `handle_new_user` trigger verify (`auth.users` → `profiles` + default `user` role).
4. **Leaked password protection (HIBP)** enable karenge.
5. Admin routes par client-side guard component add — non-admin ko `/admin/*` pe redirect (currently pages khud check karti hain, ek central `AdminGuard` cleaner hai).
6. Debug routes hataenge production se: `/admin/otp-debug`, `/admin/email-monitor` (ya sirf super-admin ke liye gate).
7. Console.log audit — sensitive data leaks remove.

## Phase 2 — Razorpay Live-Ready Integration

Aap live keys baad me daloge, structure aaj ready:

1. `create-razorpay-order` edge function — `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (add_secret se placeholder request karenge).
2. `verify-razorpay-payment` edge function — HMAC signature verify, order status update.
3. Frontend `Checkout.tsx` me Razorpay checkout modal wire (existing UPI/COD flows preserve).
4. Webhook endpoint `razorpay-webhook` for `payment.captured` / `payment.failed`.
5. Test mode ke saath end-to-end verify; live key aap paste karoge (`update_secret`).
6. Admin panel me Razorpay orders view + refund action.

## Phase 3 — Custom Domain: trendra.store

1. Publish current build (Lovable URL first — prerequisite).
2. User ko step-by-step guide: Project Settings → Domains → **Connect Domain** → `trendra.store` + `www.trendra.store`.
3. DNS records at registrar:
   - A `@` → `185.158.133.1`
   - A `www` → `185.158.133.1`
   - TXT `_lovable` → verification value from UI
4. Primary = `trendra.store`, `www` redirects.
5. `BASE_URL` in `scripts/generate-sitemap.ts`, `index.html` canonical/og:url, `robots.txt` Sitemap directive → update to `https://trendra.store`.
6. Google Search Console verify + submit sitemap (`google_search_console` connector).

## Phase 4 — Mobile & Responsive Polish

1. Har page 375px width par audit: Home, Products, ProductDetail, Cart, Checkout, Orders, Profile, Admin.
2. Fix: overflow-x, sticky navbar overlap, bottom-nav padding conflicts, filter drawer, image aspect ratios.
3. Touch targets ≥ 44px, buttons/inputs mobile-tuned.
4. `BottomNav` active-route highlighting + safe-area (iOS notch) padding.
5. Product filters ko mobile Sheet me proper convert (currently kuch pages me sidebar hai).

## Phase 5 — SEO, Meta & Performance

**SEO:**
1. `react-helmet-async` per-route metadata (already provider set) — Products, ProductDetail, About, Contact, Help, Policies me `<Helmet>` add karenge with unique title/description/canonical/og.
2. ProductDetail par `Product` JSON-LD (name, image, price, availability, rating).
3. Sitemap generator ko dynamic banayenge — `products` table se sab active products fetch karke `/product/:id` URLs include.
4. Full SEO scan trigger + findings fix.

**Performance:**
1. Route-level code splitting — sabhi admin/seller pages `React.lazy` + `Suspense` (bundle chhota).
2. Product images `loading="lazy"` + `decoding="async"` + width/height set (CLS fix).
3. Hero LCP image preload in `index.html`.
4. Framer-motion imports audit — heavy variants ko lazy.
5. Query invalidation review to prevent re-fetch storms.

## Phase 6 — Missing Essentials & Growth

1. **Global error boundary** + friendly error page (currently crash = blank screen).
2. **Empty states** for: no orders, empty wishlist, empty cart, no search results, no notifications.
3. **404 page polish** with search + featured categories.
4. **Loading skeletons** for product grid, order list, admin tables.
5. **Toast standardization** — success/error/info consistent.
6. **Invoice PDF** download on OrderSuccess & OrderDetail (util already exists — wire button).
7. **Product filters**: price range, rating, discount %, in-stock, sort (price/newest/rating).
8. **PWA basics**: `manifest.json`, install prompt, service worker offline fallback.
9. **Analytics**: lightweight page-view tracking table + admin dashboard chart (already partial).
10. **Referral coupon**: user share link → friend signup → both get coins.

---

## Technical Details

**Files to touch (indicative):**
- `index.html`, `public/robots.txt`, `scripts/generate-sitemap.ts` — after domain
- `src/App.tsx` — lazy admin/seller, AdminGuard wrapper
- `src/components/ErrorBoundary.tsx` (new)
- `src/components/AdminGuard.tsx` (new)
- `src/pages/**` — per-route Helmet, empty states, skeletons
- `src/pages/Checkout.tsx` — Razorpay integration
- `src/pages/admin/AdminOrders.tsx` — refund action
- `supabase/functions/create-razorpay-order/index.ts` (new)
- `supabase/functions/verify-razorpay-payment/index.ts` (new)
- `supabase/functions/razorpay-webhook/index.ts` (new)
- Migration: any RLS/GRANT gaps found by scan
- `public/manifest.json` (new), `public/sw.js` (new)

**Secrets needed (placeholder request karenge):**
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

**Suggested execution order:**
Phase 1 → 2 → 5 (SEO+perf) → 4 (mobile) → 6 (essentials) → publish → 3 (domain connect).

---

## Out of Scope (confirm agar chahiye)

- Blog/CMS content creation
- Multi-language (Hindi UI toggle)
- Live chat support widget
- WhatsApp Business API automation (manual link already hai)

Approve karo to Phase 1 se start karta hoon.
