export const api = {
  async getCategories() {
    const res = await fetch('/api/categories');
    return res.json();
  },
  async getProducts() {
    const res = await fetch('/api/products');
    return res.json();
  },
  async getSettings() {
    const res = await fetch('/api/settings');
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
    return res.json();
  },
  async createOrder(order: any) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    return res.json();
  },
  async updateOrderStatus(id: string | number, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  async deleteOrder(id: string | number) {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  async addProduct(product: any) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },
  async updateProduct(id: string | number, product: any) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },
  async deleteProduct(id: string | number) {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  async addCategory(category: any) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    return res.json();
  },
  async updateCategory(id: string | number, category: any) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category)
    });
    return res.json();
  },
  async deleteCategory(id: string | number) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  async getDbConfig() {
    const res = await fetch('/api/db-config');
    return res.json();
  },
  async updateDbConfig(config: any) {
    const res = await fetch('/api/db-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  }
};
