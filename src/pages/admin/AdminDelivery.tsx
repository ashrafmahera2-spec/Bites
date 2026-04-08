import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Package, MapPin, Phone, CheckCircle, Clock, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

const AdminDelivery: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
    const interval = setInterval(fetchMyOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMyOrders = async () => {
    try {
      const allOrders = await api.getOrders();
      // Filter orders assigned to this delivery boy and not yet delivered
      const myOrders = allOrders.filter((o: any) => 
        o.deliveryBoyId === user?.id && o.status !== 'completed'
      );
      setOrders(myOrders);
    } catch (error) {
      console.error("Error fetching delivery orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      toast.success(t('common.success'));
      fetchMyOrders();
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Navigation className="text-orange-500" />
          {t('admin.delivery_my_orders')}
        </h2>
        <span className="bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-bold">
          {orders.length} {t('admin.nav_orders')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">#{order.id}</p>
                  <h3 className="font-bold text-lg">{order.customerName}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'delivering' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {t(`admin.delivery_status_${order.status === 'delivering' ? 'delivering' : 'pending'}`)}
                </span>
              </div>

              <div className="space-y-2">
                <div className={`flex items-start gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <MapPin size={16} className="text-gray-400 shrink-0 mt-1" />
                  <span className={isRTL ? 'text-right' : 'text-left'}>{order.address}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <span>{order.customerPhone}</span>
                </div>
                <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock size={16} className="text-gray-400 shrink-0" />
                  <span>{new Date(order.createdAt).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex gap-3">
                {order.status !== 'delivering' ? (
                  <button
                    onClick={() => updateStatus(order.id, 'delivering')}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Navigation size={18} />
                    {t('admin.delivery_mark_as_delivering')}
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus(order.id, 'completed')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle size={18} />
                    {t('admin.delivery_mark_as_delivered')}
                  </button>
                )}
                <a
                  href={`tel:${order.customerPhone}`}
                  className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                >
                  <Phone size={20} />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {orders.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center space-y-4">
          <Package size={48} className="mx-auto text-gray-200" />
          <p className="text-gray-400 font-medium">{t('admin.orders_no_data')}</p>
        </div>
      )}
    </div>
  );
};

export default AdminDelivery;
