import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import MenuLayout from '../components/MenuLayout';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ShoppingBag, Search, X, AlertCircle, MessageCircle, UtensilsCrossed, Building2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  order: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  ingredients?: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
}

interface Offer {
  id: string | number;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsappNumber?: string;
  deliveryFee?: number;
}

const MenuPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, items, updateQuantity, branchId, setBranchId } = useCart();
  const { t, isRTL } = useLanguage();

  const activeBranch = React.useMemo(() => {
    return branches.find(b => b.id === branchId);
  }, [branches, branchId]);

  const activeWhatsApp = activeBranch?.whatsappNumber || settings?.whatsappNumber;

  const isRestaurantOpen = React.useMemo(() => {
    if (!settings?.openingHours?.isOpen) return false;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = settings.openingHours;
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Overnight case (e.g., 22:00 to 04:00)
      return currentTime >= start || currentTime <= end;
    }
  }, [settings]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prods, offs, sets, brs] = await Promise.all([
          api.getCategories().catch(e => { console.error(e); return []; }),
          api.getProducts(branchId || undefined).catch(e => { console.error(e); return []; }),
          api.getOffers().catch(e => { console.error(e); return []; }),
          api.getSettings().catch(e => { console.error(e); return null; }),
          api.getBranches().catch(e => { console.error(e); return []; })
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setProducts(Array.isArray(prods) ? prods : []);
        setOffers((Array.isArray(offs) ? offs : []).filter((o: Offer) => o.isActive));
        setSettings(sets);
        setBranches(Array.isArray(brs) ? brs : []);
        
        // Auto-select first branch if none selected
        if (Array.isArray(brs) && brs.length > 0 && !branchId) {
          setBranchId(brs[0].id);
        }
        
        setError(null);
      } catch (err: any) {
        console.error("Error fetching menu data:", err);
        setError(err.message || "Failed to fetch menu data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [branchId]);

  const filteredProducts = Array.isArray(products) ? products.filter(p => {
    if (!p) return false;
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) : [];

  return (
    <MenuLayout 
      settings={settings} 
      categories={categories} 
      activeCategory={activeCategory} 
      setActiveCategory={setActiveCategory}
    >
      {/* Hero Section */}
      <div id="hero-section" className="bg-orange-600 text-white py-12 px-4 text-center">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="bg-white p-4 rounded-3xl shadow-2xl shadow-black/20 w-24 h-24 flex items-center justify-center overflow-hidden">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ShoppingBag size={48} className="text-orange-600" />
            )}
          </div>
          <h1 className="text-4xl font-bold">{settings?.restaurantName || t('hero.title')}</h1>
        </div>
        <p className="text-orange-100">{t('hero.subtitle')}</p>
        
        {/* Branch Selection */}
        {branches.length > 1 && (
          <div className="max-w-md mx-auto mt-6">
            <div className="relative inline-block w-full">
              <Building2 className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-orange-600`} size={20} />
              <select
                className={`w-full py-3 ${isRTL ? 'pr-12 pl-6' : 'pl-12 pr-6'} rounded-2xl text-gray-900 bg-white focus:ring-4 focus:ring-orange-500/20 outline-none shadow-lg appearance-none font-bold`}
                value={branchId || ''}
                onChange={(e) => setBranchId(Number(e.target.value))}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {/* Search Bar */}
        <div id="search-section" className="max-w-md mx-auto mt-8 relative">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input
            type="text"
            placeholder={t('search.placeholder')}
            className={`w-full py-4 ${isRTL ? 'pr-12 pl-6' : 'pl-12 pr-6'} rounded-2xl text-gray-900 focus:ring-4 focus:ring-orange-500/20 outline-none shadow-xl transition-all`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Offers Section */}
      {offers.length > 0 && !searchQuery && activeCategory === 'all' && (
        <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('offers.title')}</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {offers.map(offer => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-w-[300px] md:min-w-[400px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row"
              >
                <div className="h-40 md:h-auto md:w-1/3 relative">
                  <img 
                    src={offer.imageUrl || 'https://picsum.photos/seed/offer/400/300'} 
                    alt={offer.title} 
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider`}>
                    {t('offers.limited')}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 mb-1">{offer.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{offer.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Closed Notice */}
      {!isRestaurantOpen && !loading && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-2xl flex items-center gap-3">
            <Clock className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">{t('menu.closed_title')}</p>
              <p className="text-sm opacity-90">
                {t('menu.closed_desc')} {settings?.openingHours?.start} - {settings?.openingHours?.end}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="font-medium">
                {error === 'DB not connected' 
                  ? t('admin.db_setup_required')
                  : `${t('common.error')}: ${error}`}
              </p>
            </div>
            {error === 'DB not connected' && (
              <Link to="/login" className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                {t('nav.admin')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Categories Bar */}
      <div id="categories-section" className="sticky top-[61px] z-40 bg-white shadow-sm overflow-x-auto whitespace-nowrap px-4 py-3 scrollbar-hide">
        <div className="flex gap-2 max-w-7xl mx-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'all' ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('categories.all')}
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-10 bg-gray-200 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => {
                const cartItem = (items || []).find(i => i.id === product.id.toString() || i.id === product.id);
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
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">{t('product.unavailable')}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-sm font-medium">{t('product.details')}</span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                        <span className="text-orange-600 font-bold whitespace-nowrap">{product.price} {t('common.currency')}</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{product.description}</p>
                      
                      {product.isAvailable && isRestaurantOpen && (
                        <div className="flex items-center justify-between">
                          {cartItem ? (
                            <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1">
                              <button 
                                onClick={() => {
                                  updateQuantity(product.id, cartItem.quantity - 1);
                                  if (cartItem.quantity === 1) toast.error(t('product.removed'));
                                }}
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
                              onClick={() => {
                                addItem({ ...product, quantity: 1 });
                                toast.success(t('product.added').replace('{name}', product.name));
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl font-bold transition-colors"
                            >
                              <Plus size={20} />
                              {t('product.add_to_cart')}
                            </button>
                          )}
                        </div>
                      )}

                      {product.isAvailable && !isRestaurantOpen && (
                        <div className="text-center py-2 px-4 bg-gray-100 rounded-xl text-gray-500 text-sm font-bold">
                          {t('menu.closed_now')}
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
            <h3 className="text-xl font-bold text-gray-900">{t('search.no_results')}</h3>
            <p className="text-gray-500">{t('search.no_results_subtitle')}</p>
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
                className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} z-10 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-md hover:bg-white transition-colors`}
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
                    <p className="text-orange-600 font-bold text-xl mt-1">{selectedProduct.price} {t('common.currency')}</p>
                  </div>
                  <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
                    {(Array.isArray(categories) ? categories : []).find(c => c.id === selectedProduct.categoryId)?.name}
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed mb-4">
                  {selectedProduct.description}
                </p>

                {selectedProduct.ingredients && (
                  <div className="mb-8 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <h4 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2">
                      <UtensilsCrossed size={16} />
                      {t('product.ingredients_label')}
                    </h4>
                    <p className="text-sm text-orange-700 leading-relaxed">
                      {selectedProduct.ingredients}
                    </p>
                  </div>
                )}

                {selectedProduct.isAvailable ? (
                  <div className="flex items-center gap-4">
                    {(items || []).find(i => i.id === selectedProduct.id.toString() || i.id === selectedProduct.id) ? (
                      <div className="flex-1 flex items-center justify-between bg-gray-100 rounded-2xl p-2">
                        <button 
                          onClick={() => updateQuantity(selectedProduct.id.toString(), ((items || []).find(i => i.id === selectedProduct.id.toString() || i.id === selectedProduct.id)?.quantity || 0) - 1)}
                          className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-orange-50 transition-colors"
                        >
                          <Minus size={20} className="text-orange-600" />
                        </button>
                        <span className="font-bold text-xl text-gray-900">
                          {(items || []).find(i => i.id === selectedProduct.id.toString() || i.id === selectedProduct.id)?.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(selectedProduct.id.toString(), ((items || []).find(i => i.id === selectedProduct.id.toString() || i.id === selectedProduct.id)?.quantity || 0) + 1)}
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
                        {t('product.add_to_cart')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-center">
                    {t('product.unavailable')}
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
                <p className="text-xs text-orange-100">{t('nav.cart')}</p>
                <p className="font-bold">{items.length} {t('common.items')}</p>
              </div>
            </div>
            <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
              <p className="text-xs text-orange-100">{t('cart.total')}</p>
              <p className="font-bold">{items.reduce((s, i) => s + i.price * i.quantity, 0)} {t('common.currency')}</p>
            </div>
          </Link>
        </motion.div>
      )}

      {/* WhatsApp Floating Button */}
      {activeWhatsApp && (
        <a
          href={`https://wa.me/${activeWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all hover:scale-110 active:scale-95"
          aria-label={t('whatsapp.aria_label')}
        >
          <MessageCircle size={28} />
        </a>
      )}

      {/* Development Credits */}
      <div className="py-8 text-center border-t border-gray-100 mt-12">
        <p className="text-gray-400 text-sm">{t('common.developed_by')}</p>
        <a 
          href="https://wa.me/201000251645" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-orange-600 font-bold hover:underline transition-all"
        >
          mamlinc
        </a>
      </div>
    </MenuLayout>
  );
};

export default MenuPage;
