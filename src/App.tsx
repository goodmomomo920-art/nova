import { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AppProvider } from './lib/store';
import { Toaster } from './components/ui';
import StoreLayout from './store/StoreLayout';
import Home from './store/Home';
import Shop, { CategoriesPage } from './store/Shop';
import ProductPage from './store/ProductPage';
import { CartPage, CheckoutPage, OrderSuccessPage } from './store/CartCheckout';
import { AuthPage, AccountPage, ContactPage, AboutPage } from './store/AuthAccount';
import AdminLayout from './pages/admin/AdminLayout';
import { DashboardPage, AnalyticsPage } from './pages/admin/AdminDashboard';
import { ProductsPage, CategoriesPage as AdminCategoriesPage, InventoryPage } from './pages/admin/AdminProducts';
import { OrdersPage } from './pages/admin/AdminOrders';
import { CustomersPage, ReviewsPage } from './pages/admin/AdminPeople';
import { DiscountsPage, WebsitePage, NotificationsPage, SettingsPage } from './pages/admin/AdminSite';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="discounts" element={<DiscountsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="website" element={<WebsitePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </HashRouter>
    </AppProvider>
  );
}
