import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Utensils } from 'lucide-react';

interface InvoicePreviewProps {
  settings: any;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ settings }) => {
  const { t, isRTL } = useLanguage();
  const printSettings = settings.printSettings || {};
  const taxConfig = settings.taxConfig || {};

  const mockOrder = {
    id: '123456',
    customerName: 'Ahmed Ali',
    items: [
      { name: 'Burger Classic', quantity: 2, price: 85 },
      { name: 'Pepsi', quantity: 2, price: 15 }
    ],
    total: 230,
    subtotal: 200,
    createdAt: new Date().toISOString()
  };

  const style = printSettings.invoiceStyle || 'classic';
  const size = printSettings.invoiceSize || '80mm';
  const isSmall = size === '58mm';

  const taxRate = taxConfig?.enableTax ? (taxConfig.taxRate || 0) : 0;
  const serviceRate = taxConfig?.enableServiceCharge ? (taxConfig.serviceChargeRate || 0) : 0;
  const taxAmount = (mockOrder.subtotal * taxRate) / 100;
  const serviceAmount = (mockOrder.subtotal * serviceRate) / 100;

  return (
    <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 flex justify-center overflow-x-auto">
      <div 
        className={`bg-white shadow-lg p-4 text-black font-mono transition-all duration-300 ${
          size === '58mm' ? 'w-[200px] text-[9px]' : size === '80mm' ? 'w-[280px] text-xs' : 'w-[400px] text-sm'
        } ${style === 'modern' ? 'border-t-4 border-orange-600' : ''}`}
        style={{ minHeight: '300px' }}
      >
        {/* Header */}
        <div className="text-center space-y-1 mb-4">
          {printSettings.showLogo && settings.logoUrl && (
            <div className="flex justify-center mb-2">
              <img src={settings.logoUrl} alt="Logo" className="h-10 object-contain grayscale" />
            </div>
          )}
          <h2 className={`font-bold uppercase ${isSmall ? 'text-sm' : 'text-lg'}`}>{settings.restaurantName || 'Restaurant Name'}</h2>
          {printSettings.headerText && <p className="text-[8px] text-gray-500 whitespace-pre-line">{printSettings.headerText}</p>}
          <div className="border-b border-dashed border-gray-300 my-2" />
        </div>

        {/* Info */}
        <div className={`space-y-0.5 mb-4 ${isSmall ? 'text-[8px]' : 'text-[10px]'}`}>
          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>Order ID:</span>
            <span>#123456</span>
          </div>
          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>Customer:</span>
            <span> Ahmed Ali</span>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          <div className={`flex justify-between font-bold border-b border-gray-100 pb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="w-1/2">{t('admin.orders_item')}</span>
            <span className="w-1/4 text-right">Total</span>
          </div>
          {mockOrder.items.map((item, i) => (
            <div key={i} className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="w-1/2">{item.name} x{item.quantity}</span>
              <span className="w-1/4 text-right">{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>Subtotal:</span>
            <span>{mockOrder.subtotal.toFixed(2)}</span>
          </div>
          {taxAmount > 0 && (
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>Tax ({taxRate}%):</span>
              <span>{taxAmount.toFixed(2)}</span>
            </div>
          )}
          {serviceAmount > 0 && (
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>Service ({serviceRate}%):</span>
              <span>{serviceAmount.toFixed(2)}</span>
            </div>
          )}
          <div className={`flex justify-between font-bold pt-1 border-t border-gray-100 ${isSmall ? 'text-xs' : 'text-base'} ${style === 'modern' ? 'bg-black text-white p-1 -mx-1' : ''} ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>TOTAL:</span>
            <span>{(mockOrder.subtotal + taxAmount + serviceAmount).toFixed(2)} LE</span>
          </div>
        </div>

        {/* Footer */}
        {printSettings.footerText && (
          <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
            <p className="text-[8px] text-gray-500 italic whitespace-pre-line">{printSettings.footerText}</p>
          </div>
        )}
        <div className="text-center mt-4 text-[8px] text-gray-400">
          {t('common.thank_you')}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
