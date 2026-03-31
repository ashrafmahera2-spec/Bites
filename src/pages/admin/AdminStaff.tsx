import React, { useState, useEffect } from 'react';
import { UserPlus, User, Shield, Trash2, Edit2, Check, X, Lock, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { api } from '../../services/api';

interface StaffMember {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'staff' | 'cashier' | 'kitchen';
  branchId?: number;
  isActive: boolean;
  createdAt: string;
}

interface Branch {
  id: number;
  name: string;
}

export default function AdminStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'staff' | 'cashier' | 'kitchen',
    branchId: undefined as number | undefined,
    isActive: true
  });

  useEffect(() => {
    fetchStaff();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setStaff(Array.isArray(data) ? data : []);
        } catch (e) {
          console.error("Failed to parse staff JSON:", text.slice(0, 100));
        }
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error('خطأ في تحميل الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/staff/${editingId}` : '/api/staff';
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingId ? 'تم تحديث الموظف' : 'تم إضافة الموظف');
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', username: '', password: '', role: 'staff', isActive: true });
        fetchStaff();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error('خطأ في حفظ البيانات');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف الموظف');
        fetchStaff();
      }
    } catch (error) {
      toast.error('خطأ في الحذف');
    }
  };

  const startEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      username: member.username,
      password: '',
      role: member.role,
      branchId: member.branchId,
      isActive: member.isActive
    });
    setIsAdding(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-orange-500" />
          إدارة الموظفين
        </h2>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ name: '', username: '', password: '', role: 'staff', isActive: true });
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? 'إلغاء' : 'إضافة موظف جديد'}
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
                <label className="text-sm font-bold text-gray-600">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">اسم المستخدم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">كلمة المرور {editingId && '(اتركها فارغة لعدم التغيير)'}</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    required={!editingId}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">الدور / الصلاحية</label>
                <div className="relative">
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="admin">مدير (Admin)</option>
                    <option value="staff">موظف (Staff)</option>
                    <option value="cashier">كاشير (Cashier)</option>
                    <option value="kitchen">مطبخ (Kitchen)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">الفرع</label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none appearance-none"
                    value={formData.branchId || ''}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">جميع الفروع / غير محدد</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
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
                <span className="text-sm font-bold text-gray-600">حساب نشط</span>
              </div>
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all"
                >
                  {editingId ? 'تحديث البيانات' : 'إضافة الموظف'}
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
              <th className="px-6 py-4 text-sm font-bold text-gray-600">الموظف</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">الفرع</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">اسم المستخدم</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">الصلاحية</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">الحالة</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600">تاريخ الإضافة</th>
              <th className="px-6 py-4 text-sm font-bold text-gray-600 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                      {member.name[0]}
                    </div>
                    <span className="font-bold text-gray-800">{member.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {branches.find(b => b.id === member.branchId)?.name || 'غير محدد'}
                </td>
                <td className="px-6 py-4 text-gray-600">{member.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    member.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                    member.role === 'cashier' ? 'bg-blue-100 text-blue-600' :
                    member.role === 'kitchen' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {member.role === 'admin' ? 'مدير' : member.role === 'cashier' ? 'كاشير' : member.role === 'kitchen' ? 'مطبخ' : 'موظف'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1 text-xs font-bold ${member.isActive ? 'text-green-500' : 'text-red-500'}`}>
                    {member.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {member.isActive ? 'نشط' : 'معطل'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(member.createdAt).toLocaleDateString('ar-EG')}
                </td>
                <td className="px-6 py-4 text-left">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(member)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
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
        {staff.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-400">لا يوجد موظفين حالياً</div>
        )}
      </div>
    </div>
  );
}

function Plus(props: any) {
  return <UserPlus {...props} />;
}
