import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Phone, MapPin, Search, Plus, Minus, Trash2, CheckCircle, Printer, History, X, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { api } from '../../services/api';

import { useAuth } from '../../contexts/AuthContext';

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

export default function AdminCashier() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>(user?.role === 'admin' ? '' : (user?.branchId || ''));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    type: 'takeaway' as 'takeaway' | 'delivery'
  });
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchData();
    fetchRecentOrders();
  }, [selectedBranchId]);

  useEffect(() => {
    fetchBranches();
  }, []);

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
      toast.error('خطأ في تحميل البيانات');
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

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const printReceipt = (order: Order) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150] // Receipt size
    });

    doc.setFontSize(14);
    doc.text("Bite's Restaurant", 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`رقم الطلب: #${order.id.toString().slice(-6)}`, 10, 18);
    doc.text(`التاريخ: ${new Date(order.createdAt).toLocaleString('ar-EG')}`, 10, 22);
    doc.text('--------------------------------', 10, 26);
    
    doc.text(`العميل: ${order.customerName}`, 10, 30);
    doc.text(`الهاتف: ${order.customerPhone}`, 10, 34);
    doc.text(`النوع: ${order.type === 'delivery' ? 'توصيل' : 'استلام'}`, 10, 38);
    doc.text('--------------------------------', 10, 42);

    let y = 46;
    order.items.forEach(item => {
      doc.text(`${item.name} x${item.quantity}`, 10, y);
      doc.text(`${item.price * item.quantity} ج.م`, 70, y, { align: 'right' });
      y += 4;
    });

    doc.text('--------------------------------', 10, y);
    y += 4;
    doc.setFontSize(10);
    doc.text(`الإجمالي: ${order.total} ج.م`, 70, y, { align: 'right' });
    
    doc.save(`receipt-${order.id}.pdf`);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('السلة فارغة');
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('يرجى إدخال اسم ورقم هاتف العميل');
      return;
    }
    if (!selectedBranchId) {
      toast.error('يرجى اختيار الفرع');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        address: customerInfo.address || 'كاشير - استلام من المطعم',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total,
        type: customerInfo.type,
        paymentMethod: 'cash',
        status: 'completed',
        branchId: selectedBranchId
      };

      const response = await api.createOrder(orderData);
      
      toast.success('تم تسجيل الطلب بنجاح');
      
      // Ask to print
      if (window.confirm('هل تريد طباعة الإيصال؟')) {
        printReceipt(response);
      }

      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '', type: 'takeaway' });
      fetchRecentOrders();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error('خطأ في تسجيل الطلب');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden" dir="rtl">
      {/* Products Section */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث عن منتج..."
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">كل الأقسام</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600"
            title="سجل الطلبات"
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
              className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-right flex flex-col h-full"
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
              <p className="text-orange-600 font-bold mt-auto">{product.price} ج.م</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-500" />
            الطلب الحالي
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {cart.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-gray-800">{item.name}</h4>
                  <p className="text-xs text-gray-500">{item.price} ج.م</p>
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
              <p>السلة فارغة</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-500"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                disabled={user?.role !== 'admin'}
              >
                <option value="">اختر الفرع</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="اسم العميل"
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="رقم الهاتف"
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCustomerInfo(prev => ({ ...prev, type: 'takeaway' }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${customerInfo.type === 'takeaway' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                استلام
              </button>
              <button
                onClick={() => setCustomerInfo(prev => ({ ...prev, type: 'delivery' }))}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${customerInfo.type === 'delivery' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
              >
                توصيل
              </button>
            </div>
            {customerInfo.type === 'delivery' && (
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="العنوان بالتفصيل"
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-lg font-bold pt-2">
            <span>الإجمالي:</span>
            <span className="text-orange-600">{total} ج.م</span>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={loading || cart.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-200"
          >
            {loading ? 'جاري التسجيل...' : (
              <>
                <CheckCircle className="w-5 h-5" />
                تأكيد الطلب
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
                <h3 className="text-xl font-bold">آخر الطلبات</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <p className="font-bold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                      <p className="text-sm font-bold text-orange-600 mt-1">{order.total} ج.م</p>
                    </div>
                    <button 
                      onClick={() => printReceipt(order)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                    >
                      <Printer size={18} />
                      طباعة
                    </button>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-center text-gray-400 py-12">لا توجد طلبات سابقة</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
