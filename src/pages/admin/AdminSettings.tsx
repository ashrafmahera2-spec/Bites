import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Save, QrCode, Download, Smartphone, CreditCard, Banknote, Wallet, Clock, Facebook, Instagram, Music2, TrendingUp, X, AppWindow } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface Settings {
  restaurantName: string;
  logoUrl?: string;
  whatsappNumber: string;
  walletNumber: string;
  instapayHandle?: string;
  cardDetails?: string;
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

interface PwaSettings {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
}

const AdminSettings: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [settings, setSettings] = useState<Settings>({
    restaurantName: "Bite's Menu",
    logoUrl: '',
    whatsappNumber: '',
    walletNumber: '',
    instapayHandle: '',
    cardDetails: '',
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

  const [pwaSettings, setPwaSettings] = useState<PwaSettings>({
    name: '',
    shortName: '',
    description: '',
    themeColor: '#f97316',
    backgroundColor: '#ffffff'
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error(t('admin.settings_logo_large'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [data, pwaData] = await Promise.all([
          api.getSettings(),
          api.getPwaSettings()
        ]);
        
        if (data) {
          setSettings(prev => ({
            ...prev,
            ...data,
            paymentMethods: { ...prev.paymentMethods, ...(data.paymentMethods || {}) },
            openingHours: { ...prev.openingHours, ...(data.openingHours || {}) },
            socialLinks: { ...prev.socialLinks, ...(data.socialLinks || {}) }
          }));
        }

        if (pwaData) {
          setPwaSettings(pwaData);
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
      await Promise.all([
        api.updateSettings(settings),
        api.updatePwaSettings(pwaSettings)
      ]);
      setSaved(true);
      toast.success(t('admin.settings_saved'));
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t('common.error'));
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(20, 20, 360, 80, 20);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(settings.restaurantName || "Bite's Menu", 200, 65);
      ctx.font = 'normal 14px Arial';
      ctx.fillText("Scan to view our menu", 200, 85);
      const qrSize = 280;
      const x = (canvas.width - qrSize) / 2;
      const y = 120;
      ctx.drawImage(img, x, y, qrSize, qrSize);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.fillText("Powered by mamlinc", 200, 480);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${settings.restaurantName || 'menu'}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;

  const menuUrl = window.location.origin;

  return (
    <div className="space-y-8">
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.settings')}</h2>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
        >
          <Save size={20} />
          {saved ? t('admin.settings_saved_btn') : t('common.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className={`text-xl font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Smartphone className="text-orange-600" />
            {t('admin.settings_general')}
          </h3>
          
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-6 bg-orange-50 rounded-3xl border border-orange-100">
              <div className="relative w-24 h-24 bg-white rounded-2xl shadow-sm overflow-hidden border border-orange-200 flex items-center justify-center">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Smartphone className="text-orange-200" size={40} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-xs font-bold text-center"
                >
                  {t('admin.settings_logo_change')}
                </label>
              </div>
              <div className="text-center">
                <h4 className="font-bold text-gray-900">{t('admin.settings_logo')}</h4>
                <p className="text-xs text-gray-500">{t('admin.settings_logo_subtitle')}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_name')}</label>
              <input
                type="text"
                placeholder="Bite's Menu"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={settings.restaurantName}
                onChange={e => setSettings({ ...settings, restaurantName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_whatsapp')}</label>
              <input
                type="text"
                placeholder="201012345678"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={settings.whatsappNumber}
                onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_wallet')}</label>
              <input
                type="text"
                placeholder="201012345678"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={settings.walletNumber}
                onChange={e => setSettings({ ...settings, walletNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_delivery')}</label>
              <input
                type="number"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={settings.deliveryFee}
                onChange={e => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_address')}</label>
              <textarea
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px] ${isRTL ? 'text-right' : 'text-left'}`}
                value={settings.restaurantAddress}
                onChange={e => setSettings({ ...settings, restaurantAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className={`font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Clock className="text-orange-600" size={18} />
              {t('admin.settings_hours')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('admin.settings_hours_from')}</label>
                <input
                  type="time"
                  className={`w-full p-2 rounded-lg border border-gray-100 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.openingHours.start}
                  onChange={e => setSettings({ ...settings, openingHours: { ...settings.openingHours, start: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{t('admin.settings_hours_to')}</label>
                <input
                  type="time"
                  className={`w-full p-2 rounded-lg border border-gray-100 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.openingHours.end}
                  onChange={e => setSettings({ ...settings, openingHours: { ...settings.openingHours, end: e.target.value } })}
                />
              </div>
            </div>
            <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange-600"
                checked={settings.openingHours.isOpen}
                onChange={e => setSettings({ ...settings, openingHours: { ...settings.openingHours, isOpen: e.target.checked } })}
              />
              <span className="text-sm font-medium">{t('admin.settings_is_open')}</span>
            </label>
          </div>

          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className={`font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <CreditCard className="text-orange-600" size={18} />
              {t('admin.settings_payment')}
            </h4>
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Banknote className="text-green-600" />
                  <span className="font-medium">{t('cart.cash')}</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.paymentMethods.cash}
                  onChange={e => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, cash: e.target.checked } })}
                />
              </label>
              <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Wallet className="text-blue-600" />
                  <span className="font-medium">{t('cart.instapay')}</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.paymentMethods.instapay}
                  onChange={e => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, instapay: e.target.checked } })}
                />
              </label>
              {settings.paymentMethods.instapay && (
                <div className="px-4 pb-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('admin.settings_instapay_handle')}</label>
                  <input
                    type="text"
                    placeholder="example@instapay"
                    className={`w-full p-2 rounded-lg border border-gray-200 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                    value={settings.instapayHandle || ''}
                    onChange={e => setSettings({ ...settings, instapayHandle: e.target.value })}
                  />
                </div>
              )}

              <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <CreditCard className="text-purple-600" />
                  <span className="font-medium">{t('cart.card')}</span>
                </div>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.paymentMethods.card}
                  onChange={e => setSettings({ ...settings, paymentMethods: { ...settings.paymentMethods, card: e.target.checked } })}
                />
              </label>
              {settings.paymentMethods.card && (
                <div className="px-4 pb-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">{t('admin.settings_card_details')}</label>
                  <textarea
                    placeholder={t('admin.settings_card_placeholder')}
                    className={`w-full p-2 rounded-lg border border-gray-200 outline-none text-sm min-h-[60px] ${isRTL ? 'text-right' : 'text-left'}`}
                    value={settings.cardDetails || ''}
                    onChange={e => setSettings({ ...settings, cardDetails: e.target.value })}
                  />
                </div>
              )}
              <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Wallet className="text-orange-600" />
                  <span className="font-medium">{t('cart.wallet')}</span>
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
            <h4 className={`font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TrendingUp className="text-orange-600" size={18} />
              {t('admin.settings_social')}
            </h4>
            <div className="space-y-3">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Facebook size={18} className="text-blue-600" />
                <input
                  type="url"
                  placeholder={t('admin.settings_facebook_placeholder')}
                  className={`flex-1 p-2 rounded-lg border border-gray-100 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.socialLinks.facebook}
                  onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                />
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Instagram size={18} className="text-pink-600" />
                <input
                  type="url"
                  placeholder={t('admin.settings_instagram_placeholder')}
                  className={`flex-1 p-2 rounded-lg border border-gray-100 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.socialLinks.instagram}
                  onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                />
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Music2 size={18} className="text-black" />
                <input
                  type="url"
                  placeholder={t('admin.settings_tiktok_placeholder')}
                  className={`flex-1 p-2 rounded-lg border border-gray-100 outline-none text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.socialLinks.tiktok}
                  onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, tiktok: e.target.value } })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* PWA Settings */}
        <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className={`text-xl font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AppWindow className="text-orange-600" />
            إعدادات تطبيق PWA
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم التطبيق الكامل</label>
              <input
                type="text"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={pwaSettings.name}
                onChange={e => setPwaSettings({ ...pwaSettings, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">الاسم المختصر (يظهر تحت الأيقونة)</label>
              <input
                type="text"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={pwaSettings.shortName}
                onChange={e => setPwaSettings({ ...pwaSettings, shortName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">وصف التطبيق</label>
              <textarea
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px] ${isRTL ? 'text-right' : 'text-left'}`}
                value={pwaSettings.description}
                onChange={e => setPwaSettings({ ...pwaSettings, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">لون السمة (Theme)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer"
                    value={pwaSettings.themeColor}
                    onChange={e => setPwaSettings({ ...pwaSettings, themeColor: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 rounded-lg border border-gray-200 outline-none text-sm"
                    value={pwaSettings.themeColor}
                    onChange={e => setPwaSettings({ ...pwaSettings, themeColor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">لون الخلفية</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer"
                    value={pwaSettings.backgroundColor}
                    onChange={e => setPwaSettings({ ...pwaSettings, backgroundColor: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 p-2 rounded-lg border border-gray-200 outline-none text-sm"
                    value={pwaSettings.backgroundColor}
                    onChange={e => setPwaSettings({ ...pwaSettings, backgroundColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-orange-50 p-4 rounded-2xl mb-6">
            <QrCode size={48} className="text-orange-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('admin.settings_qr_title')}</h3>
          <p className="text-gray-500 mb-8 text-sm">{t('admin.settings_qr_subtitle')}</p>
          
          <div ref={qrRef} className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 mb-8 relative group">
            <div className="absolute inset-0 bg-orange-600/5 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <QRCodeSVG 
              value={menuUrl} 
              size={240} 
              level="H" 
              includeMargin={false}
              imageSettings={{
                src: "https://cdn-icons-png.flaticon.com/512/3443/3443338.png",
                x: undefined,
                y: undefined,
                height: 50,
                width: 50,
                excavate: true,
              }}
            />
          </div>

          <div className={`flex gap-3 w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={downloadQR}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all"
            >
              <Download size={20} />
              {t('admin.settings_qr_download')}
            </button>
            <button
              onClick={() => window.open(menuUrl, '_blank')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              {t('admin.settings_qr_open')}
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400 break-all">{menuUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
