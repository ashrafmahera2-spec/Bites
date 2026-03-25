export const api = {
  async getCategories() {
    const res = await fetch('/api/categories');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch categories');
    }
    return res.json();
  },
  async getProducts() {
    const res = await fetch('/api/products');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch products');
    }
    return res.json();
  },
  async getSettings() {
    const res = await fetch('/api/settings');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch settings');
    }
    return res.json();
  },
  async updateSettings(settings: any) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },
  async getOrders() {
    const res = await fetch('/api/orders');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch orders');
    }
    return res.json();
  },
  async createOrder(order: any) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create order');
    }
    return res.json();
  },
  async updateOrderStatus(id: string | number, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update order status');
    }
    return res.json();
  },
  async deleteOrder(id: string | number) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete order');
    }
    return res.json();
  },
  async addProduct(product: any) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add product');
    }
    return res.json();
  },
  async updateProduct(id: string | number, product: any) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update product');
    }
    return res.json();
  },
  async deleteProduct(id: string | number) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    return res.json();
  },
  async addCategory(category: any) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add category');
    }
    return res.json();
  },
  async updateCategory(id: string | number, category: any) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update category');
    }
    return res.json();
  },
  async deleteCategory(id: string | number) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete category');
    }
    return res.json();
  },
  async getDbConfig() {
    const res = await fetch('/api/db-config');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch DB config');
    }
    return res.json();
  },
  async updateDbConfig(config: any) {
    const res = await fetch('/api/db-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update DB config');
    }
    return res.json();
  },
  async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },
  async getOffers() {
    const res = await fetch('/api/offers');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch offers');
    }
    return res.json();
  },
  async addOffer(offer: any) {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to add offer');
    }
    return res.json();
  },
  async updateOffer(id: string | number, offer: any) {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update offer');
    }
    return res.json();
  },
  async deleteOffer(id: string | number) {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete offer');
    }
    return res.json();
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
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch errors');
    }
    return res.json();
  },
  async clearErrors() {
    const res = await fetch('/api/errors', {
      method: 'DELETE'
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to clear errors');
    }
    return res.json();
  }
};
