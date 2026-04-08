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

  return (
    <div className="bg-gray-100 p-4 rounded-2xl border border-gray-200 flex justify-center">
      <div 
        className={`bg-white shadow-lg p-6 text-black font-mono text-[10px] sm:text-xs transition-all duration-300 ${
          size === '58mm' ? 'w-[200px]' : size === '80mm' ? 'w-[280px]' : 'w-[400px]'
        }`}
        style={{ minHeight: '300px' }}
      >
        {/* Header */}
        <div className="text-center space-y-1 mb-4">
          {printSettings.showLogo && (
            <div className="flex justify-center mb-2">
              <div className="bg-orange-600 p-1 rounded-lg">
                <Utensils size={20} className="text-white" />
              </div>
            </div>
          )}
          <h2 className="font-bold text-sm uppercase">{settings.restaurantName || 'Restaurant Name'}</h2>
          {printSettings.headerText && <p className="text-[8px] text-gray-500">{printSettings.headerText}</p>}
          <div className="border-b border-dashed border-gray-300 my-2" />
        </div>

        {/* Info */}
        <div className={`flex justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>Order: #{mockOrder.id}</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          <div className={`flex justify-between font-bold border-b border-gray-100 pb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className="w-1/2">{t('admin.orders_item')}</span>
            <span className="w-1/4 text-center">Qty</span>
            <span className="w-1/4 text-right">Total</span>
          </div>
          {mockOrder.items.map((item, i) => (
            <div key={i} className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="w-1/2">{item.name}</span>
              <span className="w-1/4 text-center">x{item.quantity}</span>
              <span className="w-1/4 text-right">{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
          <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>Subtotal:</span>
            <span>{mockOrder.subtotal}</span>
          </div>
          {taxConfig.enableTax && (
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>Tax ({taxConfig.taxRate}%):</span>
              <span>{(mockOrder.subtotal * taxConfig.taxRate / 100).toFixed(2)}</span>
            </div>
          )}
          {taxConfig.enableServiceCharge && (
            <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>Service ({taxConfig.serviceChargeRate}%):</span>
              <span>{(mockOrder.subtotal * taxConfig.serviceChargeRate / 100).toFixed(2)}</span>
            </div>
          )}
          <div className={`flex justify-between font-bold text-sm pt-1 border-t border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>TOTAL:</span>
            <span>{mockOrder.total} LE</span>
          </div>
        </div>

        {/* Footer */}
        {printSettings.footerText && (
          <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
            <p className="text-[8px] text-gray-500 italic">{printSettings.footerText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePreview;
