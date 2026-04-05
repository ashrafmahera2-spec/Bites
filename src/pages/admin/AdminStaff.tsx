import React, { useState, useEffect } from 'react';
import { UserPlus, User, Shield, Trash2, Edit2, Check, X, Lock, Building2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

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
  const { t, isRTL } = useLanguage();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
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
      const data = await api.getStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error(t('admin.staff_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateStaff(editingId, formData);
        toast.success(t('admin.staff_updated_success'));
      } else {
        await api.addStaff(formData);
        toast.success(t('admin.staff_added_success'));
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: '', username: '', password: '', role: 'staff', isActive: true });
      fetchStaff();
    } catch (error) {
      toast.error(t('admin.staff_save_error'));
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      await api.deleteStaff(staffToDelete);
      toast.success(t('admin.staff_deleted_success'));
      fetchStaff();
    } catch (error) {
      toast.error(t('admin.staff_delete_error'));
    } finally {
      setStaffToDelete(null);
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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setStaffToDelete(null); }}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('admin.staff_delete_confirm')}
        type="danger"
      />
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-orange-500" />
          {t('admin.staff_management')}
        </h2>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ name: '', username: '', password: '', role: 'staff', isActive: true });
          }}
          className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
        >
          {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isAdding ? t('common.cancel') : t('admin.staff_add_new')}
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
                <label className="text-sm font-bold text-gray-600">{t('admin.staff_full_name')}</label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                  <input
                    type="text"
                    required
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none`}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">{t('admin.staff_username')}</label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                  <input
                    type="text"
                    required
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none`}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">
                  {t('admin.staff_password')} {editingId && `(${t('admin.staff_password_hint')})`}
                </label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                  <input
                    type="password"
                    required={!editingId}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">{t('admin.staff_role_select')}</label>
                <div className="relative">
                  <Shield className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                  <select
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none appearance-none`}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="admin">{t('admin.role_admin')}</option>
                    <option value="staff">{t('admin.role_staff')}</option>
                    <option value="cashier">{t('admin.role_cashier')}</option>
                    <option value="kitchen">{t('admin.staff_role_kitchen')}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">{t('admin.staff_branch_select')}</label>
                <div className="relative">
                  <Building2 className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                  <select
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none appearance-none`}
                    value={formData.branchId || ''}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">{t('admin.staff_all_branches')}</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`flex items-center gap-3 pt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? (isRTL ? 'left-7' : 'right-7') : (isRTL ? 'left-1' : 'right-1')}`} />
                </button>
                <span className="text-sm font-bold text-gray-600">{t('admin.staff_active_account')}</span>
              </div>
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all"
                >
                  {editingId ? t('admin.staff_update') : t('admin.staff_save')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} min-w-[800px]`}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">{t('admin.staff_table_member')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">{t('admin.staff_table_branch')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">{t('admin.staff_table_username')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">{t('admin.staff_table_role')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">{t('admin.staff_table_status')}</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-600">{t('admin.staff_table_date')}</th>
                <th className={`px-6 py-4 text-sm font-bold text-gray-600 ${isRTL ? 'text-left' : 'text-right'}`}>{t('admin.staff_table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold shrink-0">
                        {member.name[0]}
                      </div>
                      <span className="font-bold text-gray-800 whitespace-nowrap">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                    {branches.find(b => b.id === member.branchId)?.name || t('common.unspecified')}
                  </td>
                  <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{member.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                      member.role === 'cashier' ? 'bg-blue-100 text-blue-600' :
                      member.role === 'kitchen' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {member.role === 'admin' ? t('admin.role_admin') : 
                       member.role === 'cashier' ? t('admin.role_cashier') : 
                       member.role === 'kitchen' ? t('admin.staff_role_kitchen') : 
                       t('admin.role_staff')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`flex items-center gap-1 text-xs font-bold ${member.isActive ? 'text-green-500' : 'text-red-500'} ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {member.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {member.isActive ? t('admin.staff_status_active') : t('admin.staff_status_inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm whitespace-nowrap">
                    {new Date(member.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                      <button
                        onClick={() => startEdit(member)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setStaffToDelete(member.id); setIsConfirmOpen(true); }}
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
        </div>
        {staff.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-400">{t('admin.staff_no_members')}</div>
        )}
      </div>
    </div>
  );
}
