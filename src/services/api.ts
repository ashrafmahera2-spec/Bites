export const api = {
  async getCategories() {
    const res = await fetch('/api/categories');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse categories: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch categories');
    }
    return data;
  },
  async getProducts(branchId?: string | number) {
    const url = branchId ? `/api/products?branchId=${branchId}` : '/api/products';
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse products: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch products');
    }
    return data;
  },
  async updateProductAvailability(branchId: string | number, productId: string | number, isAvailable: boolean) {
    const res = await fetch(`/api/branches/${branchId}/products/${productId}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable })
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse availability update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update availability');
    }
    return data;
  },
  async getSettings() {
    const res = await fetch('/api/settings');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse settings: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch settings');
    }
    return data;
  },
  async updateSettings(settings: any) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse settings update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update settings');
    }
    return data;
  },
  async getOrders(branchId?: string | number) {
    const url = branchId ? `/api/orders?branchId=${branchId}` : '/api/orders';
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse orders: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch orders');
    }
    // Ensure items are parsed if they come as a string (common with some DB drivers)
    return (Array.isArray(data) ? data : []).map((order: any) => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));
  },
  async createOrder(order: any) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse order creation response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create order');
    }
    return data;
  },
  async updateOrderStatus(id: string | number, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse order status update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update order status');
    }
    return data;
  },
  async deleteOrder(id: string | number) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE'
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse order deletion response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete order');
    }
    return data;
  },
  async addProduct(product: any) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse product addition response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add product');
    }
    return data;
  },
  async updateProduct(id: string | number, product: any) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse product update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update product');
    }
    return data;
  },
  async deleteProduct(id: string | number) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse product deletion response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete product');
    }
    return data;
  },
  async addCategory(category: any) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse category addition response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add category');
    }
    return data;
  },
  async updateCategory(id: string | number, category: any) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse category update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update category');
    }
    return data;
  },
  async deleteCategory(id: string | number) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse category deletion response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete category');
    }
    return data;
  },
  async getDbConfig() {
    const res = await fetch('/api/db-config');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse DB config: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch DB config');
    }
    return data;
  },
  async updateDbConfig(config: any) {
    const res = await fetch('/api/db-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse DB config update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update DB config');
    }
    return data;
  },
  async getHealth() {
    const res = await fetch('/api/health');
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { status: 'error', message: 'Failed to parse health check response' };
    }
  },
  async getOffers() {
    const res = await fetch('/api/offers');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse offers: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch offers');
    }
    return data;
  },
  async addOffer(offer: any) {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse offer addition response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add offer');
    }
    return data;
  },
  async updateOffer(id: string | number, offer: any) {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse offer update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update offer');
    }
    return data;
  },
  async deleteOffer(id: string | number) {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'DELETE'
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse offer deletion response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete offer');
    }
    return data;
  },
  async getStaff(branchId?: string | number) {
    const url = branchId ? `/api/staff?branchId=${branchId}` : '/api/staff';
    const res = await fetch(url);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse staff: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch staff');
    }
    return data;
  },
  async addStaff(staff: any) {
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse staff addition response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add staff');
    }
    return data;
  },
  async updateStaff(id: string | number, staff: any) {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse staff update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update staff');
    }
    return data;
  },
  async deleteStaff(id: string | number) {
    const res = await fetch(`/api/staff/${id}`, {
      method: 'DELETE'
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse staff deletion response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete staff');
    }
    return data;
  },
  async getBranches() {
    const res = await fetch('/api/branches');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse branches: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch branches');
    }
    return data;
  },
  async addBranch(branch: any) {
    const res = await fetch('/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse branch addition response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add branch');
    }
    return data;
  },
  async updateBranch(id: string | number, branch: any) {
    const res = await fetch(`/api/branches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse branch update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update branch');
    }
    return data;
  },
  async deleteBranch(id: string | number) {
    const res = await fetch(`/api/branches/${id}`, {
      method: 'DELETE'
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse branch deletion response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete branch');
    }
    return data;
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
    const res = await fetch('/api/errors');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse errors: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch errors');
    }
    return data;
  },
  async clearErrors() {
    const res = await fetch('/api/errors', {
      method: 'DELETE'
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse clear errors response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to clear errors');
    }
    return data;
  },
  async getPwaSettings() {
    const res = await fetch('/api/settings/pwa');
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse PWA settings: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch PWA settings');
    }
    return data;
  },
  async updatePwaSettings(settings: any) {
    const res = await fetch('/api/settings/pwa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Failed to parse PWA settings update response: ' + text.slice(0, 50));
    }
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update PWA settings');
    }
    return data;
  }
};
