import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Save, QrCode, Download, Smartphone, CreditCard, Banknote, Wallet, Clock, Facebook, Instagram, Music2, TrendingUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Settings {
  whatsappNumber: string;
  walletNumber: string;
  deliveryFee: number;
  paymentMethods: {
    cash: boolean;
    instapay: boolean;
    card: boolean;
    wallet: boolean;
  };
  restaurantAddress: string;
  openingHours: {
    start: string;
    end: string;
    isOpen: boolean;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    whatsappNumber: '',
    walletNumber: '',
    deliveryFee: 0,
    paymentMethods: {
      cash: true,
      instapay: true,
      card: false,
      wallet: true
    },
    restaurantAddress: '',
    openingHours: {
      start: '10:00',
      end: '23:00',
      isOpen: true
    },
    socialLinks: {
      facebook: '',
      instagram: '',
      tiktok: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'menu-qr-code.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;

  const menuUrl = window.location.origin;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">إعدادات النظام</h2>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
        >
          <Save size={20} />
          {saved ? 'تم الحفظ!' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Smartphone className="text-orange-600" />
            الإعدادات العامة
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم الواتساب (بدون +)</label>
              <input
                type="text"
                placeholder="201012345678"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                value={settings.whatsappNumber}
                onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رقم المحفظة (فودافون كاش / غيره)</label>
              <input
                type="text"
                placeholder="201012345678"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                value={settings.walletNumber}
                onChange={e => setSettings({ ...settings, walletNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">رسوم التوصيل (ج.م)</label>
              <input
                type="number"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                value={settings.deliveryFee}
                onChange={e => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">عنوان المطعم</label>
              <textarea
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px]"
                value={settings.restaurantAddress}
                onChange={e => setSettings({ ...settings, restaurantAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Clock className="text-orange-600" size={18} />
              مواعيد العمل
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">من</label>
                <input
                  type="time"
                  className="w-full p-2 rounded-lg border border-gray-100 outline-none"
                  value={settings.openingHours.start}
                  onChange={e => setSettings({ ...settings, openingHours: { ...settings.openingHours, start: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">إلى</label>
                <input
                  type="time"
                  className="w-full p-2 rounded-lg border border-gray-100 outline-none"
                  value={settings.openingHours.end}
                  onChange={e => setSettings({ ...settings, openingHours: { ...settings.openingHours, end: e.target.value } })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange-600"
                checked={settings.openingHours.isOpen}
                onChange={e => setSettings({ ...settings, openingHours: { ...settings.openingHours, isOpen: e.target.checked } })}
              />
              <span className="text-sm font-medium">المطعم مفتوح الآن</span>
            </label>
          </div>

          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <CreditCard className="text-orange-600" size={18} />
              طرق الدفع المتاحة
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Banknote className="text-green-600" />
                  <span className="font-medium">كاش عند الاستلام</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.paymentMethods.cash}
                  onChange={e => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, cash: e.target.checked } })}
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Wallet className="text-blue-600" />
                  <span className="font-medium">انستا باي (InstaPay)</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.paymentMethods.instapay}
                  onChange={e => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, instapay: e.target.checked } })}
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-purple-600" />
                  <span className="font-medium">فيزا / ماستر كارد</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.paymentMethods.card}
                  onChange={e => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, card: e.target.checked } })}
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Wallet className="text-orange-600" />
                  <span className="font-medium">محفظة كاش (Vodafone/Etisalat/...)</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.paymentMethods.wallet}
                  onChange={e => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, wallet: e.target.checked } })}
                />
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <TrendingUp className="text-orange-600" size={18} />
              روابط التواصل الاجتماعي
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Facebook size={18} className="text-blue-600" />
                <input
                  type="url"
                  placeholder="رابط فيسبوك"
                  className="flex-1 p-2 rounded-lg border border-gray-100 outline-none text-sm"
                  value={settings.socialLinks.facebook}
                  onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Instagram size={18} className="text-pink-600" />
                <input
                  type="url"
                  placeholder="رابط انستجرام"
                  className="flex-1 p-2 rounded-lg border border-gray-100 outline-none text-sm"
                  value={settings.socialLinks.instagram}
                  onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Music2 size={18} className="text-black" />
                <input
                  type="url"
                  placeholder="رابط تيك توك"
                  className="flex-1 p-2 rounded-lg border border-gray-100 outline-none text-sm"
                  value={settings.socialLinks.tiktok}
                  onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, tiktok: e.target.value } })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-orange-50 p-4 rounded-2xl mb-6">
            <QrCode size={48} className="text-orange-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">QR Code المنيو</h3>
          <p className="text-gray-500 mb-8 text-sm">اطبع هذا الكود وضعه على طاولات المطعم ليتمكن الزبائن من فتح المنيو مباشرة</p>
          
          <div ref={qrRef} className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-8">
            <QRCodeSVG value={menuUrl} size={200} level="H" includeMargin={true} />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all"
            >
              <Download size={20} />
              تحميل الصورة
            </button>
            <button
              onClick={() => window.open(menuUrl, '_blank')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              فتح المنيو
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400 break-all">{menuUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
