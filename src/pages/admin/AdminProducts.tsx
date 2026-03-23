import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    isAvailable: true
  });

  const fetchData = async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching products/categories:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.addProduct(formData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, imageUrl: '', categoryId: '', isAvailable: true });
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await api.deleteProduct(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await api.updateProduct(product.id, {
        ...product,
        isAvailable: !product.isAvailable
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h2>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
        >
          <Plus size={20} />
          إضافة منتج
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            className="pl-12 pr-8 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none appearance-none bg-white min-w-[150px]"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">كل الأقسام</option>
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <img src={product.imageUrl || 'https://picsum.photos/seed/food/300/200'} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-900">{product.name}</h3>
              <span className="text-orange-600 font-bold">{product.price} ج.م</span>
            </div>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <button
                onClick={() => toggleAvailability(product)}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                  product.isAvailable 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                {product.isAvailable ? 'متوفر' : 'غير متوفر'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">اسم المنتج</label>
                    <input
                      required
                      type="text"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">السعر</label>
                    <input
                      required
                      type="number"
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">القسم</label>
                    <select
                      required
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">اختر القسم</option>
                      {Array.isArray(categories) && categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الوصف</label>
                  <textarea
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px]"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رابط الصورة</label>
                  <input
                    type="url"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <label htmlFor="isAvailable" className="font-bold text-gray-700">متوفر للطلب</label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
