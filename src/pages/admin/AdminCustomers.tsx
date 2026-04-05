import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Phone,
  Mail,
  Star,
  History,
  TrendingUp,
  Shield,
  ShieldOff
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { toast } from 'sonner';
import ConfirmModal from '../../components/ConfirmModal';

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  points: number;
  isActive: boolean;
  createdAt: string;
}

const AdminCustomers = () => {
  const { t, isRTL } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    points: 0,
    isActive: true
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error(t('admin.customers_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      points: customer.points,
      isActive: customer.isActive
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateCustomer(editingCustomer!.id, formData);
      toast.success(t('admin.customers_updated_success'));
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(t('admin.customers_save_error'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteCustomer(id);
      toast.success(t('admin.customers_deleted_success'));
      fetchCustomers();
    } catch (error) {
      toast.error(t('admin.customers_delete_error'));
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h2 className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Users className="text-orange-600" />
            {t('admin.nav_customers')}
          </h2>
          <p className={`text-gray-500 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('admin.customers_subtitle')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-4 border-b border-gray-50 ${isRTL ? 'flex justify-end' : ''}`}>
          <div className={`relative w-full max-w-md ${isRTL ? 'text-right' : ''}`}>
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
            <input
              type="text"
              placeholder={t('admin.customers_search_placeholder')}
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
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.customers_table_name')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.customers_table_contact')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.customers_table_points')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.customers_table_status')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.customers_table_joined')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.customers_table_actions')}</th>
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t('admin.customers_no_data')}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-1 text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className={`flex items-center gap-1 text-gray-400 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Mail size={14} />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1 font-bold text-orange-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Star size={16} fill="currentColor" />
                        <span>{customer.points}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.isActive ? t('admin.staff_status_active') : t('admin.staff_status_inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">
                        {new Date(customer.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setCustomerToDelete(customer.id);
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

      {/* Customer Modal */}
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
                  {t('admin.customers_edit_title')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.staff_full_name')}
                    </label>
                    <input
                      type="text"
                      required
                      className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                        {t('cart.phone_placeholder')}
                      </label>
                      <input
                        type="text"
                        required
                        className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'text-right' : ''}`}
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                        {t('admin.customers_label_points')}
                      </label>
                      <div className="relative">
                        <Star className={`absolute top-1/2 -translate-y-1/2 text-orange-400 ${isRTL ? 'right-3' : 'left-3'}`} size={18} />
                        <input
                          type="number"
                          className={`w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                          value={formData.points}
                          onChange={e => setFormData({ ...formData, points: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className={`block text-sm font-medium text-gray-700 ${isRTL ? 'text-right' : ''}`}>
                      {t('admin.staff_active_account')}
                    </label>
                    <label className={`flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-orange-600"
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span className="font-medium">{formData.isActive ? t('admin.staff_status_active') : t('admin.staff_status_inactive')}</span>
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
                    {t('common.save')}
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
        onConfirm={() => {
          if (customerToDelete) {
            handleDelete(customerToDelete);
            setIsDeleteModalOpen(false);
          }
        }}
        title={t('admin.customers_delete_title')}
        message={t('admin.customers_delete_message')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
};

export default AdminCustomers;
