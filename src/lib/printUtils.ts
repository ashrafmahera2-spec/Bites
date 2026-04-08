export const printOrder = (order: any, settings: any, t: (key: string) => string, isRTL: boolean) => {
  // Use a hidden iframe for printing to avoid popup blockers in iframes
  let printFrame = document.getElementById('print-frame') as HTMLIFrameElement;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);
  }

  const printSettings = settings?.printSettings || {
    invoiceSize: '80mm',
    showLogo: true,
    headerText: '',
    footerText: '',
    invoiceStyle: 'classic'
  };

  const taxConfig = settings?.taxConfig || { enableTax: false, taxRate: 0, enableServiceCharge: false, serviceChargeRate: 0 };

  const itemsHtml = order.items.map((item: any) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
      <div style="flex: 1;">${item.name} x${item.quantity}</div>
      <div style="width: 60px; text-align: right;">${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  const width = printSettings.invoiceSize === 'A4' ? '210mm' : printSettings.invoiceSize;
  const isModern = printSettings.invoiceStyle === 'modern';
  const isCompact = printSettings.invoiceStyle === 'compact';

  const html = `
    <!DOCTYPE html>
    <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>Receipt #${order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          * { box-sizing: border-box; }
          body { 
            font-family: 'Cairo', sans-serif; 
            padding: ${printSettings.invoiceSize === 'A4' ? '40px' : '10px'}; 
            width: ${width}; 
            margin: 0 auto;
            color: #000;
            background: white;
            line-height: 1.4;
          }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { margin: 0; font-size: ${isModern ? '22px' : '18px'}; font-weight: 800; text-transform: uppercase; }
          .logo { max-width: 80px; margin-bottom: 10px; filter: grayscale(1); }
          .info { margin-bottom: 15px; font-size: 10px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 8px 0; }
          .info p { margin: 2px 0; display: flex; justify-content: space-between; }
          .items { margin-bottom: 15px; }
          .items-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; }
          .totals { border-top: 1px solid #000; padding-top: 8px; font-size: 11px; }
          .totals p { margin: 2px 0; display: flex; justify-content: space-between; }
          .grand-total { font-weight: 800; font-size: 14px; border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 9px; border-top: 1px dashed #000; padding-top: 10px; }
          .custom-text { margin: 5px 0; font-size: 10px; }
          .qr-placeholder { margin: 15px auto; width: 80px; height: 80px; border: 1px solid #eee; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #ccc; }
          @media print {
            body { width: 100%; padding: 0; margin: 0; }
            @page { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${printSettings.showLogo && settings?.logoUrl ? `<img src="${settings.logoUrl}" class="logo" />` : ''}
          <h1>${settings?.restaurantName || "Bite's Restaurant"}</h1>
          ${printSettings.headerText ? `<div class="custom-text">${printSettings.headerText}</div>` : ''}
          <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">${t('admin.orders_invoice_title')}</div>
        </div>

        <div class="info">
          <p><span>${t('admin.orders_order_id')}:</span> <span>#${order.id.toString().slice(-6)}</span></p>
          <p><span>${t('admin.orders_date')}:</span> <span>${new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</span></p>
          <p><span>${t('admin.orders_customer')}:</span> <span>${order.customerName}</span></p>
          <p><span>${t('admin.orders_phone')}:</span> <span>${order.customerPhone}</span></p>
          <p><span>${t('admin.cashier_payment_method')}:</span> <span>${t(`cart.${order.paymentMethod || 'cash'}`)}</span></p>
        </div>

        <div class="items">
          <div class="items-header">
            <span>${t('admin.orders_item')}</span>
            <span>${t('admin.orders_total')}</span>
          </div>
          ${itemsHtml}
        </div>

        <div class="totals">
          <p><span>Subtotal:</span> <span>${(order.subtotal || order.total).toFixed(2)}</span></p>
          ${taxConfig.enableTax ? `<p><span>Tax (${taxConfig.taxRate}%):</span> <span>${((order.subtotal || order.total) * taxConfig.taxRate / 100).toFixed(2)}</span></p>` : ''}
          ${taxConfig.enableServiceCharge ? `<p><span>Service (${taxConfig.serviceChargeRate}%):</span> <span>${((order.subtotal || order.total) * taxConfig.serviceChargeRate / 100).toFixed(2)}</span></p>` : ''}
          ${order.discount ? `<p><span>Discount:</span> <span>-${order.discount.toFixed(2)}</span></p>` : ''}
          <p class="grand-total"><span>${t('admin.orders_total')}:</span> <span>${order.total.toFixed(2)} ${t('common.currency')}</span></p>
        </div>

        ${printSettings.footerText ? `<div class="custom-text" style="text-align: center; margin-top: 15px;">${printSettings.footerText}</div>` : ''}
        
        <div class="footer">
          <p>${t('common.thank_you')}</p>
          <p>${window.location.origin}</p>
        </div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const doc = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    
    // Give time for resources to load before printing
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 500);
  }
};
