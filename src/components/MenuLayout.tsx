import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  ShoppingBag, 
  Search, 
  Menu as MenuIcon, 
  User, 
  LayoutGrid,
  Clock,
  MapPin,
  Phone
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

interface MenuLayoutProps {
  children: React.ReactNode;
  settings: any;
  categories: any[];
  activeCategory: string;
  setActiveCategory: (id: string) => void;
}

const MenuLayout: React.FC<MenuLayoutProps> = ({ 
  children, 
  settings, 
  categories, 
  activeCategory, 
  setActiveCategory 
}) => {
  const { t, isRTL } = useLanguage();
  const { items } = useCart();
  const { user, isAdmin, isCustomer } = useAuth();
  const location = useLocation();
  const theme = settings?.global?.features?.menuTheme || 'classic';

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (theme === 'bottom-nav') {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Navbar />
        <main>{children}</main>
        
        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 z-50 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-orange-600' : 'text-gray-400'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('nav.menu')}</span>
          </Link>
          
          <button 
            onClick={() => {
              const el = document.getElementById('categories-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <LayoutGrid size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('admin.nav_categories')}</span>
          </button>

          <Link to="/cart" className="relative -mt-8 bg-orange-600 text-white p-4 rounded-full shadow-xl shadow-orange-600/30 border-4 border-white">
            <ShoppingBag size={28} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button 
            onClick={() => {
              const el = document.getElementById('search-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <Search size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('search.placeholder')}</span>
          </button>

          <Link 
            to={user ? (isAdmin ? "/admin" : "/profile") : "/login"} 
            className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' || location.pathname === '/admin' ? 'text-orange-600' : 'text-gray-400'}`}
          >
            <User size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {user ? (user.name?.split(' ')[0] || user.username) : t('nav.login')}
            </span>
          </Link>
        </nav>
      </div>
    );
  }

  if (theme === 'sidebar') {
    return (
      <div className={`min-h-screen bg-gray-50 flex ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Desktop Sidebar */}
        <aside className={`hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen z-50 ${isRTL ? 'border-r-0 border-l' : ''}`}>
          <div className="p-8">
            <Link to="/" className="flex items-center gap-3 mb-12">
              <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20">
                <ShoppingBag size={24} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{settings?.restaurantName || "Bite's"}</span>
            </Link>

            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">
                  {t('admin.nav_categories')}
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                      activeCategory === 'all' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
                    } ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <LayoutGrid size={20} />
                    {t('categories.all')}
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                        activeCategory === cat.id ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
                      } ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${activeCategory === cat.id ? 'bg-white' : 'bg-orange-600'}`} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">
                  {user ? t('nav.profile') : t('nav.admin')}
                </h3>
                <Link
                  to={user ? (isAdmin ? "/admin" : "/profile") : "/login"}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <User size={20} />
                  {user ? (user.name || user.username) : t('nav.login')}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-auto p-8 border-t border-gray-50">
            <div className={`flex items-center gap-3 text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock size={18} />
              <span className="text-sm font-medium">
                {settings?.openingHours?.start} - {settings?.openingHours?.end}
              </span>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <Navbar />
          <main>{children}</main>
        </div>
      </div>
    );
  }

  // Default Classic Theme
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default MenuLayout;
