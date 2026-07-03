import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { SiteContentProvider } from "@/hooks/useSiteContent";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

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

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminRedeems from "./pages/admin/AdminRedeems";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminContactMessages from "./pages/admin/AdminContactMessages";
import AdminBroadcast from "./pages/admin/AdminBroadcast";

const queryClient = new QueryClient();

import PostLoginRedirect from "./components/PostLoginRedirect";

const AppRoutes = () => (
  <BrowserRouter>
    <PostLoginRedirect />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/products" element={<Products />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/login" element={<Login />} />
      <Route path="/~oauth/initiate" element={<OAuthInitiate />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
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
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/payments" element={<AdminPayments />} />
      <Route path="/admin/banners" element={<AdminBanners />} />
      <Route path="/admin/categories" element={<AdminCategories />} />
      <Route path="/admin/redeems" element={<AdminRedeems />} />
      <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
      <Route path="/admin/messages" element={<AdminContactMessages />} />
      <Route path="/admin/broadcast" element={<AdminBroadcast />} />
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
  );
};

export default App;
