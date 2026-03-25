import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import mysql, { Pool } from 'mysql2/promise';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_FILE = path.join(process.cwd(), 'db-config.json');
const JSON_DB_FILE = path.join(process.cwd(), 'local-db.json');

let pool: Pool | null = null;

async function getJsonData() {
  try {
    const data = await fs.readFile(JSON_DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    const initialData = {
      categories: [
        { id: 'burgers', name: 'برجر ع الفحم', order: 1 },
        { id: 'crepes', name: 'كريب حادق', order: 2 },
        { id: 'pizza', name: 'بيتزا إيطالي', order: 3 },
        { id: 'pasta', name: 'مكرونات وباشميل', order: 4 },
        { id: 'appetizers', name: 'مقبلات وسناكس', order: 5 },
        { id: 'drinks', name: 'مشروبات باردة', order: 6 }
      ],
      products: [
        { id: 1, name: 'برجر كلاسيك', price: 85, categoryId: 'burgers', description: 'قطعة برجر 150 جرام، خس، طماطم، بصل، صوص كلاسيك', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', isAvailable: true },
        { id: 2, name: 'كريب زنجر سوبريم', price: 95, categoryId: 'crepes', description: 'قطع دجاج زنجر حار، موتزاريلا، فلفل، زيتون، صوص مايونيز', imageUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500', isAvailable: true }
      ],
      settings: {
        global: {
          whatsappNumber: '201012345678',
          walletNumber: '201012345678',
          deliveryFee: 20,
          paymentMethods: { cash: true, instapay: true, card: false, wallet: true },
          restaurantAddress: 'كفر البطيخ، أمام المسجد الكبير',
          openingHours: {
            start: '10:00',
            end: '23:00',
            isOpen: true
          },
          socialLinks: {
            facebook: '',
            instagram: '',
            tiktok: ''
          }
        }
      },
      offers: [
        { id: 1, title: 'عرض الويك إند', description: 'خصم 20% على جميع أنواع البرجر كل يوم جمعة وسبت', imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', isActive: true }
      ],
      orders: [],
      errors: []
    };
    await fs.writeFile(JSON_DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
}

async function saveJsonData(data: any) {
  await fs.writeFile(JSON_DB_FILE, JSON.stringify(data, null, 2));
}

async function getPool() {
  if (pool) return pool;
  
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    
    pool = mysql.createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test connection and init tables
    await initDB(pool);
    
    return pool;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Database configuration file not found. Please configure database in admin panel.');
    } else {
      console.error('Database connection error:', error);
    }
    return null;
  }
}

async function initDB(p: Pool) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      \`order\` INT DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      categoryId VARCHAR(50),
      description TEXT,
      imageUrl TEXT,
      isAvailable BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(50) PRIMARY KEY,
      value JSON NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customerName VARCHAR(100) NOT NULL,
      customerPhone VARCHAR(20) NOT NULL,
      address TEXT NOT NULL,
      type VARCHAR(20) DEFAULT 'delivery',
      items JSON NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      paymentMethod VARCHAR(50),
      screenshot TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS offers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      imageUrl TEXT,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS errors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message TEXT NOT NULL,
      stack TEXT,
      url TEXT,
      userAgent TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    await p.query(query);
  }
  
  // Seed initial data if empty
  const [rows]: any = await p.query('SELECT COUNT(*) as count FROM categories');
  if (rows[0].count === 0) {
    await p.query(`INSERT INTO categories (id, name, \`order\`) VALUES 
      ('burgers', 'برجر ع الفحم', 1),
      ('crepes', 'كريب حادق', 2),
      ('pizza', 'بيتزا إيطالي', 3),
      ('pasta', 'مكرونات وباشميل', 4),
      ('appetizers', 'مقبلات وسناكس', 5),
      ('drinks', 'مشروبات باردة', 6)
    `);
    
    await p.query(`INSERT INTO products (name, price, categoryId, description, imageUrl) VALUES 
      ('برجر كلاسيك', 85, 'burgers', 'قطعة برجر 150 جرام، خس، طماطم، بصل، صوص كلاسيك', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'),
      ('كريب زنجر سوبريم', 95, 'crepes', 'قطع دجاج زنجر حار، موتزاريلا، فلفل، زيتون، صوص مايونيز', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500')
    `);
    
    await p.query(`INSERT INTO settings (id, value) VALUES ('global', ?)`, [JSON.stringify({
      whatsappNumber: '201012345678',
      walletNumber: '201012345678',
      deliveryFee: 20,
      paymentMethods: { cash: true, instapay: true, card: false, wallet: true },
      restaurantAddress: 'كفر البطيخ، أمام المسجد الكبير',
      openingHours: {
        start: '10:00',
        end: '23:00',
        isOpen: true
      },
      socialLinks: {
        facebook: '',
        instagram: '',
        tiktok: ''
      }
    })]);

    await p.query(`INSERT INTO offers (title, description, imageUrl, isActive) VALUES 
      ('عرض الويك إند', 'خصم 20% على جميع أنواع البرجر كل يوم جمعة وسبت', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', TRUE)
    `);
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', async (req, res) => {
    const p = await getPool();
    res.json({ 
      status: 'ok', 
      dbStatus: p ? 'connected' : 'local-json'
    });
  });

  // DB Config Endpoints
  app.get('/api/db-config', async (req, res) => {
    console.log('GET /api/db-config');
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf-8');
      res.json(JSON.parse(configData));
    } catch (error) {
      res.json({ host: '', user: '', password: '', database: '' });
    }
  });

  app.post('/api/db-config', async (req, res) => {
    try {
      await fs.writeFile(CONFIG_FILE, JSON.stringify(req.body, null, 2));
      pool = null; // Reset pool to reconnect with new config
      const p = await getPool();
      if (p) {
        res.json({ success: true, message: 'Database connected successfully' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to connect with provided credentials' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error saving config' });
    }
  });

  // API Routes
  app.get('/api/categories', async (req, res) => {
    console.log('GET /api/categories');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.categories.sort((a: any, b: any) => a.order - b.order));
    }
    const [rows] = await p.query('SELECT * FROM categories ORDER BY `order`');
    res.json(rows);
  });

  app.get('/api/products', async (req, res) => {
    console.log('GET /api/products');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.products);
    }
    const [rows] = await p.query('SELECT * FROM products');
    res.json(rows);
  });

  app.get('/api/offers', async (req, res) => {
    console.log('GET /api/offers');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.offers || []);
    }
    const [rows] = await p.query('SELECT * FROM offers ORDER BY createdAt DESC');
    res.json(rows);
  });

  app.post('/api/offers', async (req, res) => {
    const p = await getPool();
    const { title, description, imageUrl, isActive } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const newOffer = {
        id: Date.now(),
        title,
        description,
        imageUrl,
        isActive: isActive ?? true,
        createdAt: new Date().toISOString()
      };
      data.offers = [newOffer, ...(data.offers || [])];
      await saveJsonData(data);
      return res.json(newOffer);
    }
    
    const [result]: any = await p.query(
      'INSERT INTO offers (title, description, imageUrl, isActive) VALUES (?, ?, ?, ?)',
      [title, description, imageUrl, isActive ?? true]
    );
    res.json({ id: result.insertId, title, description, imageUrl, isActive: isActive ?? true });
  });

  app.put('/api/offers/:id', async (req, res) => {
    const p = await getPool();
    const { id } = req.params;
    const { title, description, imageUrl, isActive } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const index = data.offers.findIndex((o: any) => o.id == id);
      if (index !== -1) {
        data.offers[index] = { ...data.offers[index], title, description, imageUrl, isActive };
        await saveJsonData(data);
        return res.json(data.offers[index]);
      }
      return res.status(404).json({ error: 'Offer not found' });
    }
    
    await p.query(
      'UPDATE offers SET title = ?, description = ?, imageUrl = ?, isActive = ? WHERE id = ?',
      [title, description, imageUrl, isActive, id]
    );
    res.json({ id, title, description, imageUrl, isActive });
  });

  app.delete('/api/offers/:id', async (req, res) => {
    const p = await getPool();
    const { id } = req.params;
    
    if (!p) {
      const data = await getJsonData();
      data.offers = data.offers.filter((o: any) => o.id != id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    
    await p.query('DELETE FROM offers WHERE id = ?', [id]);
    res.json({ success: true });
  });

  app.post('/api/products', async (req, res) => {
    const p = await getPool();
    const { name, price, categoryId, description, imageUrl, isAvailable } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const newProduct = {
        id: Date.now(),
        name,
        price,
        categoryId,
        description,
        imageUrl,
        isAvailable: isAvailable ?? true
      };
      data.products.push(newProduct);
      await saveJsonData(data);
      return res.json({ success: true, id: newProduct.id });
    }
    
    await p.query(
      'INSERT INTO products (name, price, categoryId, description, imageUrl, isAvailable) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, categoryId, description, imageUrl, isAvailable]
    );
    res.json({ success: true });
  });

  app.put('/api/products/:id', async (req, res) => {
    const p = await getPool();
    const { name, price, categoryId, description, imageUrl, isAvailable } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const index = data.products.findIndex((p: any) => p.id.toString() === req.params.id);
      if (index !== -1) {
        data.products[index] = { ...data.products[index], name, price, categoryId, description, imageUrl, isAvailable };
        await saveJsonData(data);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await p.query(
      'UPDATE products SET name = ?, price = ?, categoryId = ?, description = ?, imageUrl = ?, isAvailable = ? WHERE id = ?',
      [name, price, categoryId, description, imageUrl, isAvailable, req.params.id]
    );
    res.json({ success: true });
  });

  app.delete('/api/products/:id', async (req, res) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.products = data.products.filter((p: any) => p.id.toString() !== req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.post('/api/categories', async (req, res) => {
    const p = await getPool();
    let { id, name, order } = req.body;
    if (!id) id = Date.now().toString();
    
    if (!p) {
      const data = await getJsonData();
      data.categories.push({ id, name, order });
      await saveJsonData(data);
      return res.json({ success: true });
    }
    
    await p.query('INSERT INTO categories (id, name, `order`) VALUES (?, ?, ?)', [id, name, order]);
    res.json({ success: true });
  });

  app.put('/api/categories/:id', async (req, res) => {
    const p = await getPool();
    const { name, order } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const index = data.categories.findIndex((c: any) => c.id === req.params.id);
      if (index !== -1) {
        data.categories[index] = { ...data.categories[index], name, order };
        await saveJsonData(data);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Category not found' });
    }
    
    await p.query('UPDATE categories SET name = ?, `order` = ? WHERE id = ?', [name, order, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/categories/:id', async (req, res) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.categories = data.categories.filter((c: any) => c.id !== req.params.id);
      // Also delete products in this category? (Optional, but let's be safe)
      data.products = data.products.filter((p: any) => p.categoryId !== req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/settings', async (req, res) => {
    console.log('GET /api/settings');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.settings.global || {});
    }
    const [rows]: any = await p.query('SELECT value FROM settings WHERE id = "global"');
    res.json(rows[0]?.value || {});
  });

  app.post('/api/settings', async (req, res) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.settings.global = req.body;
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('UPDATE settings SET value = ? WHERE id = "global"', [JSON.stringify(req.body)]);
    res.json({ success: true });
  });

  app.get('/api/orders', async (req, res) => {
    console.log('GET /api/orders');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
    const [rows] = await p.query('SELECT * FROM orders ORDER BY createdAt DESC');
    res.json(rows);
  });

  app.post('/api/orders', async (req, res) => {
    const p = await getPool();
    const { customerName, customerPhone, address, items, total, paymentMethod, type, screenshot } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const newOrder = {
        id: Date.now(),
        customerName,
        customerPhone,
        address,
        items, // Store as object in JSON
        total,
        paymentMethod,
        type,
        screenshot,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      data.orders.push(newOrder);
      await saveJsonData(data);
      return res.json({ success: true, orderId: newOrder.id });
    }
    
    const [result]: any = await p.query(
      'INSERT INTO orders (customerName, customerPhone, address, items, total, paymentMethod, type, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customerName, customerPhone, address, JSON.stringify(items), total, paymentMethod, type, screenshot]
    );
    res.json({ success: true, orderId: result.insertId });
  });

  app.patch('/api/orders/:id', async (req, res) => {
    const p = await getPool();
    const { status } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const index = data.orders.findIndex((o: any) => o.id.toString() === req.params.id);
      if (index !== -1) {
        data.orders[index].status = status;
        await saveJsonData(data);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Order not found' });
    }
    
    await p.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/orders/:id', async (req, res) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.orders = data.orders.filter((o: any) => o.id.toString() !== req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  // Error Logging
  app.get('/api/errors', async (req, res) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.errors || []);
    }
    const [rows] = await p.query('SELECT * FROM errors ORDER BY createdAt DESC LIMIT 50');
    res.json(rows);
  });

  app.post('/api/errors', async (req, res) => {
    const p = await getPool();
    const { message, stack, url, userAgent } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const newError = {
        id: Date.now(),
        message,
        stack,
        url,
        userAgent,
        createdAt: new Date().toISOString()
      };
      data.errors = [newError, ...(data.errors || [])].slice(0, 50);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    
    await p.query(
      'INSERT INTO errors (message, stack, url, userAgent) VALUES (?, ?, ?, ?)',
      [message, stack, url, userAgent]
    );
    res.json({ success: true });
  });

  app.delete('/api/errors', async (req, res) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.errors = [];
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM errors');
    res.json({ success: true });
  });

  // Auth (Simple mock for now, can be improved)
  app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === '1997') {
      res.json({ success: true, token: 'mock-admin-token' });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
