import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import Navbar from '../components/Navbar';
import { Trash2, Plus, Minus, Send, MapPin, Truck, Store, CreditCard, Wallet, Banknote, ShoppingBag, CheckCircle2, X, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
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
}

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
  deliveryFee?: number;
}

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, total, clearCart, branchId, setBranchId } = useCart();
  const { t, isRTL, language } = useLanguage();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay' | 'card' | 'wallet'>('cash');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  const activeBranch = React.useMemo(() => {
    return branches.find(b => b.id === branchId);
  }, [branches, branchId]);

  const activeWhatsApp = activeBranch?.whatsappNumber || settings?.whatsappNumber;
  const activeDeliveryFee = orderType === 'delivery' 
    ? (activeBranch?.deliveryFee !== undefined && activeBranch?.deliveryFee !== null ? activeBranch.deliveryFee : (settings?.deliveryFee || 0))
    : 0;

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

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFillColor(234, 88, 12); // Orange 600
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text(settings?.restaurantName || "Bite's Menu", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(t('cart.order_invoice'), 105, 30, { align: 'center' });

    // Customer Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t('cart.customer_details'), 20, 55);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`${isRTL ? 'الاسم' : 'Name'}: ${customerInfo.name}`, 20, 65);
    doc.text(`${isRTL ? 'الموبايل' : 'Phone'}: ${customerInfo.phone}`, 20, 72);
    doc.text(`${isRTL ? 'نوع الطلب' : 'Order Type'}: ${orderType === 'delivery' ? t('cart.delivery') : t('cart.pickup')}`, 20, 79);
    if (orderType === 'delivery') {
      doc.text(`${isRTL ? 'العنوان' : 'Address'}: ${customerInfo.address}`, 20, 86);
    }

    doc.text(`${t('cart.date')}: ${new Date().toLocaleString(isRTL ? 'ar-EG' : 'en-US')}`, 190, 65, { align: 'right' });
    doc.text(`${t('cart.order_id')}: #${Math.floor(Math.random() * 1000000)}`, 190, 72, { align: 'right' });

    // Items Table
    const tableData = items.map(item => [
      item.name,
      item.quantity.toString(),
      `${item.price} ${t('common.currency')}`,
      `${item.price * item.quantity} ${t('common.currency')}`
    ]);

    autoTable(doc, {
      startY: 95,
      head: [[isRTL ? 'المنتج' : 'Item', isRTL ? 'الكمية' : 'Qty', isRTL ? 'السعر' : 'Price', isRTL ? 'الإجمالي' : 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const deliveryFee = activeDeliveryFee;
    
    doc.setFontSize(11);
    doc.text(`${t('cart.subtotal')}: ${total} ${t('common.currency')}`, 190, finalY, { align: 'right' });
    doc.text(`${t('cart.delivery_fee')}: ${deliveryFee} ${t('common.currency')}`, 190, finalY + 7, { align: 'right' });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(234, 88, 12);
    doc.text(`${t('cart.total')}: ${total + deliveryFee} ${t('common.currency')}`, 190, finalY + 17, { align: 'right' });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(t('cart.thank_you'), 105, pageHeight - 20, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`${t('common.developed_by')} mamlinc`, 105, pageHeight - 10, { align: 'center' });

    doc.save(`invoice-${Date.now()}.pdf`);
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

  const sendToWhatsApp = async () => {
    if (!validateForm()) {
      toast.error(t('cart.validation_error'));
      return;
    }
    
    if (!activeWhatsApp) return;
    
    setIsSubmitting(true);
    const deliveryFee = activeDeliveryFee;
    const finalTotal = total + deliveryFee;
    
    // Save to MySQL via API
    try {
      await api.createOrder({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        address: orderType === 'delivery' ? customerInfo.address : t('cart.pickup_location'),
        type: orderType,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: finalTotal,
        paymentMethod,
        screenshot: screenshot || null,
        status: 'pending',
        branchId: branchId || undefined
      });
      
      let message = isRTL ? `*طلب جديد من Bite's*\n\n` : `*New Order from Bite's*\n\n`;
      message += isRTL ? `*الاسم:* ${customerInfo.name}\n` : `*Name:* ${customerInfo.name}\n`;
      message += isRTL ? `*الموبايل:* ${customerInfo.phone}\n` : `*Phone:* ${customerInfo.phone}\n`;
      
      if (branchId) {
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
          message += isRTL ? `*الفرع:* ${branch.name}\n` : `*Branch:* ${branch.name}\n`;
        }
      }

      message += isRTL ? `*النوع:* ${orderType === 'delivery' ? 'توصيل 🚚' : 'استلام من المكان 🏪'}\n` : `*Type:* ${orderType === 'delivery' ? 'Delivery 🚚' : 'Pickup 🏪'}\n`;
      if (orderType === 'delivery') message += isRTL ? `*العنوان:* ${customerInfo.address}\n` : `*Address:* ${customerInfo.address}\n`;
      message += isRTL ? `*طريقة الدفع:* ${
        paymentMethod === 'cash' ? 'كاش 💵' : 
        paymentMethod === 'instapay' ? 'انستا باي 📱' : 
        paymentMethod === 'wallet' ? 'محفظة كاش 📱' : 'فيزا 💳'
      }\n` : `*Payment Method:* ${
        paymentMethod === 'cash' ? 'Cash 💵' : 
        paymentMethod === 'instapay' ? 'InstaPay 📱' : 
        paymentMethod === 'wallet' ? 'Mobile Wallet 📱' : 'Visa 💳'
      }\n`;
      
      if (paymentMethod === 'wallet') {
        message += isRTL ? `*تم إرفاق صورة التحويل في النظام ✅*\n` : `*Transfer screenshot attached in system ✅*\n`;
      }

      message += isRTL ? `\n*الطلبات:*\n` : `\n*Items:*\n`;
      
      items.forEach(item => {
        message += `- ${item.name} (x${item.quantity}) = ${item.price * item.quantity} ${t('common.currency')}\n`;
      });
      
      message += isRTL ? `\n*المجموع:* ${total} ج.م` : `\n*Subtotal:* ${total} EGP`;
      if (orderType === 'delivery') message += isRTL ? `\n*خدمة التوصيل:* ${deliveryFee} ج.م` : `\n*Delivery Fee:* ${deliveryFee} EGP`;
      message += isRTL ? `\n*الإجمالي النهائي:* ${finalTotal} ج.م` : `\n*Final Total:* ${finalTotal} EGP`;
      
      if (customerInfo.notes) message += isRTL ? `\n\n*ملاحظات:* ${customerInfo.notes}` : `\n\n*Notes:* ${customerInfo.notes}`;
      
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${activeWhatsApp}?text=${encodedMessage}`, '_blank');
      
      setIsSuccessModalOpen(true);
      clearCart();
    } catch (e) {
      console.error("Error creating order:", e);
      toast.error(isRTL ? 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى' : 'Error sending order, please try again');
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
                  <p className="text-sm font-bold text-gray-700">{isRTL ? 'اختر الفرع' : 'Select Branch'}</p>
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
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span>{total} {t('common.currency')}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('cart.delivery_fee')}</span>
                    <span>{activeDeliveryFee} {t('common.currency')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                  <span>{t('cart.total')}</span>
                  <span>{total + activeDeliveryFee} {t('common.currency')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <button
                  onClick={sendToWhatsApp}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      {t('cart.send_whatsapp')}
                    </>
                  )}
                </button>
                <button
                  onClick={generatePDF}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-all"
                >
                  {t('cart.download_pdf')}
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
                  {isRTL ? 'نعم، مسح' : 'Yes, Clear'}
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
                  onClick={generatePDF}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  {t('cart.download_pdf')}
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
