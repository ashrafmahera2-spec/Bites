import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  order: number;
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    order: 0
  });

  const fetchCategories = async () => {
    try {
      const cats = await api.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      } else {
        await api.addCategory(formData);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', order: categories.length });
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع المنتجات التابعة له (اختياري)')) {
      try {
        await api.deleteCategory(id);
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إدارة الأقسام</h2>
        <button
          onClick={() => { setEditingCategory(null); setFormData({ name: '', order: categories.length }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
        >
          <Plus size={20} />
          إضافة قسم
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {Array.isArray(categories) && categories.map((cat, index) => (
            <div key={cat.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-400">
                  <GripVertical size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-500">الترتيب: {cat.order}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingCategory(cat); setFormData(cat); setIsModalOpen(true); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {(!Array.isArray(categories) || categories.length === 0) && (
            <div className="p-12 text-center text-gray-400">لا توجد أقسام بعد</div>
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
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingCategory ? 'تعديل قسم' : 'إضافة قسم جديد'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">اسم القسم</label>
                  <input
                    required
                    type="text"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الترتيب (للعرض)</label>
                  <input
                    required
                    type="number"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
                >
                  {editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}
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
