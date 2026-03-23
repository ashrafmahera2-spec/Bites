import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User as UserIcon, Lock } from 'lucide-react';
import Navbar from '../components/Navbar';

const LoginPage: React.FC = () => {
  const { login, user, logout, isAdmin } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(password);
    if (!success) {
      setError('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center h-[80vh] px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn size={40} className="text-orange-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">دخول الإدارة</h2>
          <p className="text-gray-500 mb-8">أدخل كلمة المرور للوصول للوحة التحكم</p>
          
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="bg-orange-600 text-white p-3 rounded-full">
                  <Lock size={24} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">أهلاً بك</p>
                  <p className="text-xs text-gray-500">مدير النظام</p>
                </div>
              </div>
              
              {isAdmin && (
                <a href="/admin" className="block w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">
                  لوحة التحكم
                </a>
              )}
              
              <button
                onClick={logout}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <p className="text-red-500 text-sm font-bold mb-4">{error}</p>}
              
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="كلمة المرور"
                  className="w-full py-4 pl-12 pr-6 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
              >
                دخول
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
