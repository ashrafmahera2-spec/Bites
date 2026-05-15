export interface PrintOptions {
  type: 'invoice' | 'kitchen' | 'both';
  printerName?: string;
}

export const printOrder = (order: any, settings: any, t: (key: string) => string, isRTL: boolean, options: PrintOptions = { type: 'invoice' }, categories: any[] = []) => {
  const getItemPrinter = (item: any) => {
    const cat = categories.find(c => c.id === item.categoryId || c.name === item.category);
    return cat?.printerName || 'Kitchen';
  };

  const getFilteredItems = (type: 'invoice' | 'kitchen', printer?: string) => {
    if (type === 'invoice') return order.items;
    if (!printer) return order.items;
    
    return order.items.filter((item: any) => {
      const itemPrinter = getItemPrinter(item);
      return itemPrinter.toLowerCase() === printer.toLowerCase();
    });
  };

  const printItems = (items: any[], type: 'invoice' | 'kitchen') => items.map((item: any) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: ${item.selectedSize ? '10px' : '11px'};">
      <div style="flex: 1;">
        <span style="font-weight: bold;">${item.name} ${item.selectedSize ? `(${item.selectedSize})` : ''} x${item.quantity}</span>
        ${item.subItems && item.subItems.length > 0 ? `
          <div style="font-size: 9px; color: #555; margin-top: 2px;">
            ${item.subItems.map((si: string) => `• ${si}`).join('<br>')}
          </div>
        ` : ''}
      </div>
      <div style="width: 60px; text-align: right;">${type === 'kitchen' ? '' : (item.price * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  const renderTemplate = (type: 'invoice' | 'kitchen', printer?: string) => {
    const printSettings = settings?.printSettings || {
      invoiceSize: '80mm',
      showLogo: true,
      headerText: '',
      footerText: '',
      invoiceStyle: 'classic'
    };

    const isA4 = printSettings.invoiceSize === 'A4';
    const width = isA4 ? '210mm' : printSettings.invoiceSize;
    const isKitchen = type === 'kitchen';
    const itemsToPrint = getFilteredItems(type, printer);
    const style = printSettings.invoiceStyle || 'classic';
    const isSmall = printSettings.invoiceSize === '58mm';

    if (itemsToPrint.length === 0) return null;

    const subtotal = order.subtotal || order.total || 0;
    const taxAmount = order.taxAmount || 0;
    const serviceAmount = order.serviceChargeAmount || 0;
    const deliveryFee = order.deliveryFee || 0;
    const discount = order.discount || 0;

    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <title>${isKitchen ? (printer || 'Kitchen') : 'Receipt'} #${order.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Cairo', sans-serif; 
              padding: ${isA4 ? '10mm' : (isSmall ? '2mm' : '4mm')}; 
              width: ${width}; 
              max-width: 100%;
              margin: 0 auto;
              color: #000;
              background: white;
              line-height: 1.2;
              font-size: ${isA4 ? '12pt' : (isSmall ? '10px' : '12px')};
              overflow-x: hidden;
            }
            .header { text-align: center; margin-bottom: 10px; }
            ${isA4 ? `
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; text-align: ${isRTL ? 'right' : 'left'}; }
              .header-info { flex: 1; }
            ` : ''}
            .header h1 { margin: 0; font-size: ${isA4 ? '20pt' : (isSmall ? '14px' : '18px')}; font-weight: 800; }
            .logo { max-width: ${isA4 ? '100px' : (isSmall ? '50px' : '70px')}; margin-bottom: 5px; filter: grayscale(1); }
            .info { margin-bottom: 10px; font-size: ${isA4 ? '10pt' : (isSmall ? '9px' : '11px')}; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; }
            .info p { margin: 1px 0; display: flex; justify-content: space-between; }
            .items { margin-bottom: 10px; width: 100%; }
            .items-header { display: flex; justify-content: space-between; font-weight: bold; font-size: ${isSmall ? '10px' : '12px'}; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; }
            ${isA4 ? `
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th { background: #f9f9f9; padding: 8px; text-align: ${isRTL ? 'right' : 'left'}; border: 1px solid #eee; }
              td { padding: 8px; border: 1px solid #eee; }
            ` : ''}
            .item-row { display: flex; justify-content: space-between; margin-bottom: 3px; page-break-inside: avoid; align-items: flex-start; }
            .item-name { flex: 1; font-weight: bold; padding-${isRTL ? 'left' : 'right'}: 5px; word-break: break-word; }
            .item-price { width: 55px; text-align: right; font-weight: bold; white-space: nowrap; }
            .sub-items { font-size: ${isSmall ? '8px' : '9px'}; color: #444; padding-${isRTL ? 'right' : 'left'}: 5px; margin-top: 1px; line-height: 1.1; }
            .totals { border-top: 1px solid #000; padding-top: 5px; font-size: ${isA4 ? '11pt' : (isSmall ? '10px' : '12px')}; }
            ${isA4 ? `
              .totals { float: ${isRTL ? 'left' : 'right'}; width: 220px; border-top: none; }
              .totals p { border-bottom: 1px solid #f5f5f5; padding: 4px 0; }
            ` : ''}
            .totals p { margin: 1px 0; display: flex; justify-content: space-between; }
            .grand-total { font-weight: 800; font-size: ${isA4 ? '14pt' : (isSmall ? '13px' : '16px')}; border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: ${isSmall ? '8px' : '10px'}; border-top: 1px dashed #000; padding-top: 5px; width: 100%; clear: both; }
            
            @media print {
              body { width: ${width}; padding: ${isA4 ? '10mm' : (isSmall ? '1mm' : '3mm')}; margin: 0; }
              @page { margin: 0; size: ${width === 'A4' ? 'A4' : 'auto'}; }
            }

            ${style === 'modern' ? `
              .grand-total { background: #000; color: #fff; padding: 5px 10px; margin: 5px 0; }
              .header h1 { letter-spacing: 1px; text-transform: uppercase; }
            ` : ''}

            ${style === 'compact' ? `
              .info, .items, .totals { margin-bottom: 5px; }
              .header { margin-bottom: 5px; }
              .info { padding: 2px 0; }
            ` : ''}

            .kitchen-label {
              font-size: ${isSmall ? '16px' : '22px'};
              font-weight: 900;
              border: 3px solid #000;
              padding: 5px 15px;
              display: inline-block;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${isKitchen ? `<div class="kitchen-label">${printer || 'Kitchen'}</div>` : (isA4 ? `
               <div class="header-info">
                 <h1>${settings?.restaurantName || "Restaurant"}</h1>
                 ${printSettings.headerText ? `<p style="font-size: 10pt; white-space: pre-line; margin-top: 5px;">${printSettings.headerText}</p>` : ''}
                 <p style="margin-top: 5px;">${settings?.restaurantAddress || ''}</p>
                 <p>${settings?.whatsappNumber || ''}</p>
               </div>
               ${printSettings.showLogo && settings?.logoUrl ? `<img src="${settings.logoUrl}" class="logo" />` : ''}
            ` : `
              ${printSettings.showLogo && settings?.logoUrl ? `<img src="${settings.logoUrl}" class="logo" />` : ''}
              <h1>${settings?.restaurantName || "Restaurant"}</h1>
              ${printSettings.headerText ? `<p style="font-size: 10px; white-space: pre-line;">${printSettings.headerText}</p>` : ''}
            `)}
          </div>

          <div class="info">
            <p><span>${t('admin.orders_order_id')}:</span> <span>#${order.id.toString().slice(-6)}</span></p>
            <p><span>${t('admin.orders_date')}:</span> <span>${new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</span></p>
            <p><span>${t('admin.order_type')}:</span> <span>${t(`admin.type_${order.type}`)}</span></p>
            ${order.branchName ? `<p><span>${t('admin.branch')}:</span> <span>${order.branchName}</span></p>` : ''}
            ${order.tableNumber ? `<p style="font-size: 14px; font-weight: bold; border: 1px solid #000; padding: 4px; margin-top: 5px; text-align: center;"><span>${t('admin.table_number') || 'Table'}:</span> <span>${order.tableNumber}</span></p>` : ''}
            ${!isKitchen ? `
              <p><span>${t('admin.orders_customer')}:</span> <span>${order.customerName || t('common.guest')}</span></p>
              ${order.customerPhone ? `<p><span>${t('admin.orders_phone')}:</span> <span>${order.customerPhone}</span></p>` : ''}
              ${order.type === 'delivery' && order.address ? `<p><span>${t('admin.orders_address')}:</span> <span>${order.address}</span></p>` : ''}
            ` : ''}
          </div>

          ${isA4 ? `
            <table>
              <thead>
                <tr>
                  <th>${t('admin.orders_item')}</th>
                  <th style="width: 100px; text-align: center;">${t('admin.orders_quantity')}</th>
                  ${!isKitchen ? `
                    <th style="width: 120px; text-align: center;">${t('admin.orders_price')}</th>
                    <th style="width: 120px; text-align: center;">${t('admin.orders_total')}</th>
                  ` : ''}
                </tr>
              </thead>
              <tbody>
                ${itemsToPrint.map((item: any) => `
                  <tr>
                    <td>
                      <div style="font-weight: bold;">${item.name}</div>
                      ${item.subItems && item.subItems.length > 0 ? `
                        <div style="font-size: 10pt; color: #666; margin-top: 2px;">
                          ${item.subItems.map((si: string) => `• ${si}`).join(' ')}
                        </div>
                      ` : ''}
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    ${!isKitchen ? `
                      <td style="text-align: center;">${item.price.toFixed(2)}</td>
                      <td style="text-align: ${isRTL ? 'left' : 'right'}; font-weight: bold;">${(item.price * item.quantity).toFixed(2)}</td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `
            <div class="items">
              <div class="items-header">
                <span>${t('admin.orders_item')}</span>
                ${!isKitchen ? `<span>${t('admin.orders_total')}</span>` : ''}
              </div>
              ${itemsToPrint.map((item: any) => `
                <div class="item-row">
                  <div class="item-name">
                    ${item.name} x${item.quantity}
                    ${item.subItems && item.subItems.length > 0 ? `
                      <div class="sub-items">
                        ${item.subItems.map((si: string) => `• ${si}`).join('<br>')}
                      </div>
                    ` : ''}
                  </div>
                  <div class="item-price">${!isKitchen ? (item.price * item.quantity).toFixed(2) : ''}</div>
                </div>
              `).join('')}
            </div>
          `}

          ${!isKitchen ? `
            <div class="totals">
              <p><span>${t('cart.subtotal')}:</span> <span>${subtotal.toFixed(2)}</span></p>
              ${taxAmount > 0 ? `<p><span>${t('admin.settings_tax_label')}:</span> <span>${taxAmount.toFixed(2)}</span></p>` : ''}
              ${serviceAmount > 0 ? `<p><span>${t('admin.settings_service_charge')}:</span> <span>${serviceAmount.toFixed(2)}</span></p>` : ''}
              ${deliveryFee > 0 ? `<p><span>${t('cart.delivery_fee')}:</span> <span>${deliveryFee.toFixed(2)}</span></p>` : ''}
              ${discount > 0 ? `<p><span>${t('admin.coupons_discount')}:</span> <span>-${discount.toFixed(2)}</span></p>` : ''}
              <p class="grand-total">
                <span>${t('admin.orders_total')}:</span> 
                <span>${order.total.toFixed(2)} ${t('common.currency')}</span>
              </p>
            </div>
          ` : ''}

          <div class="footer">
            ${!isKitchen && printSettings.footerText ? `<p style="white-space: pre-line; margin-bottom: 10px;">${printSettings.footerText}</p>` : ''}
            <p>${isKitchen ? `--- End of Order Slip ---` : t('cart.thank_you')}</p>
          </div>
        </body>
      </html>
    `;
  };

  const doPrint = (html: string) => {
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
    const doc = printFrame.contentDocument || printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      }, 500);
    }
  };

  if (options.type === 'invoice' || options.type === 'both') {
    const html = renderTemplate('invoice');
    if (html) doPrint(html);
  }

  if (options.type === 'kitchen' || options.type === 'both') {
    // Identify unique printers in the order
    const printerSet = new Set<string>();
    order.items.forEach((item: any) => printerSet.add(getItemPrinter(item)));
    const printers = Array.from(printerSet);

    printers.forEach((printer, index) => {
      setTimeout(() => {
        const html = renderTemplate('kitchen', printer);
        if (html) doPrint(html);
      }, (options.type === 'both' ? 1500 : 0) + (index * 1500));
    });
  }
};
