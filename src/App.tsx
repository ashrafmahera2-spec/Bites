import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { useLanguage } from './contexts/LanguageContext';
import { Toaster } from 'sonner';

// Pages
const MenuPage = lazy(() => import('./pages/MenuPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminDatabase = lazy(() => import('./pages/admin/AdminDatabase'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'));
const AdminErrors = lazy(() => import('./pages/admin/AdminErrors'));
const AdminKitchen = lazy(() => import('./pages/admin/AdminKitchen'));
const AdminCashier = lazy(() => import('./pages/admin/AdminCashier'));
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'));
const AdminBranches = lazy(() => import('./pages/admin/AdminBranches'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const KitchenStatus = lazy(() => import('./pages/KitchenStatus'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  if (loading) return <div className="flex h-screen items-center justify-center">{t('common.loading')}</div>;
  if (!isAdmin) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  const { t } = useLanguage();
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-orange-600 font-bold">{t('common.loading')}</div>}>
            <Routes>
              <Route path="/" element={<MenuPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/status" element={<KitchenStatus />} />
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}>
                <Route index element={<AdminOverview />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="errors" element={<AdminErrors />} />
                <Route path="kitchen" element={<AdminKitchen />} />
                <Route path="branches" element={<AdminBranches />} />
                <Route path="cashier" element={<AdminCashier />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="database" element={<AdminDatabase />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
