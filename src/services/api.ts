const request = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    if (!res.ok) {
      throw new Error(text.slice(0, 100) || res.statusText);
    }
    return text;
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data;
};

export const api = {
  async getCategories() {
    return request('/api/categories');
  },
  async getProducts(branchId?: string | number) {
    const url = branchId ? `/api/products?branchId=${branchId}` : '/api/products';
    return request(url);
  },
  async updateProductAvailability(branchId: string | number, productId: string | number, isAvailable: boolean) {
    return request(`/api/branches/${branchId}/products/${productId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable })
    });
  },
  async getSettings() {
    return request('/api/settings');
  },
  async updateSettings(settings: any) {
    return request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  },
  async getOrders(branchId?: string | number) {
    const url = branchId ? `/api/orders?branchId=${branchId}` : '/api/orders';
    const data = await request(url);
    return (Array.isArray(data) ? data : []).map((order: any) => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));
  },
  async createOrder(order: any) {
    if (!navigator.onLine) {
      const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
      const tempOrder = { ...order, id: 'temp_' + Date.now(), createdAt: new Date().toISOString(), isOffline: true };
      offlineOrders.push(tempOrder);
      localStorage.setItem('offline_orders', JSON.stringify(offlineOrders));
      return tempOrder;
    }
    return request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
  },
  async syncOfflineOrders() {
    if (!navigator.onLine) return;
    const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
    if (offlineOrders.length === 0) return;

    const syncedOrders = [];
    for (const order of offlineOrders) {
      try {
        const { isOffline, id, ...orderData } = order;
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        if (res.ok) syncedOrders.push(order.id);
      } catch (e) {
        console.error('Failed to sync order:', order.id, e);
      }
    }

    const remainingOrders = offlineOrders.filter((o: any) => !syncedOrders.includes(o.id));
    localStorage.setItem('offline_orders', JSON.stringify(remainingOrders));
    return syncedOrders.length;
  },
  async updateOrderStatus(id: string | number, status: string) {
    return request(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },
  async assignDeliveryBoy(orderId: string | number, deliveryBoyId: number) {
    return request(`/api/orders/${orderId}/assign-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryBoyId })
    });
  },
  async deleteOrder(id: string | number) {
    return request(`/api/orders/${id}`, { method: 'DELETE' });
  },
  async addProduct(product: any) {
    return request('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
  },
  async updateProduct(id: string | number, product: any) {
    return request(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
  },
  async deleteProduct(id: string | number) {
    return request(`/api/products/${id}`, { method: 'DELETE' });
  },
  async addCategory(category: any) {
    return request('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
  },
  async updateCategory(id: string | number, category: any) {
    return request(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
  },
  async deleteCategory(id: string | number) {
    return request(`/api/categories/${id}`, { method: 'DELETE' });
  },
  async getDbConfig() {
    return request('/api/db-config');
  },
  async updateDbConfig(config: any) {
    return request('/api/db-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },
  async getHealth() {
    try {
      return await request('/api/health');
    } catch (e) {
      return { status: 'error', message: 'Failed to fetch health status' };
    }
  },
  async getOffers() {
    return request('/api/offers');
  },
  async addOffer(offer: any) {
    return request('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
  },
  async updateOffer(id: string | number, offer: any) {
    return request(`/api/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
  },
  async deleteOffer(id: string | number) {
    return request(`/api/offers/${id}`, { method: 'DELETE' });
  },
  async getStaff(branchId?: string | number) {
    const url = branchId ? `/api/staff?branchId=${branchId}` : '/api/staff';
    return request(url);
  },
  async addStaff(staff: any) {
    return request('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
  },
  async updateStaff(id: string | number, staff: any) {
    return request(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
  },
  async deleteStaff(id: string | number) {
    return request(`/api/staff/${id}`, { method: 'DELETE' });
  },
  async getBranches() {
    return request('/api/branches');
  },
  async addBranch(branch: any) {
    return request('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    });
  },
  async updateBranch(id: string | number, branch: any) {
    return request(`/api/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    });
  },
  async deleteBranch(id: string | number) {
    return request(`/api/branches/${id}`, { method: 'DELETE' });
  },
  async logError(error: { message: string; stack?: string; url: string; userAgent: string }) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });
    } catch (e) {
      console.error('Failed to log error to server:', e);
    }
  },
  async getErrors() {
    return request('/api/errors');
  },
  async clearErrors() {
    return request('/api/errors', { method: 'DELETE' });
  },
  async deleteError(id: number) {
    return request(`/api/errors/${id}`, { method: 'DELETE' });
  },
  async getCoupons() {
    return request('/api/coupons');
  },
  async addCoupon(coupon: any) {
    return request('/api/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon)
    });
  },
  async updateCoupon(id: string | number, coupon: any) {
    return request(`/api/coupons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coupon)
    });
  },
  async deleteCoupon(id: string | number) {
    return request(`/api/coupons/${id}`, { method: 'DELETE' });
  },
  async validateCoupon(code: string) {
    return request(`/api/coupons/validate/${code}`);
  },
  async getCustomers() {
    return request('/api/customers');
  },
  async updateCustomer(id: string | number, customer: any) {
    return request(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
  },
  async deleteCustomer(id: string | number) {
    return request(`/api/customers/${id}`, { method: 'DELETE' });
  },
  async registerCustomer(customer: any) {
    return request('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
  },
  async loginCustomer(credentials: any) {
    return request('/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
  },
  async getCustomerOrders(phone: string) {
    const data = await request(`/api/customers/orders?phone=${phone}`);
    return (Array.isArray(data) ? data : []).map((order: any) => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));
  },
  async getCustomerProfile(phone: string) {
    return request(`/api/customers/profile?phone=${phone}`);
  },
  async getPwaSettings() {
    return request('/api/settings/pwa');
  },
  async updatePwaSettings(settings: any) {
    return request('/api/settings/pwa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  }
};
