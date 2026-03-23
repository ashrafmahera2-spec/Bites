import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import Navbar from '../components/Navbar';
import { Trash2, Plus, Minus, Send, MapPin, Truck, Store, CreditCard, Wallet, Banknote, ShoppingBag, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';

interface Settings {
  whatsappNumber: string;
  walletNumber: string;
  deliveryFee: number;
  paymentMethods: {
    cash: boolean;
    instapay: boolean;
    card: boolean;
    wallet: boolean;
  };
}

const CartPage: React.FC = () => {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'instapay' | 'card' | 'wallet'>('cash');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
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

    doc.setFontSize(22);
    doc.text("Bite's Menu - Invoice", 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Customer: ${customerInfo.name}`, 20, 40);
    doc.text(`Phone: ${customerInfo.phone}`, 20, 50);
    doc.text(`Type: ${orderType === 'delivery' ? 'Delivery' : 'Pickup'}`, 20, 60);
    if (orderType === 'delivery') {
      doc.text(`Address: ${customerInfo.address}`, 20, 70);
    }
    
    doc.line(20, 80, 190, 80);
    
    let y = 90;
    items.forEach(item => {
      doc.text(`${item.name} x ${item.quantity}`, 20, y);
      doc.text(`${item.price * item.quantity} EGP`, 170, y, { align: 'right' });
      y += 10;
    });
    
    doc.line(20, y, 190, y);
    y += 10;
    
    const deliveryFee = orderType === 'delivery' ? (settings?.deliveryFee || 0) : 0;
    doc.text(`Subtotal: ${total} EGP`, 170, y, { align: 'right' });
    y += 10;
    doc.text(`Delivery Fee: ${deliveryFee} EGP`, 170, y, { align: 'right' });
    y += 10;
    doc.setFontSize(18);
    doc.text(`Total: ${total + deliveryFee} EGP`, 170, y, { align: 'right' });
    
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

  const sendToWhatsApp = async () => {
    if (!settings?.whatsappNumber) return;
    
    const deliveryFee = orderType === 'delivery' ? (settings.deliveryFee || 0) : 0;
    const finalTotal = total + deliveryFee;
    
    // Save to MySQL via API
    try {
      await api.createOrder({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        address: orderType === 'delivery' ? customerInfo.address : 'استلام من المكان',
        type: orderType,
        items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: finalTotal,
        paymentMethod,
        screenshot: screenshot || null,
        status: 'pending'
      });
    } catch (e) {
      console.error("Error creating order:", e);
    }

    let message = `*طلب جديد من Bite's*\n\n`;
    message += `*الاسم:* ${customerInfo.name}\n`;
    message += `*الموبايل:* ${customerInfo.phone}\n`;
    message += `*النوع:* ${orderType === 'delivery' ? 'توصيل 🚚' : 'استلام من المكان 🏪'}\n`;
    if (orderType === 'delivery') message += `*العنوان:* ${customerInfo.address}\n`;
    message += `*طريقة الدفع:* ${
      paymentMethod === 'cash' ? 'كاش 💵' : 
      paymentMethod === 'instapay' ? 'انستا باي 📱' : 
      paymentMethod === 'wallet' ? 'محفظة كاش 📱' : 'فيزا 💳'
    }\n`;
    
    if (paymentMethod === 'wallet') {
      message += `*تم إرفاق صورة التحويل في النظام ✅*\n`;
    }

    message += `\n*الطلبات:*\n`;
    
    items.forEach(item => {
      message += `- ${item.name} (x${item.quantity}) = ${item.price * item.quantity} ج.م\n`;
    });
    
    message += `\n*المجموع:* ${total} ج.م`;
    if (orderType === 'delivery') message += `\n*خدمة التوصيل:* ${deliveryFee} ج.م`;
    message += `\n*الإجمالي النهائي:* ${finalTotal} ج.م`;
    
    if (customerInfo.notes) message += `\n\n*ملاحظات:* ${customerInfo.notes}`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodedMessage}`, '_blank');
    
    setIsSuccessModalOpen(true);
    clearCart();
  };

  if (items.length === 0 && !isSuccessModalOpen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
          <div className="bg-orange-100 p-6 rounded-full mb-6">
            <ShoppingBag size={64} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">سلة المشتريات فارغة</h2>
          <p className="text-gray-500 mb-8">ابدأ بإضافة بعض الوجبات اللذيذة للمنيو</p>
          <a href="/" className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all">
            تصفح المنيو
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
            <h2 className="text-2xl font-bold text-gray-900">سلة المشتريات</h2>
            <button 
              onClick={() => setIsClearConfirmOpen(true)}
              className="text-red-500 text-sm font-bold flex items-center gap-1 hover:bg-red-50 px-3 py-1 rounded-full transition-colors"
            >
              <Trash2 size={16} />
              مسح السلة
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
                  <p className="text-orange-600 font-bold">{item.price} ج.م</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-white rounded-full transition-colors">
                    <Minus size={16} className="text-orange-600" />
                  </button>
                  <span className="font-bold text-gray-900 min-w-[20px] text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white rounded-full transition-colors">
                    <Plus size={16} className="text-orange-600" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <Trash2 size={20} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Checkout Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">تفاصيل الطلب</h3>
            
            <div className="space-y-4">
              {/* Order Type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    orderType === 'delivery' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <Truck size={20} />
                  توصيل
                </button>
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    orderType === 'pickup' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                  }`}
                >
                  <Store size={20} />
                  استلام
                </button>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="الاسم بالكامل"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                  value={customerInfo.name}
                  onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />
                <input
                  type="tel"
                  placeholder="رقم الموبايل"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                  value={customerInfo.phone}
                  onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                />
                {orderType === 'delivery' && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                    <textarea
                      placeholder="العنوان بالتفصيل"
                      className="w-full p-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px]"
                      value={customerInfo.address}
                      onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    />
                  </div>
                )}
                <textarea
                  placeholder="ملاحظات إضافية"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[60px]"
                  value={customerInfo.notes}
                  onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">طريقة الدفع</p>
                <div className="grid grid-cols-1 gap-2">
                  {settings?.paymentMethods.cash && (
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'cash' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      <Banknote size={20} />
                      كاش عند الاستلام
                    </button>
                  )}
                  {settings?.paymentMethods.instapay && (
                    <button
                      onClick={() => setPaymentMethod('instapay')}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'instapay' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      <Wallet size={20} />
                      انستا باي (InstaPay)
                    </button>
                  )}
                  {settings?.paymentMethods.card && (
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'card' ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-500'
                      }`}
                    >
                      <CreditCard size={20} />
                      فيزا / ماستر كارد
                    </button>
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
                        محفظة إلكترونية (كاش)
                      </button>
                      
                      {paymentMethod === 'wallet' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-orange-50 rounded-2xl border border-orange-100 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">رقم التحويل:</span>
                            <span className="font-bold text-orange-600">{settings.walletNumber}</span>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500">أرفق صورة التحويل (سكرين شوت)</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleScreenshotChange}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-700"
                            />
                            {screenshot && (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-orange-200">
                                <img src={screenshot} alt="Screenshot" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => setScreenshot(null)}
                                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg"
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
                  <span>المجموع</span>
                  <span>{total} ج.م</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>خدمة التوصيل</span>
                    <span>{settings?.deliveryFee || 0} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2">
                  <span>الإجمالي</span>
                  <span>{total + (orderType === 'delivery' ? (settings?.deliveryFee || 0) : 0)} ج.م</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <button
                  onClick={sendToWhatsApp}
                  disabled={
                    !customerInfo.name || 
                    !customerInfo.phone || 
                    (orderType === 'delivery' && !customerInfo.address) ||
                    (paymentMethod === 'wallet' && !screenshot)
                  }
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                  <Send size={20} />
                  إرسال الطلب للواتساب
                </button>
                <button
                  onClick={generatePDF}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-all"
                >
                  تحميل الفاتورة (PDF)
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">مسح السلة؟</h3>
              <p className="text-gray-500 mb-6">هل أنت متأكد من رغبتك في حذف جميع المنتجات من السلة؟</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => { clearCart(); setIsClearConfirmOpen(false); }}
                  className="bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  نعم، مسح
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">تم إرسال طلبك بنجاح!</h3>
              <p className="text-gray-500 mb-8">شكراً لاختيارك Bite's. سيتم التواصل معك قريباً عبر الواتساب لتأكيد الطلب.</p>
              <button
                onClick={() => { setIsSuccessModalOpen(false); window.location.href = '/'; }}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
              >
                العودة للمنيو
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartPage;
