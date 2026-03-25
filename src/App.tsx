import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-center" richColors />
          <BrowserRouter>
            <Suspense fallback={<div className="flex h-screen items-center justify-center text-orange-600 font-bold">جاري التحميل...</div>}>
              <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}>
                  <Route index element={<AdminOverview />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="errors" element={<AdminErrors />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="database" element={<AdminDatabase />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
