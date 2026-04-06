import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Trash2, Plus, Minus, Send, MapPin, Truck, Store, CreditCard, Wallet, Banknote, ShoppingBag, CheckCircle2, X, Building2, Printer } from 'lucide-react';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Settings {
  restaurantName: string;
  logoUrl?: string;
  whatsappNumber: string;
  walletNumber: string;
  instapayHandle?: string;
  cardDetails?: string;
  deliveryFee: number;
  paymentMethods: {
    cash: boolean;
    instapay: boolean;
    card: boolean;
    wallet: boolean;
  };
  global?: {
    features?: {
      enableCoupons: boolean;
      enablePoints: boolean;
      requireLogin: boolean;
      orderMethod: 'whatsapp' | 'platform';
      menuTheme: string;
    };
    points?: {
      earningRate: number;
      redemptionRate: number;
      minPointsToRedeem: number;
    };
  };
}

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
  deliveryFee?: number;
}

import { printOrder } from '../lib/printUtils';

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, total, clearCart, branchId, setBranchId } = useCart();
  const { t, isRTL, language } = useLanguage();
  const { user, isCustomer } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay' | 'card' | 'wallet'>('cash');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);

  const activeBranch = React.useMemo(() => {
    return branches.find(b => b.id === branchId);
  }, [branches, branchId]);

  const activeDeliveryFee = orderType === 'delivery' 
    ? (activeBranch?.deliveryFee !== undefined && activeBranch?.deliveryFee !== null ? activeBranch.deliveryFee : (settings?.deliveryFee || 0))
    : 0;

  const subtotal = total;
  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? (subtotal * appliedCoupon.value / 100) 
        : appliedCoupon.value)
    : 0;
  const finalDiscount = appliedCoupon?.maxDiscount ? Math.min(discount, appliedCoupon.maxDiscount) : discount;
  
  const pointsDiscount = usePoints && customerData && settings?.pointsConfig
    ? Math.min(subtotal - finalDiscount, customerData.points * settings.pointsConfig.currencyPerPoint)
    : 0;

  const pointsUsed = usePoints && customerData && settings?.pointsConfig
    ? Math.min(customerData.points, Math.ceil(pointsDiscount / settings.pointsConfig.currencyPerPoint))
    : 0;

  const finalTotal = Math.max(0, subtotal - finalDiscount - pointsDiscount + activeDeliveryFee);

  const activeWhatsApp = activeBranch?.whatsappNumber || settings?.whatsappNumber;

  useEffect(() => {
    if (isCustomer && user) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || prev.address
      }));
      setCustomerData(user);
    }
  }, [isCustomer, user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsData, branchesData] = await Promise.all([
          api.getSettings(),
          api.getBranches()
        ]);
        
        if (settingsData) {
          setSettings({
            ...settingsData,
            paymentMethods: settingsData.paymentMethods || { cash: true, instapay: false, card: false, wallet: false }
          });
        }
        
        if (Array.isArray(branchesData)) {
          setBranches(branchesData);
          if (branchesData.length > 0 && !branchId) {
            setBranchId(branchesData[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching settings/branches:", error);
      }
    };
    fetchSettings();
  }, []);

  const printInvoice = (orderId: number) => {
    const order = {
      id: orderId,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      address: orderType === 'delivery' ? customerInfo.address : t('cart.pickup_restaurant'),
      items: items,
      total: total + activeDeliveryFee,
      createdAt: new Date().toISOString()
    };
    printOrder(order, settings, t, isRTL);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomerLookup = async () => {
    if (!customerInfo.phone) return;
    setIsLoggingIn(true);
    try {
      // For simplicity, we'll just fetch customer by phone
      const customers = await api.getCustomers();
      const customer = customers.find((c: any) => c.phone === customerInfo.phone);
      if (customer) {
        setCustomerData(customer);
        setCustomerInfo(prev => ({ ...prev, name: customer.name }));
        toast.success(t('nav.login_success'));
      } else {
        toast.error(t('search.no_results'));
      }
    } catch (error) {
      console.error("Error looking up customer:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!customerInfo.name.trim()) newErrors.name = t('cart.name_required');
    if (!customerInfo.phone.trim()) newErrors.phone = t('cart.phone_required');
    if (customerInfo.phone.trim() && !/^\d{10,15}$/.test(customerInfo.phone.trim())) newErrors.phone = t('cart.phone_invalid');
    if (orderType === 'delivery' && !customerInfo.address.trim()) newErrors.address = t('cart.address_required');
    if (paymentMethod === 'wallet' && !screenshot) newErrors.screenshot = t('cart.screenshot_required');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleOrder = async () => {
    if (settings?.features?.requireLogin && !isCustomer) {
      toast.error(t('login.required_for_checkout') || 'Please login to complete your order');
      window.location.href = '/login?redirect=/cart';
      return;
    }

    if (!validateForm()) {
      toast.error(t('cart.validation_error'));
      return;
    }

    const isWhatsApp = settings?.features?.orderMethod === 'whatsapp';
    
    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        address: orderType === 'delivery' ? customerInfo.address : t('cart.pickup_location'),
        type: orderType,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        subtotal,
        discount: finalDiscount,
        pointsDiscount,
        pointsUsed,
        pointsValue: pointsDiscount,
        couponCode: appliedCoupon?.code,
        total: finalTotal,
        paymentMethod,
        screenshot: screenshot || null,
        status: 'pending',
        branchId: branchId || undefined
      };

      const response = await api.createOrder(orderData);

      if (isWhatsApp && activeWhatsApp) {
        let message = `*${t('cart.whatsapp_order_title')}*\n\n`;
        message += `*${t('cart.name')}:* ${customerInfo.name}\n`;
        message += `*${t('cart.phone')}:* ${customerInfo.phone}\n`;
        
        if (branchId) {
          const branch = branches.find(b => b.id === branchId);
          if (branch) message += `*${t('cart.branch_label')}:* ${branch.name}\n`;
        }

        message += `*${t('cart.order_type')}:* ${orderType === 'delivery' ? t('cart.delivery_type') : t('cart.pickup_type')}\n`;
        if (orderType === 'delivery') message += `*${t('cart.address')}:* ${customerInfo.address}\n`;
        message += `*${t('cart.payment_method')}:* ${
          paymentMethod === 'cash' ? t('cart.cash_type') : 
          paymentMethod === 'instapay' ? t('cart.instapay_type') : 
          paymentMethod === 'wallet' ? t('cart.wallet_type') : t('cart.visa_type')
        }\n`;
        
        message += `\n*${t('cart.items_label')}*\n`;
        items.forEach(item => {
          message += `- ${item.name} (x${item.quantity}) = ${item.price * item.quantity} ${t('common.currency')}\n`;
        });
        
        message += `\n*${t('cart.subtotal')}:* ${subtotal} ${t('common.currency')}`;
        if (appliedCoupon) message += `\n*${t('admin.nav_coupons')}:* -${finalDiscount} ${t('common.currency')}`;
        if (pointsDiscount > 0) message += `\n*${t('admin.settings_points_system')}:* -${pointsDiscount} ${t('common.currency')}`;
        if (orderType === 'delivery') message += `\n*${t('cart.delivery_fee')}:* ${activeDeliveryFee} ${t('common.currency')}`;
        message += `\n*${t('cart.total')}:* ${finalTotal} ${t('common.currency')}`;
        
        if (customerInfo.notes) message += `\n\n*${t('cart.notes_label')}* ${customerInfo.notes}`;
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${activeWhatsApp}?text=${encodedMessage}`, '_blank');
      }
      
      setIsSuccessModalOpen(true);
      clearCart();
    } catch (e) {
      console.error("Error creating order:", e);
      toast.error(t('cart.error_sending'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSuccessModalOpen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
          <div className="bg-orange-100 p-6 rounded-full mb-6">
            <ShoppingBag size={64} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h2>
          <p className="text-gray-500 mb-8">{t('cart.empty_subtitle')}</p>
          <a href="/" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all">
            {t('cart.browse')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('cart.title')}</h2>
            <button 
              onClick={() => setIsClearConfirmOpen(true)}
              className="text-red-500 text-sm font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
            >
              <Trash2 size={16} />
              {t('cart.clear')}
            </button>
          </div>
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                key={item.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <img
                  src={item.imageUrl || 'https://picsum.photos/seed/food/100/100'}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-orange-600 font-bold">{item.price} {t('common.currency')}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1">
                  <button 
                    onClick={() => {
                      updateQuantity(item.id, item.quantity - 1);
                      if (item.quantity === 1) toast.error(t('product.removed'));
                    }} 
                    className="p-1 hover:bg-white rounded-full transition-colors"
                  >
                    <Minus size={16} className="text-orange-600" />
                  </button>
                  <span className="font-bold text-gray-900 min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white rounded-full transition-colors">
                    <Plus size={16} className="text-orange-600" />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    removeItem(item.id);
                    toast.error(t('product.removed'));
                  }} 
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Checkout Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t('cart.order_details')}</h3>
            
            <div className="space-y-4">
              {/* Branch Selection */}
              {branches.length > 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-700">{t('cart.select_branch')}</p>
                  <div className="relative">
                    <Building2 className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                    <select
                      className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none appearance-none bg-white font-medium`}
                      value={branchId || ''}
                      onChange={(e) => setBranchId(Number(e.target.value))}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Order Type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    orderType === 'delivery' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <Truck size={20} />
                  {t('cart.delivery')}
                </button>
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    orderType === 'pickup' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <Store size={20} />
                  {t('cart.pickup')}
                </button>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                {settings?.features?.enablePoints && !customerData && (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder={t('cart.phone_placeholder')}
                      className="flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                      value={customerInfo.phone}
                      onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    />
                    <button
                      onClick={handleCustomerLookup}
                      disabled={isLoggingIn || !customerInfo.phone}
                      className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                    >
                      {isLoggingIn ? '...' : t('nav.login')}
                    </button>
                  </div>
                )}
                
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder={t('cart.name_placeholder')}
                    className={`w-full p-3 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
                    value={customerInfo.name}
                    onChange={e => {
                      setCustomerInfo({ ...customerInfo, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                  />
                  {errors.name && <p className={`text-red-500 text-xs ${isRTL ? 'mr-2' : 'ml-2'}`}>{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <input
                    type="tel"
                    placeholder={t('cart.phone_placeholder')}
                    className={`w-full p-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
                    value={customerInfo.phone}
                    onChange={e => {
                      setCustomerInfo({ ...customerInfo, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                  />
                  {errors.phone && <p className={`text-red-500 text-xs ${isRTL ? 'mr-2' : 'ml-2'}`}>{errors.phone}</p>}
                </div>
                {orderType === 'delivery' && (
                  <div className="space-y-1">
                    <div className="relative">
                      <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 text-gray-400`} size={20} />
                      <textarea
                        placeholder={t('cart.address_placeholder')}
                        className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} rounded-xl border ${errors.address ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px] transition-all`}
                        value={customerInfo.address}
                        onChange={e => {
                          setCustomerInfo({ ...customerInfo, address: e.target.value });
                          if (errors.address) setErrors({ ...errors, address: '' });
                        }}
                      />
                    </div>
                    {errors.address && <p className={`text-red-500 text-xs ${isRTL ? 'mr-2' : 'ml-2'}`}>{errors.address}</p>}
                  </div>
                )}
                <textarea
                  placeholder={t('cart.notes_placeholder')}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[60px]"
                  value={customerInfo.notes}
                  onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">{t('cart.payment_method')}</p>
                <div className="grid grid-cols-1 gap-2">
                  {settings?.paymentMethods.cash && (
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'cash' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      <Banknote size={20} />
                      {t('cart.cash')}
                    </button>
                  )}
                  {settings?.paymentMethods.instapay && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod('instapay')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === 'instapay' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                        }`}
                      >
                        <Wallet size={20} />
                        {t('cart.instapay')}
                      </button>
                      {paymentMethod === 'instapay' && settings.instapayHandle && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-blue-50 rounded-2xl border border-blue-100"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{t('cart.instapay_handle')}</span>
                            <span className="font-bold text-blue-600">{settings.instapayHandle}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                  {settings?.paymentMethods.card && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === 'card' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                        }`}
                      >
                        <CreditCard size={20} />
                        {t('cart.card')}
                      </button>
                      {paymentMethod === 'card' && settings.cardDetails && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-purple-50 rounded-2xl border border-purple-100"
                        >
                          <p className="text-sm text-purple-700 whitespace-pre-wrap">{settings.cardDetails}</p>
                        </motion.div>
                      )}
                    </div>
                  )}
                  {settings?.paymentMethods.wallet && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod('wallet')}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          paymentMethod === 'wallet' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                        }`}
                      >
                        <Wallet size={20} />
                        {t('cart.wallet')}
                      </button>
                      
                      {paymentMethod === 'wallet' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{t('cart.wallet_number')}</span>
                            <span className="font-bold text-orange-600">{settings.walletNumber}</span>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500">{t('cart.attach_screenshot')}</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                handleScreenshotChange(e);
                                if (errors.screenshot) setErrors({ ...errors, screenshot: '' });
                              }}
                              className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${errors.screenshot ? 'file:bg-red-600' : 'file:bg-orange-600'} file:text-white hover:file:bg-orange-700 transition-all`}
                            />
                            {errors.screenshot && <p className="text-red-500 text-xs">{errors.screenshot}</p>}
                            {screenshot && (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-orange-200">
                                <img src={screenshot} alt="Screenshot" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setScreenshot(null)}
                                  className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} bg-red-500 text-white p-1 rounded-bl-lg`}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                {settings?.features?.enableCoupons && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">{t('admin.nav_coupons')}</p>
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="text"
                        placeholder={t('admin.coupons_placeholder')}
                        className={`flex-1 p-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                      />
                      {appliedCoupon ? (
                        <button
                          onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                        >
                          {t('common.cancel')}
                        </button>
                      ) : (
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode}
                          className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold hover:bg-orange-100 transition-all disabled:opacity-50"
                        >
                          {isValidatingCoupon ? '...' : t('common.confirm')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {settings?.features?.enablePoints && customerData && (
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-600 text-white p-1.5 rounded-lg">
                          <CheckCircle2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{t('admin.settings_points_system')}</p>
                          <p className="font-bold text-gray-900">{customerData.points} {t('admin.settings_points_system')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUsePoints(!usePoints)}
                        disabled={customerData.points < (settings.pointsConfig?.minPointsToRedeem || 0)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          usePoints ? 'bg-orange-600 text-white' : 'bg-white text-orange-600 border border-orange-200'
                        } disabled:opacity-50`}
                      >
                        {usePoints ? t('common.cancel') : t('common.confirm')}
                      </button>
                    </div>
                    {customerData.points < (settings.pointsConfig?.minPointsToRedeem || 0) && (
                      <p className="text-[10px] text-orange-600 font-medium italic">
                        * {t('admin.points_min_required').replace('{min}', settings.pointsConfig?.minPointsToRedeem.toString())}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span>{subtotal} {t('common.currency')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>{t('admin.coupons_discount')} ({appliedCoupon.code})</span>
                    <span>-{finalDiscount} {t('common.currency')}</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>{t('admin.settings_points_system')}</span>
                    <span>-{pointsDiscount} {t('common.currency')}</span>
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('cart.delivery_fee')}</span>
                    <span>{activeDeliveryFee} {t('common.currency')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                  <span>{t('cart.total')}</span>
                  <span>{finalTotal} {t('common.currency')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <button
                  onClick={handleOrder}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {settings?.features?.orderMethod === 'whatsapp' ? <Send size={20} /> : <CheckCircle2 size={20} />}
                      {settings?.features?.orderMethod === 'whatsapp' ? t('cart.send_whatsapp') : t('cart.confirm_order')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => printInvoice(Math.floor(Math.random() * 1000000))}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-all"
                >
                  <Printer size={18} />
                  {t('cart.print_receipt')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {isClearConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('cart.clear')}؟</h3>
              <p className="text-gray-500 mb-6">{t('cart.clear_confirm')}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => { clearCart(); setIsClearConfirmOpen(false); toast.success(t('cart.cleared_success')); }}
                  className="bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  {t('cart.yes_clear')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.success_title')}</h3>
              <p className="text-gray-500 mb-8">{t('cart.success_subtitle')}</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { setIsSuccessModalOpen(false); window.location.href = '/'; }}
                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
                >
                  {t('cart.back_to_menu')}
                </button>
                <button
                  onClick={() => printInvoice(Math.floor(Math.random() * 1000000))}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  <Printer size={18} />
                  {t('cart.print_receipt')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;
