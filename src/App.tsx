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

// Public pages — eager (part of first paint)
import Index from "./pages/Index";
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
const AdminAnimations = lazy(() => import("./pages/admin/AdminAnimations"));


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

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
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
      <Route path="/redeem" element={<Redeem />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/assistant/:threadId" element={<Assistant />} />

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
      <Route path="/admin/animations" element={admin(<AdminAnimations />)} />


      {/* Redirect common paths */}
      <Route path="/track-order" element={<Orders />} />
      <Route path="/returns" element={<Help />} />
      <Route path="/shipping" element={<Help />} />
      <Route path="/careers" element={<About />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
