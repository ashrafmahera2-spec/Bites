import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, List, Settings, LogOut, ClipboardList, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const orders = await api.getOrders();
        setPendingCount(orders.filter((o: any) => o.status === 'pending').length);
      } catch (error) {
        console.error("Error fetching pending orders:", error);
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'نظرة عامة' },
    { path: '/admin/orders', icon: ClipboardList, label: 'الطلبات' },
    { path: '/admin/products', icon: Package, label: 'المنتجات' },
    { path: '/admin/categories', icon: List, label: 'الأقسام' },
    { path: '/admin/settings', icon: Settings, label: 'الإعدادات' },
    { path: '/admin/database', icon: Database, label: 'قاعدة البيانات' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen z-50">
        <div className="p-6 flex items-center justify-between lg:block">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Bite's Admin
          </Link>
          <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <LayoutDashboard size={24} />
          </button>
        </div>

        <nav className="px-4 py-2 space-y-1">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                location.pathname === item.path ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
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
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 hidden lg:block">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="bg-orange-600 text-white p-2 rounded-full">
              <LayoutDashboard size={20} />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500">مدير النظام</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-all"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
