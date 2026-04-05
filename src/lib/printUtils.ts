export const printOrder = (order: any, settings: any, t: (key: string) => string, isRTL: boolean) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = order.items.map((item: any) => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span>${item.name} x${item.quantity}</span>
      <span>${item.price * item.quantity} ${t('common.currency')}</span>
    </div>
  `).join('');

  const html = `
    <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>Receipt #${order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
          body { 
            font-family: 'Cairo', sans-serif; 
            padding: 20px; 
            width: 80mm; 
            margin: 0 auto;
            color: #333;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 20px; color: #f97316; }
          .info { margin-bottom: 15px; font-size: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
          .items { margin-bottom: 15px; font-size: 12px; }
          .total { border-top: 2px solid #333; padding-top: 10px; font-weight: bold; text-align: right; font-size: 16px; }
          .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #888; }
          @media print {
            body { width: 100%; padding: 0; }
            @page { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${settings?.restaurantName || "Bite's Restaurant"}</h1>
          <p>${t('admin.orders_invoice_title')}</p>
        </div>
        <div class="info">
          <p><strong>${t('admin.orders_order_id')}:</strong> #${order.id}</p>
          <p><strong>${t('admin.orders_date')}:</strong> ${new Date(order.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</p>
          <p><strong>${t('admin.orders_customer')}:</strong> ${order.customerName}</p>
          <p><strong>${t('admin.orders_phone')}:</strong> ${order.customerPhone}</p>
          ${order.address ? `<p><strong>${t('admin.orders_address')}:</strong> ${order.address}</p>` : ''}
        </div>
        <div class="items">
          ${itemsHtml}
        </div>
        <div class="total">
          ${t('admin.orders_total')}: ${order.total} ${t('common.currency')}
        </div>
        <div class="footer">
          <p>${t('common.thank_you')}</p>
          <p>${window.location.origin}</p>
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
