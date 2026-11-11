import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { SiteContentProvider } from "@/hooks/useSiteContent";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminGuard } from "@/components/AdminGuard";
import { PhoneGate } from "@/components/PhoneGate";
import { AuthGate } from "@/components/AuthGate";

// Public pages — eager (part of first paint)
import Index from "./pages/Index";
import ReelsFeed from "./pages/reels/ReelsFeed";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Help from "./pages/Help";
import BecomeSeller from "./pages/BecomeSeller";
import NotFound from "./pages/NotFound";
import ConfirmPayment from "./pages/ConfirmPayment";
import OrderDetail from "./pages/OrderDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import FruitGame from "./pages/FruitGame";
import Ludo from "./pages/Ludo";
import SpinWheel from "./pages/SpinWheel";
import HillClimb from "./pages/HillClimb";
import DeadRoads from "./pages/DeadRoads";
import Redeem from "./pages/Redeem";
import Assistant from "./pages/Assistant";
import CodCheckout from "./pages/CodCheckout";
import ResetPassword from "./pages/ResetPassword";

// Seller pages — lazy (only load when signed-in seller opens dashboard)
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerOrders = lazy(() => import("./pages/seller/SellerOrders"));
const SellerPayments = lazy(() => import("./pages/seller/SellerPayments"));

