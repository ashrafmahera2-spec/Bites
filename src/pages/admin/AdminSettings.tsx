import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Save, QrCode, Download, Smartphone, CreditCard, Banknote, Wallet, Clock, Facebook, Instagram, Music2, TrendingUp, X, AppWindow, Settings as SettingsIcon, DollarSign, Printer, Eye, UtensilsCrossed, Plus, Trash2 } from 'lucide-react';
import InvoicePreview from '../../components/admin/InvoicePreview';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

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
  features: {
    enableCoupons: boolean;
    enablePoints: boolean;
    requireLogin: boolean;
    orderMethod: 'whatsapp' | 'platform';
    menuTheme: 'classic' | 'bottom-nav' | 'sidebar';
  };
  pointsConfig: {
    pointsPerCurrency: number;
    currencyPerPoint: number;
    minPointsToRedeem: number;
  };
  taxConfig: {
    enableTax: boolean;
    taxRate: number;
    enableServiceCharge: boolean;
    serviceChargeRate: number;
  };
  printSettings: {
    invoiceSize: '58mm' | '80mm' | 'A4';
    showLogo: boolean;
    headerText: string;
    footerText: string;
    invoiceStyle: 'classic' | 'modern' | 'compact';
    invoicePrinterName: string;
    kitchenPrinterName: string;
  };
  tables?: { id: string; name: string }[];
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
  const { refreshSettings } = useSettings();
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
    },
    features: {
      enableCoupons: true,
      enablePoints: true,
      requireLogin: false,
      orderMethod: 'platform',
      menuTheme: 'classic'
    },
    pointsConfig: {
      pointsPerCurrency: 1,
      currencyPerPoint: 0.1,
      minPointsToRedeem: 100
    },
    taxConfig: {
      enableTax: false,
      taxRate: 14,
      enableServiceCharge: false,
      serviceChargeRate: 10
    },
    printSettings: {
      invoiceSize: '80mm',
      showLogo: true,
      headerText: '',
      footerText: '',
      invoiceStyle: 'classic',
      invoicePrinterName: '',
      kitchenPrinterName: ''
    },
    tables: []
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
      await refreshSettings();
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

  const downloadTableQR = (table: { id: string; name: string }) => {
    // We'll use a hidden div or similar to render the specific QR
    const tableUrl = `${window.location.origin}/?table=${table.id}`;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use a temporary div to render the SVG from qrcode.react
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    // This is a bit tricky in pure React if we want to do it imperatively
    // But we can just create a simple SVG string or use the existing QRCodeSVG component
    // For simplicity, let's just use the same logic as downloadQR but with custom text
    
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
      ctx.fillText(settings.restaurantName || "Restaurant", 200, 55);
      ctx.font = 'bold 18px Arial';
      ctx.fillText(`${t('admin.tables_name')}: ${table.name}`, 200, 85);
      
      // We need the SVG for the table URL
      // Since we can't easily get it here, we'll suggest using the main QR for now or
      // we can render a hidden QRCodeSVG.
      // Let's do it properly by adding a state for "currently-downloading-table"
      setDownloadTableTarget(table);
      setTimeout(() => {
        const svg = document.getElementById(`table-qr-${table.id}`)?.querySelector('svg');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const qrImg = new Image();
          qrImg.onload = () => {
            ctx.drawImage(qrImg, 60, 120, 280, 280);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '12px Arial';
            ctx.fillText("Scan to order from this table", 200, 430);
            ctx.fillText("Powered by mamlinc", 200, 480);
            
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `table-${table.name}-qr.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            setDownloadTableTarget(null);
          };
          qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
      }, 100);
    };
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='; // dummy
  };

  const [downloadTableTarget, setDownloadTableTarget] = useState<{ id: string; name: string } | null>(null);

  const addTable = () => {
    const name = prompt(t('admin.tables_add_prompt') || 'Enter table name/number:');
    if (name) {
      const newTable = { id: name.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now(), name };
      setSettings(prev => ({ ...prev, tables: [...(prev.tables || []), newTable] }));
    }
  };

  const removeTable = (id: string) => {
    if (confirm(t('common.delete_confirm'))) {
      setSettings(prev => ({ ...prev, tables: (prev.tables || []).filter(t => t.id !== id) }));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;

  const menuUrl = window.location.origin;

  return (
    <div className="space-y-8">
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.settings')}</h2>
        <button
          onClick={handleSave}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
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
                {settings.logoUrl && settings.logoUrl.trim() !== '' ? (
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

        <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className={`font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <SettingsIcon className="text-orange-600" size={18} />
              {t('admin.settings_features')}
            </h4>
            <div className="space-y-3">
              <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium">{t('admin.settings_enable_coupons')}</span>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.features.enableCoupons}
                  onChange={e => setSettings({ ...settings, features: { ...settings.features, enableCoupons: e.target.checked } })}
                />
              </label>
              <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium">{t('admin.settings_enable_points')}</span>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.features.enablePoints}
                  onChange={e => setSettings({ ...settings, features: { ...settings.features, enablePoints: e.target.checked } })}
                />
              </label>
              <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="font-medium">{t('admin.settings_require_login')}</span>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-orange-600"
                  checked={settings.features.requireLogin}
                  onChange={e => setSettings({ ...settings, features: { ...settings.features, requireLogin: e.target.checked } })}
                />
              </label>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('admin.settings_order_method')}</label>
                <select
                  className={`w-full p-3 rounded-xl border border-gray-200 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.features.orderMethod}
                  onChange={e => setSettings({ ...settings, features: { ...settings.features, orderMethod: e.target.value as any } })}
                >
                  <option value="platform">{t('admin.settings_order_platform')}</option>
                  <option value="whatsapp">{t('admin.settings_order_whatsapp')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('admin.settings_menu_theme')}</label>
                <select
                  className={`w-full p-3 rounded-xl border border-gray-200 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.features.menuTheme}
                  onChange={e => setSettings({ ...settings, features: { ...settings.features, menuTheme: e.target.value as any } })}
                >
                  <option value="classic">{t('admin.settings_theme_classic')}</option>
                  <option value="bottom-nav">{t('admin.settings_theme_bottom_nav')}</option>
                  <option value="sidebar">{t('admin.settings_theme_sidebar')}</option>
                </select>
              </div>
            </div>
          </div>

          {settings.features.enablePoints && (
            <div className="pt-6 border-t border-gray-50 space-y-4">
              <h4 className={`font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <TrendingUp className="text-orange-600" size={18} />
                {t('admin.settings_points_config')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('admin.settings_points_per_currency')}</label>
                  <input
                    type="number"
                    className={`w-full p-2 rounded-lg border border-gray-100 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                    value={settings.pointsConfig.pointsPerCurrency}
                    onChange={e => setSettings({ ...settings, pointsConfig: { ...settings.pointsConfig, pointsPerCurrency: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('admin.settings_currency_per_point')}</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`w-full p-2 rounded-lg border border-gray-100 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                    value={settings.pointsConfig.currencyPerPoint}
                    onChange={e => setSettings({ ...settings, pointsConfig: { ...settings.pointsConfig, currencyPerPoint: Number(e.target.value) } })}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{t('admin.settings_min_points_redeem')}</label>
                  <input
                    type="number"
                    className={`w-full p-2 rounded-lg border border-gray-100 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                    value={settings.pointsConfig.minPointsToRedeem}
                    onChange={e => setSettings({ ...settings, pointsConfig: { ...settings.pointsConfig, minPointsToRedeem: Number(e.target.value) } })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tax & Service Settings */}
          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className={`font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <DollarSign className="text-orange-600" size={18} />
              {t('admin.settings_tax_title')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{t('admin.settings_enable_tax')}</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-orange-600"
                    checked={settings.taxConfig?.enableTax}
                    onChange={e => setSettings({ ...settings, taxConfig: { ...settings.taxConfig, enableTax: e.target.checked } })}
                  />
                </label>
                {settings.taxConfig?.enableTax && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('admin.settings_tax_rate')} (%)</label>
                    <input
                      type="number"
                      className={`w-full p-2 rounded-lg border border-gray-100 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                      value={settings.taxConfig.taxRate}
                      onChange={e => setSettings({ ...settings, taxConfig: { ...settings.taxConfig, taxRate: Number(e.target.value) } })}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium">{t('admin.settings_enable_service')}</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-orange-600"
                    checked={settings.taxConfig?.enableServiceCharge}
                    onChange={e => setSettings({ ...settings, taxConfig: { ...settings.taxConfig, enableServiceCharge: e.target.checked } })}
                  />
                </label>
                {settings.taxConfig?.enableServiceCharge && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{t('admin.settings_service_rate')} (%)</label>
                    <input
                      type="number"
                      className={`w-full p-2 rounded-lg border border-gray-100 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                      value={settings.taxConfig.serviceChargeRate}
                      onChange={e => setSettings({ ...settings, taxConfig: { ...settings.taxConfig, serviceChargeRate: Number(e.target.value) } })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Printing Settings */}
          <div className="pt-6 border-t border-gray-50 space-y-4">
            <h4 className={`font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Printer className="text-orange-600" size={18} />
              {t('admin.settings_print_title')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_print_size')}</label>
                <select
                  className={`w-full p-3 rounded-xl border border-gray-200 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.printSettings?.invoiceSize || '80mm'}
                  onChange={e => setSettings({ ...settings, printSettings: { ...settings.printSettings, invoiceSize: e.target.value as any } })}
                >
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                  <option value="A4">A4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_print_style')}</label>
                <select
                  className={`w-full p-3 rounded-xl border border-gray-200 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.printSettings?.invoiceStyle || 'classic'}
                  onChange={e => setSettings({ ...settings, printSettings: { ...settings.printSettings, invoiceStyle: e.target.value as any } })}
                >
                  <option value="classic">{t('admin.settings_print_style_classic')}</option>
                  <option value="modern">{t('admin.settings_print_style_modern')}</option>
                  <option value="compact">{t('admin.settings_print_style_compact')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_invoice_printer')}</label>
                <input
                  type="text"
                  placeholder="e.g. POS-80"
                  className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.printSettings?.invoicePrinterName || ''}
                  onChange={e => setSettings({ ...settings, printSettings: { ...settings.printSettings, invoicePrinterName: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_kitchen_printer')}</label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen-Receipt"
                  className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                  value={settings.printSettings?.kitchenPrinterName || ''}
                  onChange={e => setSettings({ ...settings, printSettings: { ...settings.printSettings, kitchenPrinterName: e.target.value } })}
                />
              </div>
            </div>
            <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                className="w-4 h-4 accent-orange-600"
                checked={settings.printSettings?.showLogo ?? true}
                onChange={e => setSettings({ ...settings, printSettings: { ...settings.printSettings, showLogo: e.target.checked } })}
              />
              <span className="text-sm font-medium">{t('admin.settings_print_show_logo')}</span>
            </label>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_print_header')}</label>
              <textarea
                className={`w-full p-3 rounded-xl border border-gray-200 outline-none min-h-[60px] ${isRTL ? 'text-right' : 'text-left'}`}
                value={settings.printSettings?.headerText || ''}
                onChange={e => setSettings({ ...settings, printSettings: { ...settings.printSettings, headerText: e.target.value } })}
                placeholder={t('admin.settings_print_header_placeholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_print_footer')}</label>
              <textarea
                className={`w-full p-3 rounded-xl border border-gray-200 outline-none min-h-[60px] ${isRTL ? 'text-right' : 'text-left'}`}
                value={settings.printSettings?.footerText || ''}
                onChange={e => setSettings({ ...settings, printSettings: { ...settings.printSettings, footerText: e.target.value } })}
                placeholder={t('admin.settings_print_footer_placeholder')}
              />
            </div>

            <div className="pt-4">
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Eye size={16} />
                {t('admin.settings_print_preview')}
              </label>
              <InvoicePreview settings={settings} />
            </div>
          </div>
        </div>

        {/* PWA Settings */}
        <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h3 className={`text-xl font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <AppWindow className="text-orange-600" />
            {t('admin.settings_pwa_title')}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_pwa_name')}</label>
              <input
                type="text"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={pwaSettings.name}
                onChange={e => setPwaSettings({ ...pwaSettings, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_pwa_short_name')}</label>
              <input
                type="text"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={pwaSettings.shortName}
                onChange={e => setPwaSettings({ ...pwaSettings, shortName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_pwa_description')}</label>
              <textarea
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[80px] ${isRTL ? 'text-right' : 'text-left'}`}
                value={pwaSettings.description}
                onChange={e => setPwaSettings({ ...pwaSettings, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_pwa_theme_color')}</label>
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
                <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.settings_pwa_background_color')}</label>
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

        {/* Tables Management */}
        <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <UtensilsCrossed className="text-orange-600" />
              {t('admin.tables_title') || 'Tables Management'}
            </h3>
            <button
              onClick={addTable}
              className="p-2 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {(settings.tables || []).map(table => (
              <div key={table.id} className={`flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-orange-600">
                    {table.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="font-bold text-gray-900">{table.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono select-all">?table={table.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Hidden QR for downloading */}
                  <div id={`table-qr-${table.id}`} className="hidden">
                    <QRCodeSVG value={`${window.location.origin}/?table=${table.name}&branch=${settings.branchId || ''}`} size={256} level="H" />
                  </div>
                  
                  <button
                    onClick={() => downloadTableQR(table)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title={t('admin.settings_qr_download')}
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => removeTable(table.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {(settings.tables || []).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">{t('admin.tables_no_data') || 'No tables added yet'}</p>
              </div>
            )}
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

          <div className={`flex flex-col sm:flex-row gap-3 w-full ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
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
