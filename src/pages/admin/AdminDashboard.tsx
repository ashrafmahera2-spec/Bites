import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, List, Settings, LogOut, ClipboardList, Database, Tag, AlertTriangle, UserPlus, Calculator, UtensilsCrossed, Building2, Ticket, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { toast } from 'sonner';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [lastErrorId, setLastErrorId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const orders = await api.getOrders(user?.role === 'admin' ? undefined : user?.branchId);
        const safeOrders = Array.isArray(orders) ? orders : [];
        setPendingCount(safeOrders.filter((o: any) => o && o.status === 'pending').length);
      } catch (error) {
        console.error("Error fetching pending orders:", error);
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
        console.error("Error fetching menu errors:", error);
      }
    };

    fetchPending();
    fetchErrors();
    const interval = setInterval(() => {
      fetchPending();
      fetchErrors();
    }, 10000);
    return () => clearInterval(interval);
  }, [lastErrorId, t]);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: t('admin.nav_overview'), roles: ['admin', 'staff', 'cashier', 'kitchen'] },
    { path: '/admin/kitchen', icon: UtensilsCrossed, label: t('admin.nav_kitchen'), roles: ['admin', 'kitchen'] },
    { path: '/admin/branches', icon: Building2, label: t('admin.nav_branches'), roles: ['admin'] },
    { path: '/admin/cashier', icon: Calculator, label: t('admin.nav_cashier'), roles: ['admin', 'cashier'] },
    { path: '/admin/orders', icon: ClipboardList, label: t('admin.nav_orders'), roles: ['admin', 'staff', 'cashier'] },
    { path: '/admin/products', icon: Package, label: t('admin.nav_products'), roles: ['admin', 'staff'] },
    { path: '/admin/categories', icon: List, label: t('admin.nav_categories'), roles: ['admin', 'staff'] },
    { path: '/admin/offers', icon: Tag, label: t('admin.nav_offers'), roles: ['admin', 'staff'] },
    { path: '/admin/coupons', icon: Ticket, label: t('admin.nav_coupons'), roles: ['admin'] },
    { path: '/admin/customers', icon: Users, label: t('admin.nav_customers'), roles: ['admin'] },
    { path: '/admin/staff', icon: UserPlus, label: t('admin.nav_staff'), roles: ['admin'] },
    { path: '/admin/errors', icon: AlertTriangle, label: t('admin.nav_errors'), roles: ['admin'] },
    { path: '/admin/settings', icon: Settings, label: t('admin.nav_settings'), roles: ['admin'] },
    { path: '/admin/database', icon: Database, label: t('admin.nav_database'), roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col lg:flex-row ${isRTL ? 'lg:flex-row-reverse' : ''}`}>
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
          {filteredMenuItems.map(item => (
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
