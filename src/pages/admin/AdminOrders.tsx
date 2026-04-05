import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, CheckCircle, Clock, XCircle, Phone, MapPin, Calendar, ClipboardList, Search, Eye, X, Printer, Copy, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

import { useAuth } from '../../contexts/AuthContext';

const NEW_ORDER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  type: 'delivery' | 'pickup';
  paymentMethod: string;
  screenshot?: string | null;
  status: 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled';
  branchId?: number;
  couponCode?: string;
  pointsUsed?: number;
  pointsValue?: number;
  subtotal?: number;
  discount?: number;
  createdAt: string;
}

interface Branch {
  id: number;
  name: string;
}

import { printOrder } from '../../lib/printUtils';

const AdminOrders: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'ready' | 'completed' | 'cancelled'>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<number | 'all'>(user?.role === 'admin' ? 'all' : (user?.branchId || 'all'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders(selectedBranchId === 'all' ? undefined : selectedBranchId);
      const newOrders = Array.isArray(data) ? data : [];
      
      // Play sound and show toast if new order arrives
      if (prevOrderCount > 0 && newOrders.length > prevOrderCount) {
        toast.success(t('admin.orders_new_alert'), {
          description: t('admin.orders_new_desc')
        });
        const audio = new Audio(NEW_ORDER_SOUND);
        audio.play().catch(e => console.log('Audio play blocked:', e));
      }
      
      setOrders(newOrders);
      setPrevOrderCount(newOrders.length);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
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

  const [settings, setSettings] = useState<any>(null);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBranches();
    fetchSettings();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [prevOrderCount, selectedBranchId]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      const statusLabel = status === 'completed' ? t('admin.status_completed') : 
                          status === 'cancelled' ? t('admin.status_cancelled') : 
                          status === 'in-progress' ? t('admin.status_prep') :
                          status === 'ready' ? t('admin.status_ready') :
                          t('admin.status_pending');
      toast.success(`${t('admin.orders_updated_success')}: ${statusLabel}`);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(t('admin.orders_update_failed'));
    }
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await api.deleteOrder(orderToDelete);
      toast.success(t('admin.orders_deleted_success'));
      fetchOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(t('admin.orders_delete_failed'));
    } finally {
      setOrderToDelete(null);
    }
  };

  const copyOrderDetails = (order: Order) => {
    const details = `
${t('admin.orders_new_alert')} #${order.id.toString().slice(-6)}
${t('admin.orders_customer')}: ${order.customerName}
${t('admin.orders_phone')}: ${order.customerPhone}
${t('admin.orders_address')}: ${order.address}
${t('admin.orders_type')}: ${order.type === 'delivery' ? t('admin.orders_delivery_home') : t('admin.orders_pickup_restaurant')}
${t('admin.orders_payment')}: ${order.paymentMethod}
-------------------
${t('admin.orders_items_ordered')}:
${order.items.map(item => `- ${item.name} x${item.quantity} (${item.price * item.quantity} ${t('common.currency')})`).join('\n')}
-------------------
${t('admin.orders_total')}: ${order.total} ${t('common.currency')}
    `.trim();
    
    navigator.clipboard.writeText(details);
    toast.success(t('admin.orders_details_copied'));
  };

  const printInvoice = (order: Order) => {
    printOrder(order, settings, t, isRTL);
  };

  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = safeOrders.filter(o => {
    if (!o) return false;
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch = 
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (o.customerPhone || '').includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setOrderToDelete(null); }}
        onConfirm={deleteOrder}
        title={t('common.delete')}
        message={t('admin.orders_confirm_delete')}
        type="danger"
      />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.orders_title')}</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 flex-1 lg:flex-none">
            <div className="relative flex-1 sm:w-48">
              <Building2 className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
              <select
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none text-sm appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-500`}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                disabled={user?.role !== 'admin'}
              >
                {user?.role === 'admin' && <option value="all">{t('admin.branches_all')}</option>}
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 sm:w-64">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
              <input
                type="text"
                placeholder={t('admin.orders_search_placeholder')}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none text-sm`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'all', label: t('admin.orders_filter_all') },
              { id: 'pending', label: t('admin.orders_filter_pending') },
              { id: 'in-progress', label: t('admin.status_prep') },
              { id: 'ready', label: t('admin.status_ready') },
              { id: 'completed', label: t('admin.orders_filter_completed') },
              { id: 'cancelled', label: t('admin.orders_filter_cancelled') },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  filter === f.id ? 'bg-orange-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <motion.div
              layout
              key={order.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    order.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                    order.status === 'in-progress' ? 'bg-blue-50 text-blue-600' :
                    order.status === 'ready' ? 'bg-indigo-50 text-indigo-600' :
                    order.status === 'completed' ? 'bg-green-50 text-green-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {order.status === 'pending' ? <Clock size={24} /> :
                     order.status === 'in-progress' ? <Clock size={24} className="animate-pulse" /> :
                     order.status === 'ready' ? <CheckCircle size={24} /> :
                     order.status === 'completed' ? <CheckCircle size={24} /> :
                     <XCircle size={24} />}
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{order.customerName}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Building2 size={12} /> {branches.find(b => b.id === order.branchId)?.name || t('common.unspecified')}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {order.customerPhone}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStatus(order.id, 'completed')}
                      className="px-3 py-1.5 bg-green-50 text-green-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-100 transition-all"
                    >
                      {t('admin.orders_mark_completed')}
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs sm:text-sm font-bold hover:bg-red-100 transition-all"
                    >
                      {t('admin.orders_mark_cancelled')}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyOrderDetails(order)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title={t('admin.orders_copy_details')}
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => printInvoice(order)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title={t('admin.orders_print_invoice')}
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                      title={t('admin.orders_view_details')}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => { setOrderToDelete(order.id); setIsConfirmOpen(true); }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title={t('admin.orders_delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t('admin.orders_items_ordered')}</h4>
                  <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                        <span className="font-medium text-gray-700">{item.name} <span className="text-xs text-gray-400">x{item.quantity}</span></span>
                        <span className="font-bold text-gray-900">{item.price * item.quantity} {t('common.currency')}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {order.couponCode && (
                      <div className="flex justify-between items-center text-sm text-green-600">
                        <span>{t('admin.coupons_discount')} ({order.couponCode})</span>
                        <span>-{order.discount || 0} {t('common.currency')}</span>
                      </div>
                    )}
                    {order.pointsUsed && order.pointsUsed > 0 && (
                      <div className="flex justify-between items-center text-sm text-orange-600">
                        <span>{t('cart.points_discount')} ({order.pointsUsed} {t('admin.customers_table_points')})</span>
                        <span>-{order.pointsValue || 0} {t('common.currency')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">{t('admin.orders_total')}</span>
                      <span className="text-xl font-bold text-orange-600">{order.total} {t('common.currency')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.orders_delivery_info')}</h4>
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
                    <MapPin className="text-orange-600 mt-1" size={20} />
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="text-sm font-bold text-gray-900">{order.type === 'delivery' ? t('admin.orders_delivery_home') : t('admin.orders_pickup_restaurant')}</p>
                      <p className="text-sm text-gray-600 mt-1">{order.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Phone size={16} className="text-green-600" />
                    </div>
                    <a href={`tel:${order.customerPhone}`} className="text-sm font-bold text-blue-600 hover:underline">{t('admin.orders_call_customer')}</a>
                  </div>
                  
                  {order.screenshot && (
                    <div className="space-y-2">
                      <h4 className={`text-xs font-bold text-gray-400 uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.orders_payment_screenshot')}</h4>
                      <div className="relative group cursor-pointer" onClick={() => window.open(order.screenshot!, '_blank')}>
                        <img 
                          src={order.screenshot} 
                          alt="Payment Screenshot" 
                          className="w-full h-40 object-cover rounded-2xl border border-gray-100 shadow-sm group-hover:opacity-90 transition-opacity" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                          <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">{t('admin.orders_open_image')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <ClipboardList size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">{t('admin.orders_no_orders')}</h3>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="text-xl font-bold">{t('admin.orders_details_title')} #{selectedOrder.id.toString().slice(-6)}</h3>
                  <p className="text-xs text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className={`font-bold text-gray-900 border-b pb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('cart.customer_details')}</h4>
                    <div className={`space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <p className="text-sm"><span className="text-gray-500">{t('admin.orders_customer')}:</span> <span className="font-medium">{selectedOrder.customerName}</span></p>
                      <p className="text-sm"><span className="text-gray-500">{t('admin.orders_phone')}:</span> <span className="font-medium">{selectedOrder.customerPhone}</span></p>
                      <p className="text-sm"><span className="text-gray-500">{t('admin.orders_address')}:</span> <span className="font-medium">{selectedOrder.address}</span></p>
                      <p className="text-sm"><span className="text-gray-500">{t('admin.orders_type')}:</span> <span className="font-medium">{selectedOrder.type === 'delivery' ? t('admin.orders_delivery_home') : t('admin.orders_pickup_restaurant')}</span></p>
                      <p className="text-sm"><span className="text-gray-500">{t('admin.orders_payment')}:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className={`font-bold text-gray-900 border-b pb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.orders_status')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'completed'); setSelectedOrder({...selectedOrder, status: 'completed'}); }}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${selectedOrder.status === 'completed' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {t('admin.status_completed')}
                      </button>
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'ready'); setSelectedOrder({...selectedOrder, status: 'ready'}); }}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${selectedOrder.status === 'ready' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {t('admin.status_ready')}
                      </button>
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'in-progress'); setSelectedOrder({...selectedOrder, status: 'in-progress'}); }}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${selectedOrder.status === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        {t('admin.status_prep')}
                      </button>
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'pending'); setSelectedOrder({...selectedOrder, status: 'pending'}); }}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${selectedOrder.status === 'pending' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                      >
                        {t('admin.status_pending')}
                      </button>
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'cancelled'); setSelectedOrder({...selectedOrder, status: 'cancelled'}); }}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${selectedOrder.status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        {t('admin.status_cancelled')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className={`font-bold text-gray-900 border-b pb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.orders_items_ordered')}</h4>
                  <div className="bg-gray-50 rounded-2xl overflow-hidden">
                    <table className="w-full text-right" dir={isRTL ? 'rtl' : 'ltr'}>
                      <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.orders_item')}</th>
                          <th className="px-4 py-3 text-center">{t('admin.orders_quantity')}</th>
                          <th className="px-4 py-3 text-center">{t('admin.orders_price')}</th>
                          <th className={`px-4 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>{t('admin.orders_total')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className={`px-4 py-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{item.name}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-center">{item.price} {t('common.currency')}</td>
                            <td className={`px-4 py-3 font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{item.price * item.quantity} {t('common.currency')}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-orange-50 font-bold">
                        {selectedOrder.couponCode && (
                          <tr className="text-sm text-green-600">
                            <td colSpan={3} className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.coupons_discount')} ({selectedOrder.couponCode})</td>
                            <td className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>-{selectedOrder.discount || 0} {t('common.currency')}</td>
                          </tr>
                        )}
                        {selectedOrder.pointsUsed && selectedOrder.pointsUsed > 0 && (
                          <tr className="text-sm text-orange-600">
                            <td colSpan={3} className={`px-4 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('cart.points_discount')} ({selectedOrder.pointsUsed} {t('admin.customers_table_points')})</td>
                            <td className={`px-4 py-2 ${isRTL ? 'text-left' : 'text-right'}`}>-{selectedOrder.pointsValue || 0} {t('common.currency')}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={3} className={`px-4 py-3 text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.orders_final_total')}</td>
                          <td className={`px-4 py-3 text-orange-600 text-lg ${isRTL ? 'text-left' : 'text-right'}`}>{selectedOrder.total} {t('common.currency')}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {selectedOrder.screenshot && (
                  <div className="space-y-4">
                    <h4 className={`font-bold text-gray-900 border-b pb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.orders_payment_screenshot')}</h4>
                    <img 
                      src={selectedOrder.screenshot} 
                      alt="Payment" 
                      className="w-full rounded-2xl border border-gray-100 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrders;
