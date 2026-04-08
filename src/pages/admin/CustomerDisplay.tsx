import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Clock, CheckCircle, Utensils, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CustomerDisplay: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [readyOrders, setReadyOrders] = useState<any[]>([]);
  const [preparingOrders, setPreparingOrders] = useState<any[]>([]);
  const [lastReadyId, setLastReadyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders();
        const activeOrders = data.filter((o: any) => o.status === 'ready' || o.status === 'in-progress');
        
        const ready = activeOrders.filter((o: any) => o.status === 'ready');
        const preparing = activeOrders.filter((o: any) => o.status === 'in-progress');
        
        setReadyOrders(ready);
        setPreparingOrders(preparing);

        // Play sound if a new order becomes ready
        if (ready.length > 0) {
          const latestReady = ready[0];
          if (lastReadyId && latestReady.id !== lastReadyId) {
            playNotification();
          }
          setLastReadyId(latestReady.id);
        }
      } catch (error) {
        console.error("Error fetching display orders:", error);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [lastReadyId]);

  const playNotification = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio blocked'));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-12 border-b border-gray-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="bg-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-600/20">
            <Utensils size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">{t('admin.customer_display_title') || 'Order Status'}</h1>
            <p className="text-gray-400 text-lg">{new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-800 px-6 py-3 rounded-2xl border border-gray-700">
          <Volume2 className="text-orange-500" />
          <span className="text-sm font-bold text-gray-300">{t('admin.display_audio_enabled') || 'Audio Notifications Active'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-[calc(100vh-250px)]">
        {/* Preparing Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <h2 className="text-3xl font-bold text-blue-400 uppercase tracking-widest">
              {t('admin.status_prep') || 'Preparing'}
            </h2>
          </div>
          <div className="flex-1 bg-gray-800/50 rounded-[40px] border border-gray-700 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {preparingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-gray-800 p-6 rounded-3xl border border-gray-700 flex flex-col items-center justify-center gap-2 shadow-xl"
                  >
                    <span className="text-4xl font-black text-white">#{order.id.toString().slice(-3)}</span>
                    <span className="text-xs text-gray-500 font-bold uppercase">{order.customerName.split(' ')[0]}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {preparingOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                <Clock size={64} strokeWidth={1} />
                <p className="text-xl font-medium">{t('admin.display_no_preparing') || 'No orders in preparation'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
            <h2 className="text-3xl font-bold text-green-400 uppercase tracking-widest">
              {t('admin.status_ready') || 'Ready for Pickup'}
            </h2>
          </div>
          <div className="flex-1 bg-green-500/5 rounded-[40px] border-4 border-green-500/20 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1.1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="bg-green-600 p-8 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-[0_20px_50px_rgba(22,163,74,0.3)] ring-4 ring-green-400/30"
                  >
                    <span className="text-5xl font-black text-white">#{order.id.toString().slice(-3)}</span>
                    <span className="text-sm text-green-100 font-bold uppercase">{order.customerName.split(' ')[0]}</span>
                    <CheckCircle className="text-green-200 mt-2" size={24} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {readyOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                <CheckCircle size={64} strokeWidth={1} />
                <p className="text-xl font-medium">{t('admin.display_no_ready') || 'Waiting for orders...'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-gray-500 font-medium text-lg italic">
          {t('admin.display_footer') || 'Please have your order number ready. Thank you for choosing us!'}
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        @keyframes pulse-custom {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default CustomerDisplay;
