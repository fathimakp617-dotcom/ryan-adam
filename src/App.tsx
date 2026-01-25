import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AffiliateProvider } from "@/contexts/AffiliateContext";
import { AuthProvider } from "@/contexts/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import ScrollToTop from "@/components/ScrollToTop";

// Eagerly load critical pages
import Index from "./pages/Index";

// Lazy load non-critical pages
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Account = lazy(() => import("./pages/Account"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CancellationRefundPolicy = lazy(() => import("./pages/CancellationRefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contact = lazy(() => import("./pages/Contact"));

// Admin pages - all lazy loaded for faster initial load
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAffiliates = lazy(() => import("./pages/admin/AdminAffiliates"));
const AdminActivityLogs = lazy(() => import("./pages/admin/AdminActivityLogs"));
const AdminStaff = lazy(() => import("./pages/admin/AdminStaff"));
const AdminAccount = lazy(() => import("./pages/admin/AdminAccount"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminExpenses = lazy(() => import("./pages/admin/AdminExpenses"));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminWithdrawals = lazy(() => import("./pages/admin/AdminWithdrawals"));

// Shipping pages - all lazy loaded
const ShippingLayout = lazy(() => import("./pages/shipping/ShippingLayout"));
const ShippingDashboard = lazy(() => import("./pages/shipping/ShippingDashboard"));
const ShippingOrders = lazy(() => import("./pages/shipping/ShippingOrders"));
const ShippingAccount = lazy(() => import("./pages/shipping/ShippingAccount"));
const ShippingReturns = lazy(() => import("./pages/shipping/ShippingReturns"));


// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * 60 * 1000, // 15 minutes - data stays fresh longer
      gcTime: 20 * 60 * 1000, // 20 minutes cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AffiliateProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <CartDrawer />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
                      <Route path="/refund-policy" element={<CancellationRefundPolicy />} />
                      <Route path="/cancellation-policy" element={<CancellationRefundPolicy />} />
                      <Route path="/shipping-policy" element={<ShippingPolicy />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="customers" element={<AdminCustomers />} />
                      <Route path="affiliates" element={<AdminAffiliates />} />
                        <Route path="activity-logs" element={<AdminActivityLogs />} />
                        <Route path="staff" element={<AdminStaff />} />
                        <Route path="coupons" element={<AdminCoupons />} />
                        <Route path="account" element={<AdminAccount />} />
                        <Route path="returns" element={<AdminReturns />} />
                        <Route path="expenses" element={<AdminExpenses />} />
                        <Route path="reviews" element={<AdminReviewsPage />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="withdrawals" element={<AdminWithdrawals />} />
                      </Route>
                      <Route path="/shipping" element={<ShippingLayout />}>
                        <Route index element={<ShippingDashboard />} />
                        <Route path="orders" element={<ShippingOrders />} />
                        <Route path="account" element={<ShippingAccount />} />
                        <Route path="returns" element={<ShippingReturns />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </AffiliateProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
