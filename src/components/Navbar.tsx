import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Settings } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { items } = useCart();
  const { isAdmin } = useAuth();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Bite's Menu
        </Link>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link to="/admin" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings size={22} className="text-gray-600" />
            </Link>
          )}
          
          <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
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
