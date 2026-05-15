import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, List, Settings, LogOut, ClipboardList, Database, Tag, AlertTriangle, UserPlus, Calculator, UtensilsCrossed, Building2, Ticket, Users, TrendingUp, Navigation, Monitor, Smartphone, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { api } from '../../services/api';
import { toast } from 'sonner';

const AdminDashboard: React.FC = () => {
  const { logout, user, hasPermission } = useAuth();
  const { t, isRTL } = useLanguage();
  const { settings, refreshSettings } = useSettings();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const [lastErrorId, setLastErrorId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuTheme = settings?.features?.menuTheme || 'sidebar';

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const orders = await api.getOrders(user?.role === 'admin' ? undefined : user?.branchId);
        const safeOrders = Array.isArray(orders) ? orders : [];
        const newCount = safeOrders.filter((o: any) => o && o.status === 'pending').length;
        
        if (newCount > prevPendingCount && prevPendingCount !== 0) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
        
        setPrevPendingCount(newCount);
        setPendingCount(newCount);
      } catch (error) {
        // Silently fail to avoid console noise unless it persists
      }
    };

    const fetchErrors = async () => {
      try {
        const data = await api.getErrors();
        const errors = Array.isArray(data) ? data : [];
        if (errors.length > 0) {
          const latestError = errors[0];
          if (lastErrorId === null) {
            setLastErrorId(latestError.id);
          } else if (latestError.id > lastErrorId) {
            setLastErrorId(latestError.id);
            toast.error(t('admin.error_alert'), {
              description: latestError.message,
              duration: 5000,
              icon: <AlertTriangle className="text-red-500" />
            });
          }
        }
      } catch (error) {
        // Silently fail to avoid console noise
      }
    };

    fetchPending();
    const errorTimeout = setTimeout(fetchErrors, 2000); // Stagger first call

    const interval = setInterval(() => {
      fetchPending();
      setTimeout(fetchErrors, 5000); // Stagger recurring calls
    }, 10000); // Poll every 10 seconds
    
    return () => {
      clearInterval(interval);
      clearTimeout(errorTimeout);
    };
  }, [lastErrorId, t, user, prevPendingCount]);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('admin.nav_overview'), permission: 'dashboard' },
    { path: '/admin/reports', icon: TrendingUp, label: t('admin.nav_reports'), permission: 'reports' },
    { path: '/admin/delivery', icon: Navigation, label: t('admin.nav_delivery'), permission: 'delivery' },
    { path: '/admin/display', icon: Monitor, label: t('admin.nav_display'), permission: 'cashier' },
    { path: '/admin/kitchen', icon: UtensilsCrossed, label: t('admin.nav_kitchen'), permission: 'kitchen' },
    { path: '/admin/branches', icon: Building2, label: t('admin.nav_branches'), permission: 'settings' },
    { path: '/admin/cashier', icon: Calculator, label: t('admin.nav_cashier'), permission: 'cashier' },
    { path: '/admin/orders', icon: ClipboardList, label: t('admin.nav_orders'), permission: 'orders' },
    { path: '/admin/products', icon: Package, label: t('admin.nav_products'), permission: 'products' },
    { path: '/admin/categories', icon: List, label: t('admin.nav_categories'), permission: 'products' },
    { path: '/admin/offers', icon: Tag, label: t('admin.nav_offers'), permission: 'products' },
    { path: '/admin/coupons', icon: Ticket, label: t('admin.nav_coupons'), permission: 'settings' },
    { path: '/admin/tables', icon: UtensilsCrossed, label: t('admin.tables_management'), permission: 'settings' },
    { path: '/admin/customers', icon: Users, label: t('admin.nav_customers'), permission: 'settings' },
    { path: '/admin/staff', icon: UserPlus, label: t('admin.nav_staff'), permission: 'users' },
    { path: '/admin/errors', icon: AlertTriangle, label: t('admin.nav_errors'), permission: 'settings' },
    { path: '/admin/pwa-install', icon: Smartphone, label: t('admin.settings_pwa_install') || 'Apps Install', permission: 'settings' },
    { path: '/admin/settings', icon: Settings, label: t('admin.nav_settings'), permission: 'settings' },
    { path: '/admin/database', icon: Database, label: t('admin.nav_database'), permission: 'settings' },
  ].filter(item => hasPermission(item.permission));

  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    const checkOffline = () => {
      const orders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
      setOfflineCount(orders.length);
    };
    checkOffline();
    const interval = setInterval(checkOffline, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!navigator.onLine) {
      toast.error(t('common.offline_error') || 'You are offline');
      return;
    }
    try {
      const count = await api.syncOfflineOrders();
      if (count && count > 0) {
        toast.success(`Synced ${count} orders!`);
        setOfflineCount(0);
      }
    } catch (error) {
      toast.error('Sync failed');
    }
  };

  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    if (settings) {
      setIsStoreOpen(settings.openingHours?.isOpen ?? true);
    }
  }, [settings]);

  const toggleStoreStatus = async () => {
    try {
      const newStatus = !isStoreOpen;
      // In a real app, you'd have an API for just status, but we'll use updateSettings
      if (settings) {
        const updated = { ...settings, openingHours: { ...settings.openingHours, isOpen: newStatus } };
        await api.updateSettings(updated);
        setIsStoreOpen(newStatus);
        toast.success(newStatus ? t('admin.store_opened_success') : t('admin.store_closed_success'));
        refreshSettings();
      }
    } catch (error) {
      toast.error(t('admin.store_update_failed'));
    }
  };

  // Classic Top Navigation Layout
  if (menuTheme === 'classic') {
    return (
      <div key="classic" className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className={`flex items-center gap-2 group ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform">
                <Settings size={20} className="text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Bite's Admin
              </span>
            </Link>

            <nav className={`hidden lg:flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {menuItems.slice(0, 7).map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    location.pathname === item.path ? 'bg-orange-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold"
              >
                {t('common.more') || 'More'}
              </button>
            </nav>

            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={toggleStoreStatus}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isStoreOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                {isStoreOpen ? t('admin.store_open') : t('admin.store_closed')}
              </button>

              {offlineCount > 0 && (
                <button
                  onClick={handleSync}
                  className="p-2 bg-orange-50 text-orange-600 rounded-xl relative"
                >
                  <TrendingUp size={20} />
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold">
                    {offlineCount}
                  </span>
                </button>
              )}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <LayoutDashboard size={24} />
              </button>
              <button onClick={logout} className="p-2 bg-red-50 text-red-600 rounded-xl hidden lg:block">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-0 bg-white z-[60] p-6 overflow-y-auto shadow-2xl">
              <div className={`flex justify-between items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900">{t('common.menu') || 'Menu'}</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 mb-4`}>
                <button
                  onClick={toggleStoreStatus}
                  className={`col-span-2 md:col-span-3 flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                    isStoreOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                  } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <span className="text-sm">{t('admin.store_status')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{isStoreOpen ? t('admin.store_open_now') : t('admin.store_closed_now')}</span>
                    <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                  </div>
                </button>
                {menuItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 p-4 rounded-2xl font-medium transition-all ${
                      location.pathname === item.path ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-50 text-gray-600'
                    } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                  >
                    <item.icon size={20} />
                    <span className="text-sm font-bold">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className={`flex items-center gap-3 p-4 rounded-2xl font-medium bg-red-50 text-red-600 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <LogOut size={20} />
                  <span className="text-sm font-bold">{t('admin.logout')}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Bottom Navigation Layout
  if (menuTheme === 'bottom-nav') {
    return (
      <div key="bottom-nav" className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-4">
          <div className={`max-w-7xl mx-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
             <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform">
                <Settings size={20} className="text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Bite's Admin
              </span>
            </Link>
            
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={toggleStoreStatus}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isStoreOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                {isStoreOpen ? t('admin.store_open') : t('admin.store_closed')}
              </button>

              {offlineCount > 0 && (
                <button
                  onClick={handleSync}
                  className="p-2 bg-orange-50 text-orange-600 rounded-xl relative"
                >
                  <TrendingUp size={20} />
                  <span className="absolute -top-1 -right-1 bg-orange-600 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold">
                    {offlineCount}
                  </span>
                </button>
              )}
              <button
                onClick={logout}
                className="p-2 bg-red-50 text-red-600 rounded-xl"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {menuItems.slice(0, 5).map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${
                location.pathname === item.path ? 'text-orange-600' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <item.icon size={20} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
                {item.path === '/admin/orders' && pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-600 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold truncate max-w-[60px]">{item.label}</span>
            </Link>
          ))}
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-bold">{t('common.more') || 'More'}</span>
          </button>
        </nav>

        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-0 bg-white z-[60] p-6 overflow-y-auto shadow-2xl">
              <div className={`flex justify-between items-center mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900">{t('common.menu') || 'Menu'}</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={toggleStoreStatus}
                  className={`col-span-2 flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                    isStoreOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                  } ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <span className="text-sm">{t('admin.store_status')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{isStoreOpen ? t('admin.store_open_now') : t('admin.store_closed_now')}</span>
                    <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                  </div>
                </button>
                {menuItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 p-4 rounded-2xl font-medium transition-all ${
                      location.pathname === item.path ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-50 text-gray-600'
                    } ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                  >
                    <item.icon size={20} />
                    <span className="text-sm font-bold">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className={`flex items-center gap-3 p-4 rounded-2xl font-medium bg-red-50 text-red-600 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <LogOut size={20} />
                  <span className="text-sm font-bold">{t('admin.logout')}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default Sidebar Layout
  return (
    <div key="sidebar" className={`min-h-screen bg-gray-50 flex flex-col lg:flex-row ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
      {/* Sidebar */}
      <aside className={`w-full lg:w-64 bg-white border-b lg:border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen z-50 ${isRTL ? 'lg:border-r-0 lg:border-l' : ''}`}>
        <div className="p-6 flex items-center justify-between lg:block">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform">
              <Settings size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Bite's Admin
            </span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <LayoutDashboard size={24} />
          </button>
        </div>

        <nav className={`px-4 py-2 space-y-1 ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
          {offlineCount > 0 && (
            <button
              onClick={handleSync}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <TrendingUp size={20} className="animate-pulse" />
                <span>{t('admin.sync_offline') || 'Sync Offline Orders'}</span>
              </div>
              <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                {offlineCount}
              </span>
            </button>
          )}
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                location.pathname === item.path ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <item.icon size={20} />
                {item.label}
              </div>
              {item.path === '/admin/orders' && pendingCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  location.pathname === item.path ? 'bg-white text-orange-600' : 'bg-orange-600 text-white'
                }`}>
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-100">
            <Link
              to="/"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <LogOut size={20} className={isRTL ? '' : 'rotate-180'} />
              {t('admin.nav_back_to_menu')}
            </Link>
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 hidden lg:block">
          <div className={`flex items-center gap-3 mb-4 px-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="bg-orange-600 text-white p-2 rounded-full">
              <LayoutDashboard size={20} />
            </div>
            <div className={isRTL ? 'text-left' : 'text-right'}>
              <p className="text-sm font-bold text-gray-900">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? t('admin.role_admin') : 
                 user?.role === 'staff' ? t('admin.role_staff') : 
                 user?.role === 'cashier' ? t('admin.role_cashier') : 
                 user?.role === 'kitchen' ? t('admin.staff_role_kitchen') : 
                 user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={toggleStoreStatus}
            className={`w-full flex items-center justify-between mb-3 px-4 py-3 rounded-xl font-bold transition-all ${
              isStoreOpen ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
            } ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <span className="text-sm">{t('admin.store_status')}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">{isStoreOpen ? t('admin.store_open') : t('admin.store_closed')}</span>
              <div className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
            </div>
          </button>
          
          <button
            onClick={logout}
            className={`w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <LogOut size={18} />
            {t('admin.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
