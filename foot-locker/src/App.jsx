import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { RequireAdmin } from './components/admin/RequireAdmin.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { Footer } from './components/Footer.jsx';
import { Navbar } from './components/Navbar.jsx';
import { AdminShell } from './layouts/AdminShell.jsx';
import { AdminAnalytics } from './pages/admin/AdminAnalytics.jsx';
import { AdminCustomers } from './pages/admin/AdminCustomers.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminLogin } from './pages/admin/AdminLogin.jsx';
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail.jsx';
import { AdminOrders } from './pages/admin/AdminOrders.jsx';
import { AdminProductForm } from './pages/admin/AdminProductForm.jsx';
import { AdminProducts } from './pages/admin/AdminProducts.jsx';
import { AdminPromotions } from './pages/admin/AdminPromotions.jsx';
import { AdminReports } from './pages/admin/AdminReports.jsx';
import { AdminSettings } from './pages/admin/AdminSettings.jsx';
import { AccountOrders } from './pages/AccountOrders.jsx';
import { Cart } from './pages/Cart.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { Home } from './pages/Home.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { ProductDetails } from './pages/ProductDetails.jsx';
import { SearchResults } from './pages/SearchResults.jsx';
import { WishlistPage } from './pages/WishlistPage.jsx';
import { Rewards } from './pages/Rewards.jsx';
import { Shop } from './pages/Shop.jsx';
import { SignIn } from './pages/SignIn.jsx';
import { StoreLocator } from './pages/StoreLocator.jsx';
import { Support } from './pages/Support.jsx';

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
      <Route path="/admin/login" element={<AdminLogin />} />
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
          <Route path="reports" element={<AdminReports />} />
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
        <Route path="sale" element={<Shop />} />
        <Route
          path="releases"
          element={<Navigate to={{ pathname: '/shop', search: '?sort=newest' }} replace />}
        />
        <Route path="product/:productId" element={<ProductDetails />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="account/orders" element={<AccountOrders />} />
        <Route
          path="account"
          element={<Navigate to="/account/orders" replace />}
        />
        <Route path="stores" element={<StoreLocator />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="rewards" element={<Rewards />} />
        <Route path="support" element={<Support />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
