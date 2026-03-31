import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Check, X, Edit2, Trash2, Plus, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { api } from '../../services/api';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsappNumber: string;
  deliveryFee: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    whatsappNumber: '',
    deliveryFee: 0,
    isActive: true
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error('خطأ في تحميل الفروع');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateBranch(editingId, formData);
        toast.success('تم تحديث الفرع بنجاح');
      } else {
        await api.addBranch(formData);
        toast.success('تم إضافة الفرع بنجاح');
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', address: '', phone: '', whatsappNumber: '', deliveryFee: 0, isActive: true });
      fetchBranches();
    } catch (error) {
      toast.error('خطأ في حفظ البيانات');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;
    try {
      await api.deleteBranch(id);
      toast.success('تم حذف الفرع بنجاح');
      fetchBranches();
    } catch (error) {
      toast.error('خطأ في الحذف');
    }
  };

  const startEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      whatsappNumber: branch.whatsappNumber || '',
      deliveryFee: branch.deliveryFee || 0,
      isActive: branch.isActive
    });
    setIsAdding(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-7 h-7 text-orange-500" />
          إدارة الفروع
        </h2>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ name: '', address: '', phone: '', whatsappNumber: '', deliveryFee: 0, isActive: true });
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'إلغاء' : 'إضافة فرع جديد'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl"
          >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">اسم الفرع</label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: فرع كفر البطيخ الرئيسي"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="مثال: 01012345678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">رقم واتساب (للطلبات)</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="مثال: 201012345678"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">رسوم التوصيل (ج.م)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <label className="text-sm font-bold text-gray-600">العنوان بالتفصيل</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="العنوان الكامل للفرع"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-8">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'right-7' : 'right-1'}`} />
                </button>
                <span className="text-sm font-bold text-gray-600">فرع نشط</span>
              </div>
              <div className="pt-6 lg:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all"
                >
                  {editingId ? 'تحديث بيانات الفرع' : 'إضافة الفرع'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">اسم الفرع</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">العنوان</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">التوصيل</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">الحالة</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {branches.map((branch) => (
              <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block">{branch.name}</span>
                      <span className="text-xs text-gray-400">{branch.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{branch.address}</td>
                <td className="px-6 py-4 text-gray-600">{branch.deliveryFee} ج.م</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 text-xs font-bold ${branch.isActive ? 'text-green-500' : 'text-red-500'}`}>
                    {branch.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {branch.isActive ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(branch)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(branch.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {branches.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-400">لا يوجد فروع حالياً</div>
        )}
      </div>
    </div>
  );
}
