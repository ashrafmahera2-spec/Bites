import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  ShoppingBag, 
  Star, 
  LogOut, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items: any[];
}

const ProfilePage: React.FC = () => {
  const { user, logout, isCustomer } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    if (!isCustomer || !user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersData, profileData] = await Promise.all([
          api.getCustomerOrders(user.phone),
          api.getCustomerProfile(user.phone)
        ]);
        setOrders(ordersData);
        setCustomerData(profileData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error(t('admin.customers_fetch_error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isCustomer, navigate, t]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 border border-gray-100 mb-8"
        >
          <div className={`flex flex-col sm:flex-row items-center gap-6 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border-4 border-white shadow-lg">
                <User size={48} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                <Star size={16} fill="currentColor" />
              </div>
            </div>
            
            <div className={`flex-1 text-center sm:text-left ${isRTL ? 'sm:text-right' : ''}`}>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{customerData?.name}</h1>
              <div className={`flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <span className="flex items-center gap-1.5">
                  <Phone size={14} />
                  {customerData?.phone}
                </span>
                {customerData?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} />
                    {customerData?.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {new Date(customerData?.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="bg-orange-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-orange-600/20 text-center min-w-[120px]">
                <p className="text-xs opacity-80 mb-1">{t('admin.customers_table_points')}</p>
                <p className="text-2xl font-bold">{customerData?.points || 0}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
              >
                <LogOut size={16} />
                {t('admin.logout')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 mb-3">
              <ShoppingBag size={20} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{t('admin.dashboard_total_orders')}</p>
            <p className="text-xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-green-50 w-10 h-10 rounded-xl flex items-center justify-center text-green-600 mb-3">
              <Star size={20} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{t('admin.customers_table_points')}</p>
            <p className="text-xl font-bold text-gray-900">{customerData?.points || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
            <div className="bg-purple-50 w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 mb-3">
              <Clock size={20} />
            </div>
            <p className="text-xs text-gray-500 mb-1">{t('admin.dashboard_recent_orders')}</p>
            <p className="text-xl font-bold text-gray-900">
              {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length}
            </p>
          </div>
        </div>

        {/* Orders History */}
        <div className="space-y-4">
          <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl font-bold text-gray-900">{t('admin.nav_orders')}</h2>
            <span className="text-sm text-gray-500">{orders.length} {t('admin.nav_orders')}</span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <ShoppingBag size={32} />
              </div>
              <p className="text-gray-500">{t('admin.cashier_error_empty_cart')}</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-4 text-orange-600 font-bold hover:underline"
              >
                {t('cart.back_to_menu')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center text-gray-400">
                        <ShoppingBag size={24} />
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <p className="font-bold text-gray-900">#{order.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    
                    <div className={`text-right ${isRTL ? 'text-left' : 'text-right'}`}>
                      <p className="font-bold text-orange-600 mb-1">{order.total} {t('common.currency')}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                        order.status === 'delivered' || order.status === 'completed' ? 'bg-green-100 text-green-600' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {t(`admin.orders_status_${order.status}`)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex -space-x-2 overflow-hidden">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                          {item.quantity}x
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <button className="flex items-center gap-1 text-orange-600 font-bold hover:underline">
                      {t('admin.orders_view_details')}
                      <ChevronRight size={16} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
