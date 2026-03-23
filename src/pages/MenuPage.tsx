import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, ShoppingBag, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  order: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
}

const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addItem, items, updateQuantity } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          api.getCategories(),
          api.getProducts()
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (error) {
        console.error("Error fetching menu data:", error);
      }
    };

    fetchData();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = Array.isArray(products) ? products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-orange-600 text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">أهلاً بك في Bite's</h1>
        <p className="text-orange-100">اطلب ألذ الوجبات بضغطة زر</p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto mt-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن وجبتك المفضلة..."
            className="w-full py-4 pl-12 pr-6 rounded-2xl text-gray-900 focus:ring-4 focus:ring-orange-500/20 outline-none shadow-xl transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Bar */}
      <div className="sticky top-[61px] z-40 bg-white shadow-sm overflow-x-auto whitespace-nowrap px-4 py-3 scrollbar-hide">
        <div className="flex gap-2 max-w-7xl mx-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'all' ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            الكل
          </button>
          {Array.isArray(categories) && categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => {
                const cartItem = items.find(i => i.id === product.id);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={product.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
                  >
                    <div 
                      className="relative h-48 overflow-hidden cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img
                        src={product.imageUrl || 'https://picsum.photos/seed/food/400/300'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      {!product.isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">غير متوفر</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-sm font-medium">عرض التفاصيل</span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                        <span className="text-orange-600 font-bold whitespace-nowrap">{product.price} ج.م</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{product.description}</p>
                      
                      {product.isAvailable && (
                        <div className="flex items-center justify-between">
                          {cartItem ? (
                            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1">
                              <button 
                                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                className="p-1 hover:bg-white rounded-full transition-colors"
                              >
                                <Minus size={18} className="text-orange-600" />
                              </button>
                              <span className="font-bold text-gray-900 min-w-[20px] text-center">{cartItem.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                className="p-1 hover:bg-white rounded-full transition-colors"
                              >
                                <Plus size={18} className="text-orange-600" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addItem({ ...product, quantity: 1 })}
                              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl font-bold transition-colors"
                            >
                              <Plus size={20} />
                              أضف للسلة
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">لا توجد نتائج</h3>
            <p className="text-gray-500">جرب البحث بكلمات أخرى أو اختر قسماً آخر</p>
          </div>
        )}
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <X size={20} className="text-gray-900" />
              </button>

              <div className="h-64 relative">
                <img 
                  src={selectedProduct.imageUrl} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>

              <div className="p-6 -mt-12 relative bg-white rounded-t-3xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                    <p className="text-orange-600 font-bold text-xl mt-1">{selectedProduct.price} ج.م</p>
                  </div>
                  <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                    {categories.find(c => c.id === selectedProduct.categoryId)?.name}
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed mb-8">
                  {selectedProduct.description}
                </p>

                {selectedProduct.isAvailable ? (
                  <div className="flex items-center gap-4">
                    {items.find(i => i.id === selectedProduct.id) ? (
                      <div className="flex-1 flex items-center justify-between bg-gray-100 rounded-2xl p-2">
                        <button 
                          onClick={() => updateQuantity(selectedProduct.id, (items.find(i => i.id === selectedProduct.id)?.quantity || 0) - 1)}
                          className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-orange-50 transition-colors"
                        >
                          <Minus size={20} className="text-orange-600" />
                        </button>
                        <span className="font-bold text-xl text-gray-900">
                          {items.find(i => i.id === selectedProduct.id)?.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(selectedProduct.id, (items.find(i => i.id === selectedProduct.id)?.quantity || 0) + 1)}
                          className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-orange-50 transition-colors"
                        >
                          <Plus size={20} className="text-orange-600" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          addItem({ ...selectedProduct, quantity: 1 });
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2"
                      >
                        <Plus size={24} />
                        أضف للسلة
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-center">
                    هذا المنتج غير متوفر حالياً
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md"
        >
          <Link
            to="/cart"
            className="flex items-center justify-between bg-orange-600 text-white px-6 py-4 rounded-2xl shadow-2xl hover:bg-orange-700 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-xs text-orange-100">سلة المشتريات</p>
                <p className="font-bold">{items.length} منتجات</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-orange-100">الإجمالي</p>
              <p className="font-bold">{items.reduce((s, i) => s + i.price * i.quantity, 0)} ج.م</p>
            </div>
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default MenuPage;
