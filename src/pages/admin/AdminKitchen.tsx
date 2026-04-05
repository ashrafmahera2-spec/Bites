import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, CheckCircle2, PlayCircle, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { useLanguage } from '../../contexts/LanguageContext';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  items: OrderItem[];
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  branchId?: number;
  createdAt: string;
  type: 'delivery' | 'takeaway';
}

interface Branch {
  id: number;
  name: string;
}

export default function AdminKitchen() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>(user?.role === 'admin' ? 'all' : (user?.branchId || 'all'));
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders(selectedBranchId === 'all' ? undefined : selectedBranchId);
      const safeOrders = Array.isArray(data) ? data : [];
      // Filter only active kitchen orders
      setOrders(safeOrders.filter((o: Order) => 
        o.status === 'pending' || o.status === 'in-progress'
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching kitchen orders:", error);
      toast.error(t('admin.kitchen_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBranches();
    const interval = setInterval(fetchOrders, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success(t('admin.kitchen_status_updated'));
      fetchOrders();
    } catch (error) {
      toast.error(t('admin.kitchen_status_error'));
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-orange-500" />
            {t('admin.kitchen_title')}
          </h2>
          <div className="relative">
            <Building2 className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <select
              className={`${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white text-sm disabled:bg-gray-50 disabled:text-gray-500`}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              disabled={user?.role !== 'admin'}
            >
              {user?.role === 'admin' && <option value="all">{t('admin.kitchen_all_branches')}</option>}
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>{t('admin.kitchen_pending')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>{t('admin.kitchen_preparing')}</span>
          </div>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center h-64">{t('admin.kitchen_loading')}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-green-600 w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{t('admin.kitchen_empty')}</h3>
          <p className="text-gray-500 mt-2">{t('admin.kitchen_empty_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden flex flex-col ${
                  order.status === 'pending' ? 'border-red-100' : 'border-blue-100'
                }`}
              >
                {/* Header */}
                <div className={`p-4 flex justify-between items-center ${
                  order.status === 'pending' ? 'bg-red-50' : 'bg-blue-50'
                }`}>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <span className="text-xs font-bold text-gray-500 block mb-1">{t('admin.kitchen_order_num')}{order.id}</span>
                    <h3 className="font-bold text-gray-900">{order.customerName || t('admin.kitchen_local_customer')}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'pending' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {order.status === 'pending' ? t('admin.kitchen_wait') : t('admin.kitchen_prep')}
                  </div>
                </div>

                {/* Items */}
                <div className="p-4 flex-1 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className={`flex justify-between items-center bg-gray-50 p-3 rounded-xl ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                        <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-orange-600 border border-gray-100">
                          {item.quantity}
                        </span>
                        <span className="font-bold text-gray-800">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-50 bg-gray-50/50 space-y-3">
                  <div className={`flex items-center justify-between text-xs text-gray-500 ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="flex items-center gap-1">
                      <Building2 size={14} />
                      <span>{branches.find(b => b.id === order.branchId)?.name || t('admin.kitchen_unspecified')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{new Date(order.createdAt).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle size={14} />
                      <span>{order.type === 'delivery' ? t('admin.kitchen_delivery') : t('admin.kitchen_takeaway')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'pending' ? (
                      <button
                        onClick={() => updateStatus(order.id, 'in-progress')}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100"
                      >
                        <PlayCircle size={18} />
                        {t('admin.kitchen_start_prep')}
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100"
                      >
                        <CheckCircle2 size={18} />
                        {t('admin.kitchen_ready')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
