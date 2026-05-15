import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Phone, MapPin, Search, Plus, Minus, Trash2, CheckCircle, Printer, History, X, Building2, Star, Tag, Package, UtensilsCrossed } from 'lucide-react';
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
  sizes?: { label: string; price: number }[];
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Omit<Product, 'id'> {
  id: string;
  quantity: number;
  selectedSize?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  type: string;
  paymentMethod?: string;
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
  const [offers, setOffers] = useState<any[]>([]);
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
    tableNumber: '',
    tableId: '',
    type: 'takeaway' as 'takeaway' | 'delivery' | 'dine_in',
    paymentMethod: 'cash'
  });
  const [tables, setTables] = useState<any[]>([]);
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
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [heldCarts, setHeldCarts] = useState<{ id: string; cart: CartItem[]; customer: any; timestamp: number }[]>([]);
  const [showCartOnMobile, setShowCartOnMobile] = useState(false);
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
    fetchRecentOrders();
    fetchSettings();
    if (selectedBranchId) {
      fetchTables();
    }
  }, [selectedBranchId]);

  const fetchTables = async () => {
    try {
      const data = await api.getTables(Number(selectedBranchId));
      setTables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    fetchBranches();

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        handleSubmitOrder();
      }
      if (e.key === 'Escape') {
        if (showHistory) setShowHistory(false);
        else if (isConfirmOpen) setIsConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      
      // If user is not admin, lock to their branch
      if (user?.role !== 'admin' && user?.branchId) {
        setSelectedBranchId(user.branchId);
      } else if (safeBranches.length > 0 && !selectedBranchId) {
        setSelectedBranchId(safeBranches[0].id);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchData = async () => {
    try {
      const [prodData, catData, offersData] = await Promise.all([
        api.getProducts(selectedBranchId || undefined),
        api.getCategories(),
        api.getOffers()
      ]);
      
      const prods = Array.isArray(prodData) ? prodData.map((p: any) => ({
        ...p,
        sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes
      })) : [];
      setProducts(prods.filter((p: Product) => p && p.isAvailable));
      setCategories(Array.isArray(catData) ? catData : []);
      
      const enrichedOffers = (Array.isArray(offersData) ? offersData : []).filter(o => o.isActive).map(o => ({
        ...o,
        productNames: o.products?.map((pid: number) => prods.find((p: any) => p.id === pid)?.name).filter(Boolean) || []
      }));
      setOffers(enrichedOffers);
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

  const addToCartWithDetails = (product: Product, size?: { label: string; price: number }) => {
    const itemId = size ? `${product.id}_${size.label}` : String(product.id);
    const itemName = size ? `${product.name} (${size.label})` : product.name;
    const itemPrice = size ? size.price : product.price;

    setCart(prev => {
      const existing = (prev || []).find(item => item.id === itemId);
      if (existing) {
        return prev.map(item => item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...(prev || []), { 
        ...product, 
        id: itemId, 
        name: itemName,
        price: itemPrice,
        quantity: 1,
        selectedSize: size?.label
      }];
    });
    setSelectedProductForSize(null);
  };

  const addToCart = (product: Product) => {
    if (product.sizes && product.sizes.length > 0) {
      setSelectedProductForSize(product);
      return;
    }
    addToCartWithDetails(product);
  };

  const addOfferToCart = (offer: any) => {
    setCart(prev => {
      const existing = (prev || []).find(item => item.id === `offer_${offer.id}`);
      if (existing) {
        return prev.map(item => item.id === `offer_${offer.id}` ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...(prev || []), { 
        id: `offer_${offer.id}`, 
        name: offer.title, 
        price: Number(offer.price), 
        quantity: 1,
        categoryId: 'offers',
        isAvailable: true,
        subItems: offer.productNames || []
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', address: '', tableNumber: '', tableId: '', type: 'takeaway', paymentMethod: 'cash' });
    setAppliedCoupon(null);
    setCouponCode('');
    setCustomerData(null);
    setRedeemPoints(false);
    setManualDiscount(0);
    toast.success(t('cart.cleared_success'));
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const holdId = `HOLD-${Date.now()}`;
    setHeldCarts(prev => [...prev, {
      id: holdId,
      cart: [...cart],
      customer: { ...customerInfo },
      timestamp: Date.now()
    }]);
    setCart([]);
    setCustomerInfo({ name: '', phone: '', address: '', tableNumber: '', tableId: '', type: 'takeaway', paymentMethod: 'cash' });
    setAppliedCoupon(null);
    setCouponCode('');
    setManualDiscount(0);
    toast.success(t('admin.cashier_order_held'));
  };

  const handleRestoreHold = (holdId: string) => {
    const held = heldCarts.find(h => h.id === holdId);
    if (held) {
      setCart(held.cart);
      setCustomerInfo(held.customer);
      setHeldCarts(prev => prev.filter(h => h.id !== holdId));
      toast.success(t('admin.cashier_order_restored'));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Tax & Service Calculations
  const taxRate = settings?.taxConfig?.enableTax ? (settings.taxConfig.taxRate || 0) : 0;
  const serviceRate = settings?.taxConfig?.enableServiceCharge ? (settings.taxConfig.serviceChargeRate || 0) : 0;
  
  const taxAmount = (subtotal * taxRate) / 100;
  const serviceAmount = (subtotal * serviceRate) / 100;

  const couponDiscount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? (subtotal * appliedCoupon.value / 100) 
        : appliedCoupon.value)
    : 0;
  const finalCouponDiscount = appliedCoupon?.maxDiscount ? Math.min(couponDiscount, appliedCoupon.maxDiscount) : couponDiscount;
  
  const pointsDiscount = redeemPoints ? pointsValue : 0;
  const total = Math.max(0, subtotal + taxAmount + serviceAmount + (customerInfo.type === 'delivery' ? (settings?.deliveryFee || 0) : 0) - finalCouponDiscount - pointsDiscount - manualDiscount);

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
        // toast.info(t('cart.customer_not_found'));
      }
    } catch (error) {
      console.error("Error looking up customer:", error);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  useEffect(() => {
    if (redeemPoints && customerData && settings?.pointsConfig) {
      const { currencyPerPoint, minPointsToRedeem } = settings.pointsConfig;
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
    const printMode = settings?.printSettings?.printMode || 'both';
    if (printMode === 'invoice' || printMode === 'both') {
      printOrder(order, settings, t, isRTL, { type: 'invoice' }, categories);
    }
    if (printMode === 'kitchen' || printMode === 'both') {
      printOrder(order, settings, t, isRTL, { type: 'kitchen' }, categories);
    }
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
        address: customerInfo.type === 'dine_in' 
          ? `${t('admin.cashier_dine_in')} - ${tables.find(t => t.id == customerInfo.tableId)?.name || customerInfo.tableNumber}`
          : (customerInfo.address || t('admin.cashier_default_address')),
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          categoryId: item.categoryId,
          subItems: (item as any).subItems || []
        })),
        subtotal,
        discount: finalCouponDiscount + pointsDiscount + manualDiscount,
        couponCode: appliedCoupon?.code,
        pointsUsed: redeemPoints ? customerData?.points : 0,
        pointsValue: pointsDiscount,
        taxAmount: taxAmount,
        serviceChargeAmount: serviceAmount,
        deliveryFee: customerInfo.type === 'delivery' ? (settings?.deliveryFee || 0) : 0,
        total,
        type: customerInfo.type,
        paymentMethod: customerInfo.paymentMethod,
        status: 'completed',
        branchId: selectedBranchId,
        tableId: customerInfo.tableId || null
      };

      const response = await api.createOrder(orderData);
      
      toast.success(t('admin.cashier_success_submit'));
      
      // Ask to print
      setPendingOrderResponse(response);
      setIsConfirmOpen(true);

      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '', tableNumber: '', tableId: '', type: 'takeaway', paymentMethod: 'cash' });
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
    <div className="flex flex-col h-[calc(100vh-120px)] lg:flex-row gap-6 overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 shrink-0">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          {t('admin.cashier_title')}
        </h2>
        <button
          onClick={() => setShowCartOnMobile(!showCartOnMobile)}
          className="relative p-2 bg-orange-100 text-orange-600 rounded-xl"
        >
          {showCartOnMobile ? <Search size={24} /> : <ShoppingCart size={24} />}
          {cart.length > 0 && !showCartOnMobile && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Size Selection Modal */}
      <AnimatePresence>
        {selectedProductForSize && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">{selectedProductForSize.name}</h3>
                <button onClick={() => setSelectedProductForSize(null)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-500 mb-6 text-sm font-medium">{t('product.select_size') || 'Select Size'}</p>
              <div className="space-y-3">
                {selectedProductForSize.sizes?.map((size, idx) => (
                  <button
                    key={idx}
                    onClick={() => addToCartWithDetails(selectedProductForSize, size)}
                    className="w-full p-4 bg-gray-50 hover:bg-orange-50 border-2 border-transparent hover:border-orange-500 rounded-2xl flex justify-between items-center transition-all group"
                  >
                    <span className="font-bold text-gray-700 group-hover:text-orange-700">{size.label}</span>
                    <span className="font-black text-orange-600">{size.price} {t('admin.cashier_receipt_currency')}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Print Options Overlay */}
      <AnimatePresence>
        {isConfirmOpen && pendingOrderResponse && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
              
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-inner">
                <CheckCircle size={40} />
              </div>

              <h3 className="text-2xl font-black text-gray-800 mb-2">
                {t('admin.cashier_success_submit')}
              </h3>
              <p className="text-gray-500 mb-8 font-medium">
                {t('admin.cashier_print_receipt_confirm')}
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => {
                    printOrder(pendingOrderResponse, settings, t, isRTL, { type: 'invoice' }, categories);
                    setIsConfirmOpen(false);
                  }}
                  className="w-full py-4 bg-gray-50 hover:bg-orange-50 border-2 border-transparent hover:border-orange-500 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-gray-700"
                >
                  <Printer size={20} className="text-orange-500" />
                  {t('admin.cashier_print_invoice')}
                </button>
                
                <button
                  onClick={() => {
                    printOrder(pendingOrderResponse, settings, t, isRTL, { type: 'kitchen' }, categories);
                    setIsConfirmOpen(false);
                  }}
                  className="w-full py-4 bg-gray-50 hover:bg-orange-50 border-2 border-transparent hover:border-orange-500 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-gray-700"
                >
                  <Printer size={20} className="text-orange-500" />
                  {t('admin.cashier_print_kitchen')}
                </button>

                <button
                  onClick={() => {
                    printOrder(pendingOrderResponse, settings, t, isRTL, { type: 'both' }, categories);
                    setIsConfirmOpen(false);
                  }}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl flex items-center justify-center gap-3 transition-all font-bold shadow-lg shadow-orange-200"
                >
                  <Printer size={20} />
                  {t('admin.cashier_print_both')}
                </button>

                <button
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setPendingOrderResponse(null);
                  }}
                  className="w-full py-4 text-gray-400 hover:text-gray-600 font-bold transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Products Section */}
      <div className={`flex-1 flex flex-col gap-4 overflow-hidden ${showCartOnMobile ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t('admin.cashier_search_placeholder')}
              className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={() => setShowHistory(true)}
              className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 text-gray-600 relative shrink-0 shadow-sm"
              title={t('admin.cashier_history_title')}
            >
              <History className="w-6 h-6" />
            </button>
            {heldCarts.length > 0 && (
              <div className="flex gap-1 overflow-x-auto max-w-[200px]">
                {heldCarts.map(hold => (
                  <button
                    key={hold.id}
                    onClick={() => handleRestoreHold(hold.id)}
                    className="px-4 py-3 bg-orange-100 text-orange-700 rounded-2xl text-xs font-bold whitespace-nowrap hover:bg-orange-200 transition-all shadow-sm"
                  >
                    {hold.customer.name || hold.id}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Improved Category Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === 'all' ? 'bg-orange-600 text-white translate-y-[-2px]' : 'bg-white text-gray-600 border border-gray-50 hover:bg-gray-50'}`}
          >
            {t('admin.cashier_all_categories')}
          </button>
          <button
            onClick={() => setSelectedCategory('offers')}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${selectedCategory === 'offers' ? 'bg-orange-600 text-white translate-y-[-2px]' : 'bg-white text-gray-600 border border-gray-50 hover:bg-gray-50 text-orange-600'}`}
          >
            <Tag size={18} />
            {t('admin.offers')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat.id ? 'bg-orange-600 text-white translate-y-[-2px]' : 'bg-white text-gray-600 border border-gray-50 hover:bg-gray-50'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-4">
          {selectedCategory === 'offers' ? (
            offers.map(offer => {
              const cartItem = cart.find(item => item.id === `offer_${offer.id}`);
              return (
                <motion.button
                  key={offer.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addOfferToCart(offer)}
                  className={`bg-white rounded-3xl border-2 ${cartItem ? 'border-orange-500 ring-4 ring-orange-50' : 'border-transparent'} shadow-sm hover:shadow-xl transition-all ${isRTL ? 'text-right' : 'text-left'} flex flex-col h-full relative group overflow-hidden`}
                >
                  {cartItem && (
                    <div className="absolute top-3 right-3 bg-orange-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center z-10 shadow-lg">
                      {cartItem.quantity}
                    </div>
                  )}
                  <div className="relative aspect-video overflow-hidden">
                    {offer.imageUrl && offer.imageUrl.trim() !== '' ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                        <Tag className="w-8 h-8 text-orange-200" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
                      <div className="bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-lg backdrop-blur-sm shadow-sm">
                        {t('offers.limited')}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-gray-900 mb-1 line-clamp-1 leading-tight">{offer.title}</h3>
                    <div className="mt-auto flex items-end justify-between">
                      <p className="text-orange-600 font-black text-lg">{offer.price} <span className="text-[10px] font-bold opacity-80">{t('admin.cashier_receipt_currency')}</span></p>
                    </div>
                  </div>
                </motion.button>
              );
            })
          ) : (
            filteredProducts.map(product => {
              const cartItem = cart.find(item => item.id === String(product.id));
              return (
                <motion.button
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(product)}
                  className={`bg-white rounded-3xl border-2 ${cartItem ? 'border-orange-500 ring-4 ring-orange-50' : 'border-transparent'} shadow-sm hover:shadow-xl transition-all ${isRTL ? 'text-right' : 'text-left'} flex flex-col h-full relative group overflow-hidden`}
                >
                  {cartItem && (
                    <div className="absolute top-3 right-3 bg-orange-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center z-10 shadow-lg">
                      {cartItem.quantity}
                    </div>
                  )}
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {product.imageUrl && product.imageUrl.trim() !== '' ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-gray-900 mb-1 line-clamp-2 leading-tight min-h-[2.5rem]">{product.name}</h3>
                    <div className="mt-auto pt-2 flex items-end justify-between">
                      <div className={`text-orange-600 font-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {product.sizes && product.sizes.length > 0 && (
                          <span className="text-[9px] text-gray-400 block font-bold leading-none mb-1">
                            {t('product.starting_from') || 'Starting from'}
                          </span>
                        )}
                        <span className="text-xl">{product.price}</span> <span className="text-[10px] font-bold opacity-80">{t('admin.cashier_receipt_currency')}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Plus size={18} />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className={`w-full lg:w-[400px] bg-white lg:rounded-3xl border border-gray-100 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${showCartOnMobile ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:flex'}`}>
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
            <h2 className="text-xl font-black flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-orange-500" />
              {t('admin.cashier_title')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCartOnMobile(false)}
                className="lg:hidden p-2 text-gray-400 hover:text-orange-500 transition-colors"
                title={t('common.close')}
              >
                <X size={24} />
              </button>
              <button 
                onClick={handleHoldOrder}
                disabled={cart.length === 0}
                className="p-3 bg-orange-50 text-orange-600 rounded-2xl hover:bg-orange-100 transition-colors disabled:opacity-30 shadow-sm"
                title={t('admin.cashier_hold_order')}
              >
                <History size={20} />
              </button>
              <button 
                onClick={clearCart}
                className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm"
                title={t('admin.cashier_clear_cart')}
              >
                <Trash2 size={20} />
              </button>
            </div>
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

            {customerData && settings?.features?.enablePoints && (
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
                      disabled={customerData.points < (settings?.pointsConfig?.minPointsToRedeem || 0)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                {customerData.points < (settings?.pointsConfig?.minPointsToRedeem || 0) ? (
                  <p className={`text-[10px] text-orange-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('admin.points_min_required').replace('{min}', settings?.pointsConfig?.minPointsToRedeem)}
                  </p>
                ) : (
                  <p className={`text-[10px] text-orange-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('cart.points_redeem_value').replace('{value}', pointsValue.toString())}
                  </p>
                )}
              </motion.div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-bold text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                {t('admin.cashier_order_type')}
              </label>
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
                <button
                  onClick={() => setCustomerInfo(prev => ({ ...prev, type: 'dine_in' }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${customerInfo.type === 'dine_in' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                >
                  {t('admin.cashier_dine_in')}
                </button>
              </div>
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

            {customerInfo.type === 'dine_in' && (
              <div className="relative">
                <UtensilsCrossed className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
                <select
                  className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white`}
                  value={customerInfo.tableId}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, tableId: e.target.value }))}
                >
                  <option value="">{t('admin.tables_select') || 'Select Table'}</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.name} ({table.capacity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className={`text-xs font-bold text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                {t('admin.cashier_payment_method')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {settings?.paymentMethods && Object.entries(settings.paymentMethods).map(([method, enabled]) => {
                  if (!enabled) return null;
                  return (
                    <button
                      key={method}
                      onClick={() => setCustomerInfo(prev => ({ ...prev, paymentMethod: method }))}
                      className={`py-3 rounded-2xl text-xs font-black transition-all shadow-sm ${customerInfo.paymentMethod === method ? 'bg-orange-600 text-white scale-[1.02]' : 'bg-white text-gray-500 border border-gray-100'}`}
                    >
                      {t(`cart.${method}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {settings?.features?.enableCoupons && (
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
            {taxAmount > 0 && (
              <div className={`flex justify-between items-center text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('admin.settings_tax_rate')} ({settings.taxConfig.taxRate}%)</span>
                <span>{taxAmount.toFixed(2)} {t('admin.cashier_receipt_currency')}</span>
              </div>
            )}
            {serviceAmount > 0 && (
              <div className={`flex justify-between items-center text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('admin.settings_service_rate')} ({settings.taxConfig.serviceChargeRate}%)</span>
                <span>{serviceAmount.toFixed(2)} {t('admin.cashier_receipt_currency')}</span>
              </div>
            )}
            {customerInfo.type === 'delivery' && (
              <div className={`flex justify-between items-center text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('cart.delivery_fee')}</span>
                <span>{settings?.deliveryFee || 0} {t('admin.cashier_receipt_currency')}</span>
              </div>
            )}
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
            <div className={`flex justify-between items-center text-sm text-red-600 font-medium ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>{t('admin.cashier_manual_discount')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-16 p-1 border border-gray-200 rounded text-xs text-center outline-none"
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(Number(e.target.value))}
                />
                <span>{t('admin.cashier_receipt_currency')}</span>
              </div>
            </div>
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
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{t('admin.cashier_recent_orders')}</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {recentOrders.map(order => {
                  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                  return (
                    <div key={order.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <p className="font-bold text-gray-900">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => printReceipt({ ...order, items })}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                          >
                            <Printer size={18} />
                            {t('admin.cashier_print')}
                          </button>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-100">
                        <div className="space-y-1">
                          {Array.isArray(items) && items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs text-gray-600">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{item.price * item.quantity} {t('admin.cashier_receipt_currency')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-between font-bold text-sm text-orange-600">
                          <span>{t('admin.cashier_total')}</span>
                          <span>{order.total} {t('admin.cashier_receipt_currency')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
