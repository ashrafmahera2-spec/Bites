import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Users,
  Layout,
  QrCode,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { toast } from 'sonner';
import ConfirmModal from '../../components/ConfirmModal';
import QRCode from 'react-qr-code';

interface Table {
  id: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  branchId: number;
  isActive: boolean;
}

interface Branch {
  id: number;
  name: string;
}

const AdminTables = () => {
  const { t, isRTL } = useLanguage();
  const [tables, setTables] = useState<Table[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);
  const [showQR, setShowQR] = useState<Table | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    capacity: 2,
    status: 'available' as 'available' | 'occupied' | 'reserved',
    branchId: 0,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tablesData, branchesData] = await Promise.all([
        api.getTables(),
        api.getBranches()
      ]);
      setTables(tablesData);
      setBranches(branchesData);
      if (branchesData.length > 0) {
        setFormData(prev => ({ ...prev, branchId: branchesData[0].id }));
      }
    } catch (error) {
      toast.error(t('admin.db_error_fetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        name: table.name,
        capacity: table.capacity,
        status: table.status,
        branchId: table.branchId,
        isActive: table.isActive
      });
    } else {
      setEditingTable(null);
      setFormData({
        name: '',
        capacity: 2,
        status: 'available',
        branchId: branches[0]?.id || 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId) {
      toast.error(t('admin.cashier_error_select_branch'));
      return;
    }
    try {
      if (editingTable) {
        await api.updateTable(editingTable.id, formData);
        toast.success(t('admin.branches_updated_success'));
      } else {
        await api.addTable(formData);
        toast.success(t('admin.branches_added_success'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t('admin.branches_save_error'));
    }
  };

  const handleDelete = async () => {
    if (!tableToDelete) return;
    try {
      await api.deleteTable(tableToDelete);
      toast.success(t('admin.branches_deleted_success'));
      fetchData();
    } catch (error) {
      toast.error(t('admin.branches_delete_error'));
    } finally {
      setIsDeleteModalOpen(false);
      setTableToDelete(null);
    }
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h2 className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Layout className="text-orange-600" />
            {t('admin.tables_management')}
          </h2>
          <p className={`text-gray-500 text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('admin.tables_desc')}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className={`flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus size={20} />
          {t('admin.tables_add_new')}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <div className="relative w-full max-w-md">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={20} />
            <input
              type="text"
              placeholder={t('admin.categories_search')}
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
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.tables_name')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.branches_name')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.tables_capacity')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.tables_status')}</th>
                <th className="px-6 py-4 font-bold text-gray-700">{t('admin.staff_table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-right">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </div>
                  </td>
                </tr>
              ) : filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {t('admin.tables_no_data')}
                  </td>
                </tr>
              ) : (
                filteredTables.map((table) => {
                  const branch = branches.find(b => b.id === table.branchId);
                  return (
                    <tr key={table.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{table.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Building2 size={16} className="text-gray-400" />
                          <span>{branch?.name || t('common.unspecified')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Users size={16} className="text-gray-400" />
                          <span>{table.capacity} {t('common.items')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                          {t(`admin.tables_status_${table.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => setShowQR(table)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title={t('admin.tables_qr')}
                          >
                            <QrCode size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(table)}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setTableToDelete(table.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Modal */}
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
                  {editingTable ? t('common.edit') : t('admin.tables_add_new')}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-right">
                <div className="space-y-1 text-right">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.tables_name')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('admin.tables_placeholder_name')}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all text-right"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('admin.tables_capacity')}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all text-right"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('admin.tables_status')}
                    </label>
                    <select
                      className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all text-right"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="available text-right">{t('admin.tables_status_available')}</option>
                      <option value="occupied text-right">{t('admin.tables_status_occupied')}</option>
                      <option value="reserved text-right">{t('admin.tables_status_reserved')}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('admin.staff_branch_select')}
                  </label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-orange-600 transition-all text-right"
                    value={formData.branchId}
                    onChange={e => setFormData({ ...formData, branchId: Number(e.target.value) })}
                    required
                  >
                    <option value="">{t('admin.cashier_select_branch')}</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
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
                    {editingTable ? t('common.save') : t('common.add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl p-8 flex flex-col items-center"
            >
              <h3 className="text-xl font-bold mb-2">{t('admin.tables_qr')}</h3>
              <p className="text-gray-500 mb-6 text-center">{t('admin.tables_qr_desc')}</p>
              
              <div className="p-4 bg-white rounded-2xl border-2 border-orange-100 shadow-inner mb-6">
                <QRCode 
                  value={`${window.location.origin}/?table=${showQR.id}&branch=${showQR.branchId}`}
                  size={200}
                />
              </div>

              <div className="bg-orange-50 p-4 rounded-xl w-full mb-6 text-center">
                <p className="font-bold text-orange-800">{showQR.name}</p>
                <p className="text-sm text-orange-600">{branches.find(b => b.id === showQR.branchId)?.name}</p>
              </div>

              <button
                onClick={() => setShowQR(null)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                {t('common.close')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('admin.tables_delete_confirm')}
        message={t('admin.tables_delete_desc')}
      />
    </div>
  );
};

export default AdminTables;