// Admin pages — lazy (never in the customer bundle)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminSellers = lazy(() => import("./pages/admin/AdminSellers"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminRedeems = lazy(() => import("./pages/admin/AdminRedeems"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminBroadcast = lazy(() => import("./pages/admin/AdminBroadcast"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminEmailMonitor = lazy(() => import("./pages/admin/AdminEmailMonitor"));
const AdminOtpDebug = lazy(() => import("./pages/admin/AdminOtpDebug"));
const AdminEmailTemplates = lazy(() => import("./pages/admin/AdminEmailTemplates"));
const AdminAnimations = lazy(() => import("./pages/admin/AdminAnimations"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminFestivalSale = lazy(() => import("./pages/admin/AdminFestivalSale"));
const AdminBazaar = lazy(() => import("./pages/admin/AdminBazaar"));

// Trendra Bazaar (used items) — lazy, separate from the shop bundle
const BazaarHome = lazy(() => import("./pages/bazaar/BazaarHome"));
const BazaarItem = lazy(() => import("./pages/bazaar/BazaarItem"));
const BazaarSell = lazy(() => import("./pages/bazaar/BazaarSell"));
const BazaarMyAds = lazy(() => import("./pages/bazaar/BazaarMyAds"));
const BazaarChats = lazy(() => import("./pages/bazaar/BazaarChats"));
const BazaarChat = lazy(() => import("./pages/bazaar/BazaarChat"));

// Trendra Reels (short videos + user profiles) — feed is the default page, rest lazy
const ReelUpload = lazy(() => import("./pages/reels/ReelUpload"));
const UserProfile = lazy(() => import("./pages/reels/UserProfile"));
const AdminReels = lazy(() => import("./pages/admin/AdminReels"));
const UserSearch = lazy(() => import("./pages/reels/UserSearch"));
const Videos = lazy(() => import("./pages/videos/Videos"));
const VideoUpload = lazy(() => import("./pages/videos/VideoUpload"));
const CreatorEarnings = lazy(() => import("./pages/videos/CreatorEarnings"));
const AdminVideos = lazy(() => import("./pages/admin/AdminVideos"));
const AdminCreators = lazy(() => import("./pages/admin/AdminCreators"));


const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

const admin = (el: React.ReactNode) => (
  <AdminGuard>
    <Suspense fallback={<RouteFallback />}>{el}</Suspense>
  </AdminGuard>
);

const seller = (el: React.ReactNode) => (
  <AdminGuard allowSeller>
    <Suspense fallback={<RouteFallback />}>{el}</Suspense>
  </AdminGuard>
);

const lazyPage = (el: React.ReactNode) => <Suspense fallback={<RouteFallback />}>{el}</Suspense>;

const AppRoutes = () => (
  <BrowserRouter>
    <AuthGate>
    <Routes>
      <Route path="/" element={lazyPage(<Videos />)} />
      <Route path="/shop" element={<Index />} />
      <Route path="/products" element={<Products />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/cod-checkout" element={<CodCheckout />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/order/:id" element={<OrderDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about" element={<About />} />
      <Route path="/help" element={<Help />} />
      <Route path="/become-seller" element={<BecomeSeller />} />
      <Route path="/confirm-payment" element={<ConfirmPayment />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
      <Route path="/coin-game" element={<FruitGame />} />
      <Route path="/fruit-game" element={<FruitGame />} />
      <Route path="/spin-wheel" element={<SpinWheel />} />
      <Route path="/hill-climb" element={<HillClimb />} />
      <Route path="/dead-roads" element={<DeadRoads />} />
      <Route path="/ludo" element={<Ludo />} />
      <Route path="/redeem" element={<Redeem />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/assistant/:threadId" element={<Assistant />} />

      {/* Trendra Bazaar — browsing is public, the rest needs login (AuthGate) */}
      <Route path="/bazaar" element={lazyPage(<BazaarHome />)} />
      <Route path="/bazaar/item/:id" element={lazyPage(<BazaarItem />)} />
      <Route path="/bazaar/sell" element={lazyPage(<BazaarSell />)} />
      <Route path="/bazaar/edit/:id" element={lazyPage(<BazaarSell />)} />
      <Route path="/bazaar/my-ads" element={lazyPage(<BazaarMyAds />)} />
      <Route path="/bazaar/chats" element={lazyPage(<BazaarChats />)} />
      <Route path="/bazaar/chats/:id" element={lazyPage(<BazaarChat />)} />

      {/* Watching is public; user profiles, search and posting need login. */}
      <Route path="/reels" element={lazyPage(<ReelsFeed />)} />
      <Route path="/reels/search" element={lazyPage(<UserSearch />)} />
      <Route path="/reels/upload" element={lazyPage(<ReelUpload />)} />
      <Route path="/reels/:id" element={lazyPage(<ReelsFeed />)} />
      <Route path="/u/:username" element={lazyPage(<UserProfile />)} />
      <Route path="/videos" element={lazyPage(<Videos />)} />
      <Route path="/videos/upload" element={lazyPage(<VideoUpload />)} />
      <Route path="/videos/:id" element={lazyPage(<Videos />)} />
      <Route path="/creator/earnings" element={lazyPage(<CreatorEarnings />)} />

      {/* Seller Routes — guarded, lazy */}
      <Route path="/seller" element={seller(<SellerDashboard />)} />
      <Route path="/seller/products" element={seller(<SellerProducts />)} />
      <Route path="/seller/orders" element={seller(<SellerOrders />)} />
      <Route path="/seller/payments" element={seller(<SellerPayments />)} />

      {/* Admin Routes — guarded, lazy */}
      <Route path="/admin" element={admin(<AdminDashboard />)} />
      <Route path="/admin/products" element={admin(<AdminProducts />)} />
      <Route path="/admin/orders" element={admin(<AdminOrders />)} />
      <Route path="/admin/payments" element={admin(<AdminPayments />)} />
      <Route path="/admin/banners" element={admin(<AdminBanners />)} />
      <Route path="/admin/sellers" element={admin(<AdminSellers />)} />
      <Route path="/admin/categories" element={admin(<AdminCategories />)} />
      <Route path="/admin/redeems" element={admin(<AdminRedeems />)} />
      <Route path="/admin/audit-logs" element={admin(<AdminAuditLogs />)} />
      <Route path="/admin/messages" element={admin(<AdminContactMessages />)} />
      <Route path="/admin/broadcast" element={admin(<AdminBroadcast />)} />
      <Route path="/admin/users" element={admin(<AdminUsers />)} />
      <Route path="/admin/email-monitor" element={admin(<AdminEmailMonitor />)} />
      <Route path="/admin/otp-debug" element={admin(<AdminOtpDebug />)} />
      <Route path="/admin/email-templates" element={admin(<AdminEmailTemplates />)} />
      <Route path="/admin/animations" element={admin(<AdminAnimations />)} />
      <Route path="/admin/coupons" element={admin(<AdminCoupons />)} />
      <Route path="/admin/festival-sale" element={admin(<AdminFestivalSale />)} />
      <Route path="/admin/bazaar" element={admin(<AdminBazaar />)} />
      <Route path="/admin/reels" element={admin(<AdminReels />)} />
      <Route path="/admin/videos" element={admin(<AdminVideos />)} />
      <Route path="/admin/creators" element={admin(<AdminCreators />)} />


      {/* Redirect common paths */}
      <Route path="/track-order" element={<Orders />} />
      <Route path="/returns" element={<Help />} />
      <Route path="/shipping" element={<Help />} />
      <Route path="/careers" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </AuthGate>
  </BrowserRouter>
);

const App = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <SiteContentProvider>
                  <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "user"}>
                    <Toaster />
                    <Sonner />
                    <AppRoutes />
                    <PhoneGate />
                  </MotionConfig>
                </SiteContentProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
