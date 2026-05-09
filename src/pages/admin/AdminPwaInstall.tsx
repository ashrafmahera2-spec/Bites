import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Smartphone, Download, User, UtensilsCrossed, Navigation, Calculator, QrCode, X, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const AdminPwaInstall: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const employeeApps = [
    {
      role: 'customer',
      label: t('admin.settings_pwa_customer') || 'Customer Menu',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      description: 'منيو المطعم للعملاء لطلب الوجبات ومتابعتها',
      path: '/'
    },
    {
      role: 'cashier',
      label: t('admin.nav_cashier'),
      icon: Calculator,
      color: 'bg-blue-600',
      description: 'نظام الكاشير واستلام الطلبات ومتابعتها',
      path: '/admin/cashier'
    },
    {
      role: 'kitchen',
      label: t('admin.nav_kitchen'),
      icon: UtensilsCrossed,
      color: 'bg-orange-600',
      description: 'شاشة المطبخ لمتابعة وتنفيذ الطلبات لحظياً',
      path: '/admin/kitchen'
    },
    {
      role: 'delivery',
      label: t('admin.nav_delivery'),
      icon: Navigation,
      color: 'bg-green-600',
      description: 'تطبيق سائقي التوصيل لمتابعة الطلبات وتحديث حالتها',
      path: '/admin/delivery'
    },
    {
      role: 'admin',
      label: t('admin.settings_pwa_title') || 'Admin Panel',
      icon: User,
      color: 'bg-purple-600',
      description: 'لوحة التحكم الكاملة للمدير ومتابعة التقارير',
      path: '/admin'
    }
  ];

  const handleInstall = (app: any) => {
    setSelectedApp(app);
  };

  const getFullUrl = (path: string) => {
    return window.location.origin + path;
  };

  return (
    <div className="space-y-8">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.settings_pwa_install') || 'Employee App Installation'}</h2>
          <p className="text-gray-500 mt-1">تثبيت تطبيقات منفصلة لكل موظف حسب تخصصه</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {employeeApps.map((app) => (
          <div key={app.role} className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all group ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`${app.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-${app.color.split('-')[1]}-600/20 group-hover:scale-110 transition-transform`}>
              <app.icon size={28} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{app.label}</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed h-12 overflow-hidden">
              {app.description}
            </p>
            <button
              onClick={() => handleInstall(app)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                app.role === 'admin' ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' :
                app.role === 'cashier' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' :
                app.role === 'kitchen' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' :
                'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              <QrCode size={18} />
              {t('admin.settings_qr_title') || 'Show QR & Install'}
            </button>
          </div>
        ))}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative">
            <button 
              onClick={() => setSelectedApp(null)}
              className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-8">
              <div className={`${selectedApp.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl`}>
                <selectedApp.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{selectedApp.label}</h3>
              <p className="text-gray-500 mt-2">امسح الكود لتثبيت التطبيق على هاتفك</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-3xl mb-8 flex justify-center">
              <QRCodeSVG 
                value={getFullUrl(selectedApp.path)} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-3">
              <a 
                href={selectedApp.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${selectedApp.color} text-white shadow-lg shadow-${selectedApp.color.split('-')[1]}-600/20`}
              >
                <Download size={20} />
                فتح الرابط مباشرة
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(getFullUrl(selectedApp.path));
                  toast.success(t('common.copied'));
                }}
                className="w-full py-4 rounded-2xl font-bold border-2 border-gray-100 text-gray-600 hover:bg-gray-50 transition-all text-sm"
              >
                نسخ رابط التطبيق
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-orange-50 p-8 rounded-[2rem] border border-orange-100">
        <div className={`flex flex-col md:flex-row gap-8 items-center ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <div className="bg-white p-4 rounded-3xl shadow-lg shadow-orange-600/10">
            <Smartphone size={64} className="text-orange-600" />
          </div>
          <div className={`flex-1 text-center md:text-left ${isRTL ? 'md:text-right' : ''}`}>
            <h3 className="text-xl font-bold text-gray-900 mb-2">تعليمات تثبيت تطبيقات الموظفين</h3>
            <div className="space-y-4 text-gray-600 text-sm">
              <p>1. قم بفتح رابط التطبيق المخصص لكل موظف من المتصفح على هاتفه.</p>
              <p>2. اضغط على أيقونة المشاركة (Share) في الآيفون أو الثلاث نقاط (Chrome) في الأندرويد.</p>
              <p>3. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).</p>
              <p>4. سيظهر تطبيق مستقل لكل دور وظيفي يعمل بسرعة وسهولة.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPwaInstall;
