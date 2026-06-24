import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { RequireAdmin } from './components/admin/RequireAdmin.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { Footer } from './components/Footer.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ScrollToTop } from './components/ScrollToTop.jsx';
import { AdminShell } from './layouts/AdminShell.jsx';
import { AdminAnalytics } from './pages/admin/AdminAnalytics.jsx';
import { AdminCustomers } from './pages/admin/AdminCustomers.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail.jsx';
import { AdminOrders } from './pages/admin/AdminOrders.jsx';
import { AdminProductForm } from './pages/admin/AdminProductForm.jsx';
import { AdminProducts } from './pages/admin/AdminProducts.jsx';
import { AdminPromotions } from './pages/admin/AdminPromotions.jsx';
import { AdminReports } from './pages/admin/AdminReports.jsx';
import { AdminSettings } from './pages/admin/AdminSettings.jsx';
import { AdminTeam } from './pages/admin/AdminTeam.jsx';
import { AdminSuppliers } from './pages/admin/AdminSuppliers.jsx';
import { AdminContent } from './pages/admin/AdminContent.jsx';
import { AdminBrands } from './pages/admin/AdminBrands.jsx';
import { AccountOrders } from './pages/AccountOrders.jsx';
import { AccountOrderDetail } from './pages/AccountOrderDetail.jsx';
import { AccountProfile } from './pages/account/AccountProfile.jsx';
import { AccountAddresses } from './pages/account/AccountAddresses.jsx';
import { AccountLayout } from './layouts/AccountLayout.jsx';
import { Cart } from './pages/Cart.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { Home } from './pages/Home.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { ProductDetails } from './pages/ProductDetails.jsx';
import { SearchResults } from './pages/SearchResults.jsx';
import { WishlistPage } from './pages/WishlistPage.jsx';
import { Rewards } from './pages/Rewards.jsx';
import { Shop } from './pages/Shop.jsx';
import { Releases } from './pages/Releases.jsx';
import { Apparel } from './pages/Apparel.jsx';
import { SignIn } from './pages/SignIn.jsx';
import { ForgotPassword } from './pages/ForgotPassword.jsx';
import { ResetPassword } from './pages/ResetPassword.jsx';
import { StoreLocator } from './pages/StoreLocator.jsx';
import { Support } from './pages/Support.jsx';
import { Brands } from './pages/Brands.jsx';
import { StorefrontContentPage } from './pages/StorefrontContentPage.jsx';
import { contentPages } from './config/footerLinks.js';

function AdminNewProduct() {
  return <AdminProductForm key="create" variant="create" />;
}

function AdminEditProduct() {
  const { productId } = useParams();
  return <AdminProductForm key={productId} />;
}

function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={<Navigate to="/sign-in" replace />}
      />
      <Route path="admin" element={<RequireAdmin />}>
        <Route element={<AdminShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="orders/:orderId" element={<AdminOrderDetail />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products/new" element={<AdminNewProduct />} />
          <Route path="products/:productId/edit" element={<AdminEditProduct />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="suppliers" element={<AdminSuppliers />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route
            path="*"
            element={<Navigate to="/admin/dashboard" replace />}
          />
        </Route>
      </Route>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="apparel" element={<Apparel />} />
        <Route path="sale" element={<Shop />} />
        <Route path="releases" element={<Releases />} />
        <Route path="product/:productId" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="account" element={<AccountLayout />}>
          <Route index element={<Navigate to="/account/orders" replace />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="orders/:orderId" element={<AccountOrderDetail />} />
          <Route path="profile" element={<AccountProfile />} />
          <Route path="addresses" element={<AccountAddresses />} />
        </Route>
        <Route path="stores" element={<StoreLocator />} />
        <Route path="brands" element={<Brands />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="support" element={<Support />} />
        {contentPages.map((page) => (
          <Route
            key={page.path}
            path={page.path.replace(/^\//, '')}
            element={<StorefrontContentPage slug={page.slug} />}
          />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
