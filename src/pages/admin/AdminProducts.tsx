import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X, Search, Filter, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

import { useAuth } from '../../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

const AdminProducts: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | number>(user?.role === 'admin' ? 'all' : (user?.branchId || 'all'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: '',
    price: 0,
    imageUrl: '',
    categoryId: '',
    isAvailable: true
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('admin.product_image_large'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    try {
      const [prods, cats, brs] = await Promise.all([
        api.getProducts(selectedBranchId === 'all' ? undefined : selectedBranchId),
        api.getCategories(),
        api.getBranches()
      ]);
      setProducts(Array.isArray(prods) ? prods : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setBranches(Array.isArray(brs) ? brs : []);
    } catch (error) {
      console.error("Error fetching products/categories/branches:", error);
      setProducts([]);
      setCategories([]);
      setBranches([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
        toast.success(t('admin.product_updated'));
      } else {
        await api.addProduct(formData);
        toast.success(t('admin.product_added'));
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', ingredients: '', price: 0, imageUrl: '', categoryId: '', isAvailable: true });
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('admin.product_delete_confirm'))) {
      try {
        await api.deleteProduct(id);
        toast.success(t('admin.product_deleted'));
        fetchData();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error(t('common.error'));
      }
    }
  };

  const toggleAvailability = async (product: Product) => {
    try {
      if (selectedBranchId === 'all') {
        await api.updateProduct(product.id, {
          ...product,
          isAvailable: !product.isAvailable
        });
      } else {
        await api.updateProductAvailability(selectedBranchId, product.id, !product.isAvailable);
      }
      toast.success(product.isAvailable 
        ? t('admin.product_marked_unavailable')
        : t('admin.product_marked_available')
      );
      fetchData();
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error(t('common.error'));
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
    if (!p) return false;
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.products')}</h2>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
        >
          <Plus size={20} />
          {t('admin.add_product')}
        </button>
      </div>

      <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input
            type="text"
            placeholder={t('admin.search_placeholder')}
            className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          <select
            className={`${isRTL ? 'pr-12 pl-8' : 'pl-12 pr-8'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none appearance-none bg-white min-w-[150px]`}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">{t('admin.all_categories')}</option>
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Building2 className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          <select
            className={`${isRTL ? 'pr-12 pl-8' : 'pl-12 pr-8'} py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none appearance-none bg-white min-w-[150px] disabled:bg-gray-50 disabled:text-gray-500`}
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            disabled={user?.role !== 'admin'}
          >
            {user?.role === 'admin' && <option value="all">جميع الفروع (عام)</option>}
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <motion.div
              layout
              key={product.id}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <img 
                  src={product.imageUrl || 'https://picsum.photos/seed/food/300/200'} 
                  alt={product.name} 
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                {!product.isAvailable && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white text-red-600 px-4 py-1 rounded-full text-xs font-bold shadow-lg">{t('product.unavailable')}</span>
                  </div>
                )}
              </div>
              <div className={`flex justify-between items-start mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="font-bold text-gray-900">{product.name}</h3>
                <span className="text-orange-600 font-bold">{product.price} {isRTL ? 'ج.م' : 'EGP'}</span>
              </div>
              <p className={`text-sm text-gray-500 mb-4 line-clamp-2 h-10 ${isRTL ? 'text-right' : 'text-left'}`}>{product.description}</p>
              <div className={`flex items-center justify-between pt-4 border-t border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => { setEditingProduct(product); setFormData(product); setIsModalOpen(true); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <button
                  onClick={() => toggleAvailability(product)}
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all ${
                    product.isAvailable 
                      ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  {product.isAvailable ? t('product.available') : t('product.unavailable')}
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">{t('admin.no_products')}</h3>
            <p className="text-gray-400 mt-2">{t('admin.no_products_subtitle')}</p>
          </div>
        )}
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
              <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold">{editingProduct ? t('admin.edit_product') : t('admin.add_product')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className={`p-6 space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.product_name')}</label>
                    <input
                      required
                      type="text"
                      className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.product_price')}</label>
                    <input
                      required
                      type="number"
                      className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.product_category')}</label>
                    <select
                      required
                      className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                      <option value="">{t('admin.product_select_category')}</option>
                      {Array.isArray(categories) && categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.product_description')}</label>
                  <textarea
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px] ${isRTL ? 'text-right' : 'text-left'}`}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المكونات (اختياري)</label>
                  <textarea
                    placeholder="مثال: طماطم، خس، صوص خاص..."
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[60px] ${isRTL ? 'text-right' : 'text-left'}`}
                    value={formData.ingredients}
                    onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.product_image')}</label>
                  <div className="flex flex-col gap-3">
                    {formData.imageUrl && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-red-500 text-white p-1 rounded-full shadow-lg`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-600 hover:bg-orange-50 cursor-pointer transition-all text-gray-500 font-bold text-center"
                      >
                        <ImageIcon size={20} />
                        {t('admin.product_upload')}
                      </label>
                      <input
                        type="url"
                        placeholder={t('admin.product_url')}
                        className={`flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                        value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <label htmlFor="isAvailable" className="font-bold text-gray-700">{t('admin.product_available')}</label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
                >
                  {editingProduct ? t('common.save') : t('admin.add_product')}
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
