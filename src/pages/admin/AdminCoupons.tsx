import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Calendar,
  Hash,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { toast } from 'sonner';
import ConfirmModal from '../../components/ConfirmModal';

interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount?: number;
  expiryDate?: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

const AdminCoupons = () => {
  const { t, isRTL } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minOrder: 0,
    maxDiscount: 0,
    expiryDate: '',
    usageLimit: 0,
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await api.getCoupons();
      setCoupons(data);
    } catch (error) {
      toast.error(t('admin.coupons_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount || 0,
        expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
        usageLimit: coupon.usageLimit,
        isActive: coupon.isActive
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        type: 'percentage',
        value: 0,
        minOrder: 0,
        maxDiscount: 0,
        expiryDate: '',
        usageLimit: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.id, formData);
        toast.success(t('admin.coupons_updated_success'));
      } else {
        await api.addCoupon(formData);
        toast.success(t('admin.coupons_added_success'));
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      toast.error(t('admin.coupons_save_error'));
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;
    try {
      await api.deleteCoupon(couponToDelete);
      toast.success(t('admin.coupons_deleted_success'));
      fetchCoupons();
    } catch (error) {
      toast.error(t('admin.coupons_delete_error'));
    } finally {
      setIsDeleteModalOpen(false);
      setCouponToDelete(null);
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h2 className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Ticket className="text-orange-600" />
            {t('admin.nav_coupons')}
          </h2>
          <p className={`text-gray-500 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('admin.coupons_subtitle')}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className={`flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus size={20} />
          {t('admin.coupons_add_new')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-4 border-b border-gray-50 ${isRTL ? 'flex justify-end' : ''}`}>
          <div className={`relative w-full max-w-md ${isRTL ? 'text-right' : ''}`}>
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
            <input
              type="text"
              placeholder={t('admin.coupons_search_placeholder')}
              className={`w-full py-2 rounded-xl border border-gray-100 outline-none focus:border-orange-600 transition-all ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`bg-gray-50/50 ${isRTL ? 'text-right' : 'text-left'}`}>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.coupons_table_code')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.coupons_table_value')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.coupons_table_usage')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.coupons_table_expiry')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.coupons_table_status')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.coupons_table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t('admin.coupons_no_data')}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
                          <Ticket size={16} />
                        </div>
                        <span className="font-bold text-gray-900">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ${t('common.currency')}`}
                      </span>
                      {coupon.minOrder > 0 && (
                        <p className="text-xs text-gray-500">
                          {t('admin.coupons_min_order')}: {coupon.minOrder}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{coupon.usedCount} / {coupon.usageLimit || '∞'}</span>
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-orange-500" 
                            style={{ width: coupon.usageLimit ? `${(coupon.usedCount / coupon.usageLimit) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">
                        {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US') : t('admin.coupons_no_expiry')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {coupon.isActive ? t('admin.staff_status_active') : t('admin.staff_status_inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={() => handleOpenModal(coupon)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setCouponToDelete(coupon.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl"
            >
              <div className={`p-6 border-b border-gray-100 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCoupon ? t('admin.coupons_edit_title') : t('admin.coupons_add_title')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.coupons_label_code')}
                    </label>
                    <div className="relative">
                      <Hash className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={18} />
                      <input
                        type="text"
                        required
                        className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.coupons_label_type')}
                    </label>
                    <select
                      className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="percentage">{t('admin.coupons_type_percentage')}</option>
                      <option value="fixed">{t('admin.coupons_type_fixed')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.coupons_label_value')}
                    </label>
                    <input
                      type="number"
                      required
                      className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                      value={formData.value}
                      onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.coupons_label_min_order')}
                    </label>
                    <input
                      type="number"
                      className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                      value={formData.minOrder}
                      onChange={e => setFormData({ ...formData, minOrder: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.coupons_label_max_discount')}
                    </label>
                    <input
                      type="number"
                      className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                      value={formData.maxDiscount}
                      onChange={e => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.coupons_label_expiry')}
                    </label>
                    <div className="relative">
                      <Calendar className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={18} />
                      <input
                        type="date"
                        className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                        value={formData.expiryDate}
                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.coupons_label_usage_limit')}
                    </label>
                    <input
                      type="number"
                      className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                      value={formData.usageLimit}
                      onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    />
                  </div>

                  <div className="flex items-end pb-2">
                    <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-orange-600"
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span className="text-sm font-medium text-gray-700">{t('admin.staff_active_account')}</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {editingCoupon ? t('common.save') : t('common.add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('admin.coupons_delete_confirm')}
        message={t('admin.coupons_delete_desc')}
      />
    </div>
  );
};

export default AdminCoupons;
