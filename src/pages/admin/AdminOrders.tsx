import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, CheckCircle, Clock, XCircle, Phone, MapPin, Calendar, ClipboardList, Search, Eye, X, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

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
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  const fetchOrders = async () => {
    try {
      const newOrders = await api.getOrders();
      
      // Play sound if new order arrives
      if (prevOrderCount > 0 && newOrders.length > prevOrderCount) {
        const audio = new Audio(NEW_ORDER_SOUND);
        audio.play().catch(e => console.log('Audio play blocked:', e));
      }
      
      setOrders(newOrders);
      setPrevOrderCount(newOrders.length);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [prevOrderCount]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const deleteOrder = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      try {
        await api.deleteOrder(id);
        fetchOrders();
      } catch (error) {
        console.error("Error deleting order:", error);
      }
    }
  };

  const printInvoice = (order: Order) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200] // Receipt size
    });

    doc.setFontSize(16);
    doc.text('فاتورة طلب', 40, 10, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`رقم الطلب: #${order.id}`, 10, 20);
    doc.text(`التاريخ: ${new Date(order.createdAt).toLocaleString('ar-EG')}`, 10, 25);
    doc.text('--------------------------------', 10, 30);
    
    doc.text(`العميل: ${order.customerName}`, 10, 35);
    doc.text(`الهاتف: ${order.customerPhone}`, 10, 40);
    doc.text(`العنوان: ${order.address}`, 10, 45);
    doc.text('--------------------------------', 10, 50);

    let y = 55;
    order.items.forEach(item => {
      doc.text(`${item.name} x${item.quantity}`, 10, y);
      doc.text(`${item.price * item.quantity} ج.م`, 70, y, { align: 'right' });
      y += 5;
    });

    doc.text('--------------------------------', 10, y);
    y += 5;
    doc.setFontSize(12);
    doc.text(`الإجمالي: ${order.total} ج.م`, 70, y, { align: 'right' });
    
    doc.save(`invoice-${order.id}.pdf`);
  };

  const safeOrders = Array.isArray(orders) ? orders : [];

  const filteredOrders = safeOrders.filter(o => {
    const matchesFilter = filter === 'all' || o.status === filter;
    const matchesSearch = 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.customerPhone.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث بالاسم أو الرقم..."
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'pending', label: 'قيد الانتظار' },
              { id: 'completed', label: 'مكتملة' },
              { id: 'cancelled', label: 'ملغاة' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
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
              <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${
                    order.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                    order.status === 'completed' ? 'bg-green-50 text-green-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {order.status === 'pending' ? <Clock size={24} /> :
                     order.status === 'completed' ? <CheckCircle size={24} /> :
                     <XCircle size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{order.customerName}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Phone size={12} /> {order.customerPhone}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(order.createdAt).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStatus(order.id, 'completed')}
                    className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-sm font-bold hover:bg-green-100 transition-all"
                  >
                    تم التوصيل
                  </button>
                  <button
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => printInvoice(order)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="طباعة الفاتورة"
                  >
                    <Printer size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                    title="عرض التفاصيل"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">تفاصيل الطلبات</h4>
                  <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                        <span className="font-medium text-gray-700">{item.name} <span className="text-xs text-gray-400">x{item.quantity}</span></span>
                        <span className="font-bold text-gray-900">{item.price * item.quantity} ج.م</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-gray-900">الإجمالي</span>
                    <span className="text-xl font-bold text-orange-600">{order.total} ج.م</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">معلومات التوصيل</h4>
                  <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl">
                    <MapPin className="text-orange-600 mt-1" size={20} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{order.type === 'delivery' ? 'توصيل للمنزل' : 'استلام من المطعم'}</p>
                      <p className="text-sm text-gray-600 mt-1">{order.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <Phone size={16} className="text-green-600" />
                    </div>
                    <a href={`tel:${order.customerPhone}`} className="text-sm font-bold text-blue-600 hover:underline">اتصال بالعميل</a>
                  </div>
                  
                  {order.screenshot && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">صورة التحويل</h4>
                      <div className="relative group cursor-pointer" onClick={() => window.open(order.screenshot!, '_blank')}>
                        <img 
                          src={order.screenshot} 
                          alt="Payment Screenshot" 
                          className="w-full h-40 object-cover rounded-2xl border border-gray-100 shadow-sm group-hover:opacity-90 transition-opacity" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-2xl">
                          <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">فتح الصورة</span>
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
            <h3 className="text-xl font-bold text-gray-400">لا توجد طلبات حالياً</h3>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.id.toString().slice(-6)}</h3>
                  <p className="text-xs text-gray-500">{new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2">بيانات العميل</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-gray-500">الاسم:</span> <span className="font-medium">{selectedOrder.customerName}</span></p>
                      <p className="text-sm"><span className="text-gray-500">الموبايل:</span> <span className="font-medium">{selectedOrder.customerPhone}</span></p>
                      <p className="text-sm"><span className="text-gray-500">العنوان:</span> <span className="font-medium">{selectedOrder.address}</span></p>
                      <p className="text-sm"><span className="text-gray-500">نوع الطلب:</span> <span className="font-medium">{selectedOrder.type === 'delivery' ? 'توصيل' : 'استلام'}</span></p>
                      <p className="text-sm"><span className="text-gray-500">طريقة الدفع:</span> <span className="font-medium">{selectedOrder.paymentMethod}</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2">حالة الطلب</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'completed'); setSelectedOrder({...selectedOrder, status: 'completed'}); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${selectedOrder.status === 'completed' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        مكتمل
                      </button>
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'pending'); setSelectedOrder({...selectedOrder, status: 'pending'}); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${selectedOrder.status === 'pending' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                      >
                        قيد الانتظار
                      </button>
                      <button
                        onClick={() => { updateStatus(selectedOrder.id, 'cancelled'); setSelectedOrder({...selectedOrder, status: 'cancelled'}); }}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${selectedOrder.status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        ملغي
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 border-b pb-2">الأصناف المطلوبة</h4>
                  <div className="bg-gray-50 rounded-2xl overflow-hidden">
                    <table className="w-full text-right">
                      <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">الصنف</th>
                          <th className="px-4 py-3">الكمية</th>
                          <th className="px-4 py-3">السعر</th>
                          <th className="px-4 py-3">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="px-4 py-3 font-medium">{item.name}</td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">{item.price} ج.م</td>
                            <td className="px-4 py-3 font-bold">{item.price * item.quantity} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-orange-50 font-bold">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-gray-600">الإجمالي النهائي</td>
                          <td className="px-4 py-3 text-orange-600 text-lg">{selectedOrder.total} ج.م</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {selectedOrder.screenshot && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 border-b pb-2">صورة التحويل</h4>
                    <img 
                      src={selectedOrder.screenshot} 
                      alt="Payment" 
                      className="w-full rounded-2xl border border-gray-100 shadow-sm"
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
