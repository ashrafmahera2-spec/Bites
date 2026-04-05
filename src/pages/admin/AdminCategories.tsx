import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, X, GripVertical, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

interface Category {
  id: string;
  name: string;
  order: number;
}

const AdminCategories: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    order: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
        toast.success(t('admin.categories_updated'));
      } else {
        await api.addCategory(formData);
        toast.success(t('admin.categories_added'));
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', order: categories.length });
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.deleteCategory(categoryToDelete);
      toast.success(t('admin.categories_deleted'));
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(t('common.error'));
    } finally {
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = Array.isArray(categories) 
    ? categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setCategoryToDelete(null); }}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('admin.categories_delete_confirm')}
        type="danger"
      />
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.categories_title')}</h2>
        <div className={`flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className="relative w-full sm:w-64">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
            <input
              type="text"
              placeholder={t('admin.categories_search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'} py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-orange-600 outline-none shadow-sm`}
            />
          </div>
          <button
            onClick={() => { setEditingCategory(null); setFormData({ name: '', order: categories.length }); setIsModalOpen(true); }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all whitespace-nowrap"
          >
            <Plus size={20} />
            {t('admin.categories_add')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <div key={cat.id} className={`flex items-center justify-between p-6 hover:bg-gray-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-400">
                    <GripVertical size={20} />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <h3 className="font-bold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-500">{t('admin.categories_order')}: {cat.order}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingCategory(cat); setFormData(cat); setIsModalOpen(true); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => { setCategoryToDelete(cat.id); setIsConfirmOpen(true); }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
              <Search size={40} className="text-gray-200" />
              <p>{searchTerm ? t('admin.categories_no_results') : t('admin.categories_no_data')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold">{editingCategory ? t('admin.categories_edit_title') : t('admin.categories_add_title')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className={`p-6 space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.categories_name_label')}</label>
                  <input
                    required
                    type="text"
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.categories_order_label')}</label>
                  <input
                    required
                    type="number"
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
                >
                  {editingCategory ? t('admin.categories_save') : t('admin.categories_add')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
