import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Phone, MapPin, Search, Plus, Minus, Trash2, CheckCircle, Printer, History, X, Building2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  type: string;
  branchId?: number;
  createdAt: string;
}

interface Branch {
  id: number;
  name: string;
}

import { printOrder } from '../../lib/printUtils';

export default function AdminCashier() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>(user?.role === 'admin' ? '' : (user?.branchId || ''));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    type: 'takeaway' as 'takeaway' | 'delivery'
  });
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingOrderResponse, setPendingOrderResponse] = useState<Order | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsValue, setPointsValue] = useState(0);

  useEffect(() => {
    fetchData();
    fetchRecentOrders();
    fetchSettings();
  }, [selectedBranchId]);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await api.getBranches();
      const safeBranches = Array.isArray(data) ? data : [];
      setBranches(safeBranches);
      if (safeBranches.length > 0) {
        setSelectedBranchId(safeBranches[0].id);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchData = async () => {
    try {
      const [prodData, catData] = await Promise.all([
        api.getProducts(selectedBranchId || undefined),
        api.getCategories()
      ]);
      
      setProducts((Array.isArray(prodData) ? prodData : []).filter((p: Product) => p && p.isAvailable));
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (error) {
      console.error("Error fetching cashier data:", error);
      toast.error(t('admin.cashier_error_fetch'));
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const data = await api.getOrders(selectedBranchId || undefined);
      setRecentOrders(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = (prev || []).find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...(prev || []), { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const couponDiscount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? (subtotal * appliedCoupon.value / 100) 
        : appliedCoupon.value)
    : 0;
  const finalCouponDiscount = appliedCoupon?.maxDiscount ? Math.min(couponDiscount, appliedCoupon.maxDiscount) : couponDiscount;
  
  const pointsDiscount = redeemPoints ? pointsValue : 0;
  const total = Math.max(0, subtotal - finalCouponDiscount - pointsDiscount);

  const handleCustomerLookup = async () => {
    if (!customerInfo.phone || customerInfo.phone.length < 10) return;
    setIsSearchingCustomer(true);
    try {
      const customers = await api.getCustomers();
      const customer = customers.find((c: any) => c.phone === customerInfo.phone);
      if (customer) {
        setCustomerData(customer);
        setCustomerInfo(prev => ({ ...prev, name: customer.name }));
        toast.success(t('cart.customer_found'));
      } else {
        setCustomerData(null);
        toast.info(t('cart.customer_not_found'));
      }
    } catch (error) {
      console.error("Error looking up customer:", error);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  useEffect(() => {
    if (redeemPoints && customerData && settings?.global?.pointsConfig) {
      const { currencyPerPoint, minPointsToRedeem } = settings.global.pointsConfig;
      if (customerData.points >= minPointsToRedeem) {
        const value = customerData.points * currencyPerPoint;
        setPointsValue(Math.min(value, subtotal - finalCouponDiscount));
      } else {
        setRedeemPoints(false);
        setPointsValue(0);
      }
    } else {
      setPointsValue(0);
    }
  }, [redeemPoints, customerData, subtotal, finalCouponDiscount, settings]);

  const printReceipt = (order: Order) => {
    printOrder(order, settings, t, isRTL);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error(t('admin.cashier_error_empty_cart'));
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error(t('admin.cashier_error_customer_info'));
      return;
    }
    if (!selectedBranchId) {
      toast.error(t('admin.cashier_error_select_branch'));
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        address: customerInfo.address || t('admin.cashier_default_address'),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        discount: finalCouponDiscount + pointsDiscount,
        couponCode: appliedCoupon?.code,
        pointsUsed: redeemPoints ? customerData?.points : 0,
        pointsValue: pointsDiscount,
        total,
        type: customerInfo.type,
        paymentMethod: 'cash',
        status: 'completed',
        branchId: selectedBranchId
      };

      const response = await api.createOrder(orderData);
      
      toast.success(t('admin.cashier_success_submit'));
      
      // Ask to print
      setPendingOrderResponse(response);
      setIsConfirmOpen(true);

      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '', type: 'takeaway' });
      setAppliedCoupon(null);
      setCouponCode('');
      setCustomerData(null);
      setRedeemPoints(false);
      fetchRecentOrders();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error(t('admin.cashier_error_submit'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPrint = () => {
    if (pendingOrderResponse) {
      printReceipt(pendingOrderResponse);
    }
    setIsConfirmOpen(false);
    setPendingOrderResponse(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidatingCoupon(true);
    try {
      const coupon = await api.validateCoupon(couponCode);
      if (subtotal < coupon.minOrder) {
        toast.error(`${t('admin.coupons_error_min_order')} ${coupon.minOrder}`);
        return;
      }
      setAppliedCoupon(coupon);
      toast.success(t('admin.coupons_applied_success'));
    } catch (error: any) {
      toast.error(error.message || t('admin.coupons_invalid'));
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setPendingOrderResponse(null); }}
        onConfirm={handleConfirmPrint}
        title={t('admin.cashier_print')}
        message={t('admin.cashier_print_receipt_confirm')}
        type="info"
      />
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t('admin.cashier_search_placeholder')}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">{t('admin.cashier_all_categories')}</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
            title={t('admin.cashier_history_title')}
          >
            <History className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
          {filteredProducts.map(product => (
            <motion.button
              key={product.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(product)}
              className={`bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${isRTL ? 'text-right' : 'text-left'} flex flex-col h-full`}
            >
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-xl mb-3"
                  referrerPolicy="no-referrer"
                />
              )}
              <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-orange-600 font-bold mt-auto">{product.price} {t('admin.cashier_receipt_currency')}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            {t('admin.cashier_title')}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                  <p className="text-xs text-gray-500">{item.price} {t('admin.cashier_receipt_currency')}</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-gray-50 rounded text-orange-500">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-gray-50 rounded text-orange-500">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t('admin.cashier_cart_empty')}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Building2 className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <select
                className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-500`}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                disabled={user?.role !== 'admin'}
              >
                <option value="">{t('admin.cashier_select_branch')}</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                type="text"
                placeholder={t('admin.cashier_customer_name')}
                className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none`}
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="relative">
              <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                type="text"
                placeholder={t('admin.cashier_customer_phone')}
                className={`w-full ${isRTL ? 'pr-9 pl-12' : 'pl-9 pr-12'} py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none`}
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                onBlur={handleCustomerLookup}
              />
              <button
                onClick={handleCustomerLookup}
                disabled={isSearchingCustomer || !customerInfo.phone}
                className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 p-1 text-orange-600 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-50`}
              >
                {isSearchingCustomer ? (
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search size={16} />
                )}
              </button>
            </div>

            {customerData && settings?.global?.features?.enablePoints && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-orange-50 p-3 rounded-xl border border-orange-100"
              >
                <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 text-orange-700 font-bold text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Star size={14} fill="currentColor" />
                    <span>{customerData.points} {t('cart.points_balance')}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.checked)}
                      disabled={customerData.points < (settings?.global?.pointsConfig?.minPointsToRedeem || 0)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                {customerData.points < (settings?.global?.pointsConfig?.minPointsToRedeem || 0) ? (
                  <p className={`text-[10px] text-orange-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.points_min_required').replace('{min}', settings?.global?.pointsConfig?.minPointsToRedeem)}
                  </p>
                ) : (
                  <p className={`text-[10px] text-orange-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('cart.points_redeem_value').replace('{value}', pointsValue.toString())}
                  </p>
                )}
              </motion.div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setCustomerInfo(prev => ({ ...prev, type: 'takeaway' }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${customerInfo.type === 'takeaway' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                {t('admin.kitchen_takeaway')}
              </button>
              <button
                onClick={() => setCustomerInfo(prev => ({ ...prev, type: 'delivery' }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${customerInfo.type === 'delivery' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                {t('admin.kitchen_delivery')}
              </button>
            </div>
            {customerInfo.type === 'delivery' && (
              <div className="relative">
                <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
                <input
                  type="text"
                  placeholder={t('admin.cashier_customer_address')}
                  className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none`}
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            )}
          </div>

          {settings?.global?.features?.enableCoupons && (
            <div className="space-y-2">
              <label className={`block text-sm font-bold text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                {t('admin.nav_coupons')}
              </label>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="text"
                  placeholder={t('admin.coupons_placeholder')}
                  className={`flex-1 p-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all ${isRTL ? 'text-right' : ''}`}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode}
                    className="px-3 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition-all disabled:opacity-50"
                  >
                    {isValidatingCoupon ? '...' : t('common.confirm')}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <div className={`flex justify-between items-center text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{t('cart.subtotal')}</span>
              <span>{subtotal} {t('admin.cashier_receipt_currency')}</span>
            </div>
            {appliedCoupon && (
              <div className={`flex justify-between items-center text-sm text-green-600 font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('admin.coupons_discount')} ({appliedCoupon.code})</span>
                <span>-{finalCouponDiscount} {t('admin.cashier_receipt_currency')}</span>
              </div>
            )}
            {redeemPoints && pointsDiscount > 0 && (
              <div className={`flex justify-between items-center text-sm text-orange-600 font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('cart.points_discount')}</span>
                <span>-{pointsDiscount} {t('admin.cashier_receipt_currency')}</span>
              </div>
            )}
            <div className={`flex justify-between items-center text-lg font-bold ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{t('admin.cashier_total')}</span>
              <span className="text-orange-600">{total} {t('admin.cashier_receipt_currency')}</span>
            </div>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={loading || cart.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
          >
            {loading ? t('admin.cashier_loading') : (
              <>
                <CheckCircle className="w-5 h-5" />
                {t('admin.cashier_confirm_order')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{t('admin.cashier_recent_orders')}</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                      <p className="font-bold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</p>
                      <p className="text-sm font-bold text-orange-600 mt-1">{order.total} {t('admin.cashier_receipt_currency')}</p>
                    </div>
                    <button 
                      onClick={() => printReceipt(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                    >
                      <Printer size={18} />
                      {t('admin.cashier_print')}
                    </button>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-center text-gray-400 py-12">{t('admin.cashier_no_recent_orders')}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
