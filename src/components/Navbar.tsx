import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, Languages } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

const Navbar: React.FC = () => {
  const { items } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<{ restaurantName: string; logoUrl?: string }>({
    restaurantName: "Bite's Menu",
    logoUrl: ''
  });
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        if (data) {
          setSettings({
            restaurantName: data.restaurantName || "Bite's Menu",
            logoUrl: data.logoUrl || ''
          });
        }
      } catch (error) {
        console.error("Error fetching settings in navbar:", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20 group-hover:scale-110 transition-transform w-10 h-10 flex items-center justify-center overflow-hidden">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ShoppingBag size={24} className="text-white" />
            )}
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {settings.restaurantName}
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all border border-gray-200 text-sm font-medium"
            title={language === 'ar' ? 'Switch to English' : 'تغيير للغة العربية'}
          >
            <Languages size={18} className="text-orange-600" />
            <span>{language === 'ar' ? 'EN' : 'AR'}</span>
          </button>

          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" title={t('nav.cart')}>
            <ShoppingCart size={22} className="text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
