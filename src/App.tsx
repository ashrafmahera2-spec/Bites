import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { useLanguage } from './contexts/LanguageContext';
import { Toaster, toast } from 'sonner';
import { api } from './services/api';

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
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminDelivery = lazy(() => import('./pages/admin/AdminDelivery'));
const AdminPwaInstall = lazy(() => import('./pages/admin/AdminPwaInstall'));
const AdminTables = lazy(() => import('./pages/admin/AdminTables'));
const CustomerDisplay = lazy(() => import('./pages/admin/CustomerDisplay'));
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
  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : event.reason;
      
      let message = 'Unknown error';
      let stack = 'No stack trace';

      if (typeof error === 'string') {
        message = error;
      } else if (error instanceof Error) {
        message = error.message;
        stack = error.stack || 'No stack trace';
      } else if (error && typeof error === 'object') {
        message = error.message || error.reason || JSON.stringify(error);
        stack = error.stack || 'No stack trace';
      }
      
      // Log to server
      api.logError({
        message,
        stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      });

      // Handle ChunkLoadError (common in PWAs when new version is deployed)
      if (message.includes('ChunkLoadError') || message.includes('Loading chunk')) {
        toast.error(t('common.update_available') || 'New version available. Reloading...', {
          duration: 5000,
          onAutoClose: () => window.location.reload()
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [t]);

  useEffect(() => {
    const handleOnline = async () => {
      try {
        const syncedCount = await api.syncOfflineOrders();
        if (syncedCount && syncedCount > 0) {
          toast.success(`Synced ${syncedCount} offline orders!`);
        }
      } catch (error) {
        console.error('Sync error:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    // Initial check
    if (navigator.onLine) handleOnline();
    
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <SettingsProvider>
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
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="delivery" element={<AdminDelivery />} />
                  <Route path="display" element={<CustomerDisplay />} />
                  <Route path="errors" element={<AdminErrors />} />
                  <Route path="pwa-install" element={<AdminPwaInstall />} />
                  <Route path="kitchen" element={<AdminKitchen />} />
                  <Route path="branches" element={<AdminBranches />} />
                  <Route path="cashier" element={<AdminCashier />} />
                  <Route path="staff" element={<AdminStaff />} />
                  <Route path="tables" element={<AdminTables />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="database" element={<AdminDatabase />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
