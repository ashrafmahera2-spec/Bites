import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface Order {
  id: number;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  customerName: string;
  branchId?: number;
}

interface Branch {
  id: number;
  name: string;
}

export default function KitchenStatus() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await api.getBranches();
        setBranches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders(selectedBranchId === 'all' ? undefined : selectedBranchId);
        const safeOrders = Array.isArray(data) ? data : [];
        // Only show orders that are in kitchen or ready
        setOrders(safeOrders.filter(o => ['in-progress', 'ready'].includes(o.status)));
      } catch (error) {
        console.error("Error fetching kitchen status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  const inProgress = orders.filter(o => o.status === 'in-progress');
  const ready = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-12" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className={`flex flex-col md:flex-row justify-between items-center gap-6 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="bg-orange-600 p-4 rounded-3xl shadow-xl shadow-orange-600/20">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                {t('kitchen_status.title')}
              </h1>
              <p className="text-gray-500 font-medium">
                {t('kitchen_status.subtitle')}
              </p>
            </div>
          </div>

          <div className={`flex flex-col md:flex-row items-center gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
            {branches.length > 1 && (
              <select
                className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-orange-600 outline-none"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">{t('kitchen_status.all_branches')}</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            <Link 
              to="/"
              className={`flex items-center gap-2 text-orange-600 font-bold hover:gap-3 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t('admin.nav_back_to_menu')}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ready Section */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-500/5 border border-emerald-50 overflow-hidden">
            <div className={`bg-emerald-500 p-8 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h2 className={`text-2xl font-black text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CheckCircle2 className="w-8 h-8" />
                {t('kitchen_status.ready_title')}
              </h2>
              <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                {ready.length} {t('kitchen_status.orders_count')}
              </span>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {ready.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 text-center group hover:bg-emerald-100 transition-all"
                    >
                      <span className="block text-3xl font-black text-emerald-600 mb-1">
                        #{order.id.toString().slice(-3)}
                      </span>
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                        {order.customerName.split(' ')[0]}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {ready.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400 font-medium">
                    {t('kitchen_status.no_ready')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* In Progress Section */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-orange-500/5 border border-orange-50 overflow-hidden">
            <div className={`bg-orange-500 p-8 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h2 className={`text-2xl font-black text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className="w-8 h-8" />
                {t('kitchen_status.preparing_title')}
              </h2>
              <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                {inProgress.length} {t('kitchen_status.orders_count')}
              </span>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {inProgress.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="bg-orange-50 border-2 border-orange-100 rounded-3xl p-6 text-center"
                    >
                      <span className="block text-3xl font-black text-orange-600 mb-1">
                        #{order.id.toString().slice(-3)}
                      </span>
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                        {order.customerName.split(' ')[0]}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {inProgress.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400 font-medium">
                    {t('kitchen_status.no_preparing')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
          <p className="text-gray-500 font-medium">
            {t('kitchen_status.footer_info')}
          </p>
        </div>
      </div>
    </div>
  );
}
