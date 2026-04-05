import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User as UserIcon, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
  const { login, customerLogin, customerRegister, user, logout, isAdmin, isCustomer } = useAuth();
  const { t, isRTL } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let success = false;
    if (isAdminLogin) {
      success = await login(username, password);
    } else {
      if (isRegister) {
        success = await customerRegister({ name, phone, password });
      } else {
        success = await customerLogin(phone, password);
      }
    }

    if (!success) {
      setError(t('login.error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh] py-12 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={40} className="text-orange-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isAdminLogin ? t('nav.admin') : (isRegister ? t('nav.register') : t('nav.login'))}
          </h2>
          <p className="text-gray-500 mb-8">
            {isAdminLogin ? t('login.admin_subtitle') : t('login.subtitle')}
          </p>
          
          {user ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="bg-orange-600 text-white p-3 rounded-full">
                  <UserIcon size={24} />
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <p className="font-bold text-gray-900">{t('login.welcome')}, {user.name || user.username}</p>
                  <p className="text-xs text-gray-500">{isAdmin ? t('login.admin_role') : t('admin.nav_customers')}</p>
                </div>
              </div>
              
              {isAdmin && (
                <a href="/admin" className="block w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
                  {t('admin.title')}
                </a>
              )}

              {isCustomer && (
                <a href="/profile" className="block w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
                  {t('nav.profile')}
                </a>
              )}
              
              <button
                onClick={logout}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                {t('admin.logout')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}
              
              {!isAdminLogin && isRegister && (
                <div className="relative">
                  <UserIcon className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                  <input
                    type="text"
                    placeholder={t('admin.customers_table_name')}
                    className={`w-full py-4 ${isRTL ? 'pr-12 pl-6' : 'pl-12 pr-6'} rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              {isAdminLogin ? (
                <div className="relative">
                  <UserIcon className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                  <input
                    type="text"
                    placeholder={t('login.username_placeholder')}
                    className={`w-full py-4 ${isRTL ? 'pr-12 pl-6' : 'pl-12 pr-6'} rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="relative">
                  <UserIcon className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                  <input
                    type="tel"
                    placeholder={t('admin.customers_table_contact')}
                    className={`w-full py-4 ${isRTL ? 'pr-12 pl-6' : 'pl-12 pr-6'} rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Lock className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                <input
                  type="password"
                  placeholder={t('login.password_placeholder')}
                  className={`w-full py-4 ${isRTL ? 'pr-12 pl-6' : 'pl-12 pr-6'} rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none transition-all`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50"
              >
                {loading ? '...' : (isRegister ? t('nav.register') : t('login.button'))}
              </button>

              <div className="flex flex-col gap-2 pt-4">
                {!isAdminLogin && (
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-orange-600 font-bold text-sm hover:underline"
                  >
                    {isRegister ? t('login.have_account') : t('login.no_account')}
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminLogin(!isAdminLogin);
                    setIsRegister(false);
                  }}
                  className="text-gray-500 text-xs hover:underline"
                >
                  {isAdminLogin ? t('login.customer_login') : t('login.admin_login')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
