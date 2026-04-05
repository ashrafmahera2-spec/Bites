import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import mysql, { Pool } from 'mysql2/promise';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';

const CONFIG_FILE = path.join(process.cwd(), 'db-config.json');
const JSON_DB_FILE = path.join(process.cwd(), 'local-db.json');

let pool: Pool | null = null;

async function getJsonData() {
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
        },
        features: {
          enableCoupons: true,
          enablePoints: true,
          requireLogin: false,
          orderMethod: 'platform', // 'whatsapp' or 'platform'
          menuTheme: 'classic' // 'classic', 'bottom-nav', 'sidebar'
        },
        pointsConfig: {
          pointsPerCurrency: 1,
          currencyPerPoint: 0.1,
          minPointsToRedeem: 100
        }
      }
    },
    offers: [
      { id: 1, title: 'عرض الويك إند', description: 'خصم 20% على جميع أنواع البرجر كل يوم جمعة وسبت', imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', isActive: true }
    ],
    staff: [
      { id: 1, name: 'مدير النظام', username: 'admin', role: 'admin', isActive: true }
    ],
    pwa: {
      name: 'مطعم كفر البطيخ',
      shortName: 'كفر البطيخ',
      description: 'أفضل الوجبات السريعة في كفر البطيخ',
      themeColor: '#f97316',
      backgroundColor: '#ffffff'
    },
    branches: [
      { id: 1, name: 'الفرع الرئيسي', address: 'كفر البطيخ، أمام المسجد الكبير', phone: '201012345678', isActive: true }
    ],
    customers: [],
    coupons: [],
    orders: [],
    errors: []
  };

  try {
    const data = await fs.readFile(JSON_DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Merge with initialData to ensure all fields exist
    return {
      ...initialData,
      ...parsed,
      settings: { ...initialData.settings, ...(parsed.settings || {}) },
      categories: parsed.categories || initialData.categories,
      products: parsed.products || initialData.products,
      offers: parsed.offers || initialData.offers,
      staff: parsed.staff || initialData.staff,
      pwa: parsed.pwa || initialData.pwa,
      branches: parsed.branches || initialData.branches,
      customers: parsed.customers || initialData.customers,
      coupons: parsed.coupons || initialData.coupons,
      orders: parsed.orders || initialData.orders,
      errors: parsed.errors || initialData.errors
    };
  } catch (error) {
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
    `CREATE TABLE IF NOT EXISTS branches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      address TEXT,
      phone VARCHAR(20),
      whatsappNumber VARCHAR(20),
      deliveryFee DECIMAL(10, 2) DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
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
      ingredients TEXT,
      imageUrl TEXT,
      isAvailable BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS branch_product_availability (
      branchId INT NOT NULL,
      productId INT NOT NULL,
      isAvailable BOOLEAN DEFAULT TRUE,
      PRIMARY KEY (branchId, productId),
      FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
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
      branchId INT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL
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
    )`,
    `CREATE TABLE IF NOT EXISTS staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255),
      role VARCHAR(20) DEFAULT 'staff',
      branchId INT,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      type VARCHAR(20) DEFAULT 'percentage',
      value DECIMAL(10, 2) NOT NULL,
      minOrder DECIMAL(10, 2) DEFAULT 0,
      maxDiscount DECIMAL(10, 2),
      expiryDate TIMESTAMP,
      usageLimit INT DEFAULT 0,
      usedCount INT DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) UNIQUE NOT NULL,
      email VARCHAR(100),
      password VARCHAR(255),
      points INT DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    await p.query(query);
  }

  // Migration: Add ingredients column if it doesn't exist
  try {
    const [columns]: any = await p.query('SHOW COLUMNS FROM products LIKE "ingredients"');
    if (columns.length === 0) {
      console.log('Adding ingredients column to products table...');
      await p.query('ALTER TABLE products ADD COLUMN ingredients TEXT AFTER description');
    }
  } catch (error) {
    console.error('Migration error (ingredients):', error);
  }

  // Migration: Add branchId to orders if it doesn't exist
  try {
    const [columns]: any = await p.query('SHOW COLUMNS FROM orders LIKE "branchId"');
    if (columns.length === 0) {
      console.log('Adding branchId column to orders table...');
      await p.query('ALTER TABLE orders ADD COLUMN branchId INT AFTER screenshot');
    }
  } catch (error) {
    console.error('Migration error (branchId in orders):', error);
  }

  // Migration: Add branchId to staff if it doesn't exist
  try {
    const [columns]: any = await p.query('SHOW COLUMNS FROM staff LIKE "branchId"');
    if (columns.length === 0) {
      console.log('Adding branchId column to staff table...');
      await p.query('ALTER TABLE staff ADD COLUMN branchId INT AFTER role');
    }
  } catch (error) {
    console.error('Migration error (branchId in staff):', error);
  }

  // Migration: Add whatsappNumber and deliveryFee to branches if they don't exist
  try {
    const [columns]: any = await p.query('SHOW COLUMNS FROM branches LIKE "whatsappNumber"');
    if (columns.length === 0) {
      console.log('Adding whatsappNumber column to branches table...');
      await p.query('ALTER TABLE branches ADD COLUMN whatsappNumber VARCHAR(20) AFTER phone');
    }
  } catch (error) {
    console.error('Migration error (whatsappNumber in branches):', error);
  }

  try {
    const [columns]: any = await p.query('SHOW COLUMNS FROM branches LIKE "deliveryFee"');
    if (columns.length === 0) {
      console.log('Adding deliveryFee column to branches table...');
      await p.query('ALTER TABLE branches ADD COLUMN deliveryFee DECIMAL(10, 2) DEFAULT 0 AFTER whatsappNumber');
    }
  } catch (error) {
    console.error('Migration error (deliveryFee in branches):', error);
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
      },
      features: {
        enableCoupons: true,
        enablePoints: true,
        requireLogin: false,
        orderMethod: 'platform',
        menuTheme: 'classic'
      },
      pointsConfig: {
        pointsPerCurrency: 1,
        currencyPerPoint: 0.1,
        minPointsToRedeem: 100
      }
    })]);

    await p.query(`INSERT INTO offers (title, description, imageUrl, isActive) VALUES 
      ('عرض الويك إند', 'خصم 20% على جميع أنواع البرجر كل يوم جمعة وسبت', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800', TRUE)
    `);

    const hashedPassword = await bcrypt.hash('1997', 10);
    await p.query(`INSERT INTO staff (name, username, password, role) VALUES ('مدير النظام', 'admin', ?, 'admin')`, [hashedPassword]);
    
    await p.query(`INSERT INTO settings (id, value) VALUES ('pwa', ?)`, [JSON.stringify({
      name: 'مطعم كفر البطيخ',
      shortName: 'كفر البطيخ',
      description: 'أفضل الوجبات السريعة في كفر البطيخ',
      themeColor: '#f97316',
      backgroundColor: '#ffffff'
    })]);
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Global error handler for async routes
  const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

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
  app.get('/api/branches', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.branches || []);
    }
    const [rows] = await p.query('SELECT * FROM branches ORDER BY createdAt DESC');
    res.json(rows);
  }));

  app.post('/api/branches', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { name, address, phone, whatsappNumber, deliveryFee, isActive } = req.body;
    if (!p) {
      const data = await getJsonData();
      const newBranch = { id: Date.now(), name, address, phone, whatsappNumber, deliveryFee: deliveryFee || 0, isActive: isActive ?? true, createdAt: new Date().toISOString() };
      data.branches = [...(data.branches || []), newBranch];
      await saveJsonData(data);
      return res.json(newBranch);
    }
    const [result]: any = await p.query('INSERT INTO branches (name, address, phone, whatsappNumber, deliveryFee, isActive) VALUES (?, ?, ?, ?, ?, ?)', [name, address, phone, whatsappNumber, deliveryFee || 0, isActive ?? true]);
    res.json({ id: result.insertId, name, address, phone, whatsappNumber, deliveryFee: deliveryFee || 0, isActive: isActive ?? true });
  }));

  app.put('/api/branches/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { name, address, phone, whatsappNumber, deliveryFee, isActive } = req.body;
    if (!p) {
      const data = await getJsonData();
      const index = data.branches.findIndex((b: any) => b.id == req.params.id);
      if (index !== -1) {
        data.branches[index] = { ...data.branches[index], name, address, phone, whatsappNumber, deliveryFee, isActive };
        await saveJsonData(data);
        return res.json(data.branches[index]);
      }
      return res.status(404).json({ error: 'Branch not found' });
    }
    await p.query('UPDATE branches SET name = ?, address = ?, phone = ?, whatsappNumber = ?, deliveryFee = ?, isActive = ? WHERE id = ?', [name, address, phone, whatsappNumber, deliveryFee, isActive, req.params.id]);
    res.json({ success: true });
  }));

  app.delete('/api/branches/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.branches = data.branches.filter((b: any) => b.id != req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM branches WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  }));

  app.get('/api/categories', asyncHandler(async (req: any, res: any) => {
    console.log('GET /api/categories');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json((data.categories || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)));
    }
    const [rows] = await p.query('SELECT * FROM categories ORDER BY `order`');
    res.json(rows);
  }));

  app.get('/api/products', asyncHandler(async (req: any, res: any) => {
    const { branchId } = req.query;
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      let products = data.products || [];
      if (branchId) {
        const branchAvail = data.branchProductAvailability || [];
        products = products.map((p: any) => {
          const avail = branchAvail.find((a: any) => a.branchId == branchId && a.productId == p.id);
          return { ...p, isAvailable: avail ? avail.isAvailable : p.isAvailable };
        });
      }
      return res.json(products);
    }
    
    if (branchId) {
      const [rows] = await p.query(`
        SELECT p.*, COALESCE(bpa.isAvailable, p.isAvailable) as isAvailable
        FROM products p
        LEFT JOIN branch_product_availability bpa ON p.id = bpa.productId AND bpa.branchId = ?
      `, [branchId]);
      return res.json(rows);
    }
    
    const [rows] = await p.query('SELECT * FROM products');
    res.json(rows);
  }));

  app.post('/api/branches/:branchId/products/:productId/availability', asyncHandler(async (req: any, res: any) => {
    const { branchId, productId } = req.params;
    const { isAvailable } = req.body;
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.branchProductAvailability = data.branchProductAvailability || [];
      const index = data.branchProductAvailability.findIndex((a: any) => a.branchId == branchId && a.productId == productId);
      if (index !== -1) {
        data.branchProductAvailability[index].isAvailable = isAvailable;
      } else {
        data.branchProductAvailability.push({ branchId: Number(branchId), productId: Number(productId), isAvailable });
      }
      await saveJsonData(data);
      return res.json({ success: true });
    }
    
    await p.query(`
      INSERT INTO branch_product_availability (branchId, productId, isAvailable)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE isAvailable = VALUES(isAvailable)
    `, [branchId, productId, isAvailable]);
    
    res.json({ success: true });
  }));

  app.get('/api/offers', asyncHandler(async (req: any, res: any) => {
    console.log('GET /api/offers');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.offers || []);
    }
    const [rows] = await p.query('SELECT * FROM offers ORDER BY createdAt DESC');
    res.json(rows);
  }));

  app.post('/api/offers', asyncHandler(async (req: any, res: any) => {
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
  }));

  app.put('/api/offers/:id', asyncHandler(async (req: any, res: any) => {
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
  }));

  app.delete('/api/offers/:id', asyncHandler(async (req: any, res: any) => {
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
  }));

  app.post('/api/products', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { name, price, categoryId, description, ingredients, imageUrl, isAvailable } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const newProduct = {
        id: Date.now(),
        name,
        price,
        categoryId,
        description,
        ingredients,
        imageUrl,
        isAvailable: isAvailable ?? true
      };
      data.products.push(newProduct);
      await saveJsonData(data);
      return res.json({ success: true, id: newProduct.id });
    }
    
    await p.query(
      'INSERT INTO products (name, price, categoryId, description, ingredients, imageUrl, isAvailable) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, price, categoryId, description, ingredients, imageUrl, isAvailable]
    );
    res.json({ success: true });
  }));

  app.put('/api/products/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { name, price, categoryId, description, ingredients, imageUrl, isAvailable } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const index = data.products.findIndex((p: any) => p.id.toString() === req.params.id);
      if (index !== -1) {
        data.products[index] = { ...data.products[index], name, price, categoryId, description, ingredients, imageUrl, isAvailable };
        await saveJsonData(data);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await p.query(
      'UPDATE products SET name = ?, price = ?, categoryId = ?, description = ?, ingredients = ?, imageUrl = ?, isAvailable = ? WHERE id = ?',
      [name, price, categoryId, description, ingredients, imageUrl, isAvailable, req.params.id]
    );
    res.json({ success: true });
  }));

  app.delete('/api/products/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.products = data.products.filter((p: any) => p.id.toString() !== req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  }));

  app.post('/api/categories', asyncHandler(async (req: any, res: any) => {
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
  }));

  app.put('/api/categories/:id', asyncHandler(async (req: any, res: any) => {
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
  }));

  app.delete('/api/categories/:id', asyncHandler(async (req: any, res: any) => {
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
  }));

  app.get('/api/settings', asyncHandler(async (req: any, res: any) => {
    console.log('GET /api/settings');
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.settings.global || {});
    }
    const [rows]: any = await p.query('SELECT value FROM settings WHERE id = "global"');
    res.json(rows[0]?.value || {});
  }));

  app.post('/api/settings', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.settings.global = req.body;
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('UPDATE settings SET value = ? WHERE id = "global"', [JSON.stringify(req.body)]);
    res.json({ success: true });
  }));

  app.get('/api/orders', asyncHandler(async (req: any, res: any) => {
    console.log('GET /api/orders');
    const p = await getPool();
    const { branchId } = req.query;
    if (!p) {
      const data = await getJsonData();
      let orders = data.orders || [];
      if (branchId) {
        orders = orders.filter((o: any) => o.branchId == branchId);
      }
      return res.json(orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
    let query = 'SELECT * FROM orders';
    const params = [];
    if (branchId) {
      query += ' WHERE branchId = ?';
      params.push(branchId);
    }
    query += ' ORDER BY createdAt DESC';
    const [rows] = await p.query(query, params);
    res.json(rows);
  }));

  app.post('/api/orders', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { customerName, customerPhone, address, items, total, paymentMethod, type, screenshot, status, branchId, couponCode, pointsUsed, pointsValue } = req.body;
    
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
        branchId,
        couponCode,
        pointsUsed,
        pointsValue,
        status: status || 'pending',
        createdAt: new Date().toISOString()
      };
      data.orders.push(newOrder);

      // Handle Points deduction
      if (pointsUsed > 0 && data.customers) {
        const customerIndex = data.customers.findIndex((c: any) => c.phone === customerPhone);
        if (customerIndex !== -1 && data.customers[customerIndex]) {
          data.customers[customerIndex].points = (data.customers[customerIndex].points || 0) - pointsUsed;
        }
      }

      // Handle Coupon usage
      if (couponCode && data.coupons) {
        const couponIndex = data.coupons.findIndex((c: any) => c.code === couponCode);
        if (couponIndex !== -1 && data.coupons[couponIndex]) {
          data.coupons[couponIndex].usedCount = (data.coupons[couponIndex].usedCount || 0) + 1;
        }
      }

      await saveJsonData(data);
      return res.json(newOrder);
    }
    
    // Start transaction for SQL
    const connection = await p.getConnection();
    try {
      await connection.beginTransaction();

      const [result]: any = await connection.query(
        'INSERT INTO orders (customerName, customerPhone, address, items, total, paymentMethod, type, screenshot, status, branchId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [customerName, customerPhone, address, JSON.stringify(items), total, paymentMethod, type, screenshot, status || 'pending', branchId]
      );

      // Handle Points deduction
      if (pointsUsed > 0) {
        await connection.query('UPDATE customers SET points = points - ? WHERE phone = ?', [pointsUsed, customerPhone]);
      }

      // Handle Coupon usage
      if (couponCode) {
        await connection.query('UPDATE coupons SET usedCount = usedCount + 1 WHERE code = ?', [couponCode]);
      }

      await connection.commit();
      
      const [rows]: any = await connection.query('SELECT * FROM orders WHERE id = ?', [result.insertId]);
      res.json(rows[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }));

  app.patch('/api/orders/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { status } = req.body;
    
    if (!p) {
      const data = await getJsonData();
      const index = data.orders.findIndex((o: any) => o.id.toString() === req.params.id);
      if (index !== -1) {
        const oldStatus = data.orders[index].status;
        data.orders[index].status = status;

        // Handle points earning on delivery/completion
        if ((status === 'delivered' || status === 'completed') && oldStatus !== 'delivered' && oldStatus !== 'completed') {
          const order = data.orders[index];
          const settings = data.settings.global;
          if (settings?.features?.enablePoints && settings?.pointsConfig?.pointsPerCurrency) {
            const pointsToEarn = Math.floor(order.total * settings.pointsConfig.pointsPerCurrency);
            if (data.customers) {
              const customerIndex = data.customers.findIndex((c: any) => c.phone === order.customerPhone);
              if (customerIndex !== -1 && data.customers[customerIndex]) {
                data.customers[customerIndex].points = (data.customers[customerIndex].points || 0) + pointsToEarn;
              }
            }
          }
        }

        await saveJsonData(data);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // SQL Transaction for status update and points earning
    const connection = await p.getConnection();
    try {
      await connection.beginTransaction();

      const [orderRows]: any = await connection.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
      const order = orderRows[0];

      if (order) {
        const oldStatus = order.status;
        await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);

        if ((status === 'delivered' || status === 'completed') && oldStatus !== 'delivered' && oldStatus !== 'completed') {
          const [settingsRows]: any = await connection.query('SELECT value FROM settings WHERE id = "global"');
          const settings = settingsRows[0]?.value;
          
          if (settings?.features?.enablePoints && settings?.pointsConfig?.pointsPerCurrency) {
            const pointsToEarn = Math.floor(order.total * settings.pointsConfig.pointsPerCurrency);
            await connection.query('UPDATE customers SET points = points + ? WHERE phone = ?', [pointsToEarn, order.customerPhone]);
          }
        }
      }

      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }));

  app.delete('/api/orders/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.orders = data.orders.filter((o: any) => o.id.toString() !== req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  }));

  // Error Logging
  app.get('/api/errors', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.errors || []);
    }
    const [rows] = await p.query('SELECT * FROM errors ORDER BY createdAt DESC LIMIT 50');
    res.json(rows);
  }));

  app.post('/api/errors', asyncHandler(async (req: any, res: any) => {
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
  }));

  app.delete('/api/errors', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.errors = [];
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM errors');
    res.json({ success: true });
  }));

  // Coupons API
  app.get('/api/coupons', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.coupons || []);
    }
    const [rows] = await p.query('SELECT * FROM coupons ORDER BY createdAt DESC');
    res.json(rows);
  }));

  app.post('/api/coupons', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, isActive } = req.body;
    if (!p) {
      const data = await getJsonData();
      const newCoupon = { id: Date.now(), code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, usedCount: 0, isActive: isActive ?? true, createdAt: new Date().toISOString() };
      data.coupons = [...(data.coupons || []), newCoupon];
      await saveJsonData(data);
      return res.json(newCoupon);
    }
    const [result]: any = await p.query('INSERT INTO coupons (code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, isActive ?? true]);
    res.json({ id: result.insertId, code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, usedCount: 0, isActive: isActive ?? true });
  }));

  app.put('/api/coupons/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, isActive } = req.body;
    if (!p) {
      const data = await getJsonData();
      const index = data.coupons.findIndex((c: any) => c.id == req.params.id);
      if (index !== -1) {
        data.coupons[index] = { ...data.coupons[index], code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, isActive };
        await saveJsonData(data);
        return res.json(data.coupons[index]);
      }
      return res.status(404).json({ error: 'Coupon not found' });
    }
    await p.query('UPDATE coupons SET code = ?, type = ?, value = ?, minOrder = ?, maxDiscount = ?, expiryDate = ?, usageLimit = ?, isActive = ? WHERE id = ?', [code, type, value, minOrder, maxDiscount, expiryDate, usageLimit, isActive, req.params.id]);
    res.json({ success: true });
  }));

  app.delete('/api/coupons/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.coupons = data.coupons.filter((c: any) => c.id != req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  }));

  app.get('/api/coupons/validate/:code', asyncHandler(async (req: any, res: any) => {
    const { code } = req.params;
    const p = await getPool();
    let coupon;
    if (!p) {
      const data = await getJsonData();
      coupon = (data.coupons || []).find((c: any) => c.code === code && c.isActive);
    } else {
      const [rows]: any = await p.query('SELECT * FROM coupons WHERE code = ? AND isActive = TRUE', [code]);
      coupon = rows[0];
    }

    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
    
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ error: 'Coupon has expired' });
    }
    
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    res.json(coupon);
  }));

  // Customers API
  app.get('/api/customers', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.customers || []);
    }
    const [rows] = await p.query('SELECT id, name, phone, email, points, isActive, createdAt FROM customers');
    res.json(rows);
  }));

  app.put('/api/customers/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { name, phone, email, points, isActive } = req.body;
    if (!p) {
      const data = await getJsonData();
      const index = data.customers.findIndex((c: any) => c.id == req.params.id);
      if (index !== -1) {
        data.customers[index] = { ...data.customers[index], name, phone, email, points, isActive };
        await saveJsonData(data);
        return res.json(data.customers[index]);
      }
      return res.status(404).json({ error: 'Customer not found' });
    }
    await p.query('UPDATE customers SET name = ?, phone = ?, email = ?, points = ?, isActive = ? WHERE id = ?', [name, phone, email, points, isActive, req.params.id]);
    res.json({ success: true });
  }));

  app.delete('/api/customers/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.customers = data.customers.filter((c: any) => c.id != req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  }));

  app.post('/api/customers/register', asyncHandler(async (req: any, res: any) => {
    const { name, phone, email, password } = req.body;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      if (data.customers?.find((c: any) => c.phone === phone)) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
      const newCustomer = { id: Date.now(), name, phone, email, password: hashedPassword, points: 0, isActive: true, createdAt: new Date().toISOString() };
      data.customers = [...(data.customers || []), newCustomer];
      await saveJsonData(data);
      const { password: _, ...customerWithoutPassword } = newCustomer;
      return res.json(customerWithoutPassword);
    }
    try {
      const [result]: any = await p.query('INSERT INTO customers (name, phone, email, password) VALUES (?, ?, ?, ?)', [name, phone, email, hashedPassword]);
      res.json({ id: result.insertId, name, phone, email, points: 0, isActive: true });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Phone number already registered' });
      throw error;
    }
  }));

  app.post('/api/customers/login', asyncHandler(async (req: any, res: any) => {
    const { phone, password } = req.body;
    const p = await getPool();
    let customer;
    if (!p) {
      const data = await getJsonData();
      customer = data.customers?.find((c: any) => c.phone === phone);
    } else {
      const [rows]: any = await p.query('SELECT * FROM customers WHERE phone = ?', [phone]);
      customer = rows[0];
    }

    if (!customer || !customer.isActive) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (customer.password) {
      const match = await bcrypt.compare(password, customer.password);
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...customerWithoutPassword } = customer;
    res.json({ token: 'mock-customer-token-' + customer.id, user: customerWithoutPassword });
  }));

  app.get('/api/customers/orders', asyncHandler(async (req: any, res: any) => {
    const { phone } = req.query;
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      const orders = (data.orders || []).filter((o: any) => o.customerPhone === phone);
      return res.json(orders);
    }
    const [rows]: any = await p.query('SELECT * FROM orders WHERE customerPhone = ? ORDER BY createdAt DESC', [phone]);
    res.json(rows);
  }));

  app.get('/api/customers/profile', asyncHandler(async (req: any, res: any) => {
    const { phone } = req.query;
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      const customer = (data.customers || []).find((c: any) => c.phone === phone);
      if (customer) {
        const { password: _, ...customerWithoutPassword } = customer;
        return res.json(customerWithoutPassword);
      }
      return res.status(404).json({ error: 'Customer not found' });
    }
    const [rows]: any = await p.query('SELECT id, name, phone, email, points, isActive, createdAt FROM customers WHERE phone = ?', [phone]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  }));

  // Staff API
  app.get('/api/staff', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { branchId } = req.query;
    if (!p) {
      const data = await getJsonData();
      let staff = data.staff || [];
      if (branchId) {
        staff = staff.filter((s: any) => s.branchId == branchId);
      }
      return res.json(staff);
    }
    let query = 'SELECT id, name, username, role, branchId, isActive, createdAt FROM staff';
    const params = [];
    if (branchId) {
      query += ' WHERE branchId = ?';
      params.push(branchId);
    }
    const [rows] = await p.query(query, params);
    res.json(rows);
  }));

  app.post('/api/staff', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { name, username, password, role, isActive, branchId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!p) {
      const data = await getJsonData();
      const newStaff = { id: Date.now(), name, username, password: hashedPassword, role, branchId, isActive: isActive ?? true, createdAt: new Date().toISOString() };
      data.staff = [...(data.staff || []), newStaff];
      await saveJsonData(data);
      return res.json(newStaff);
    }
    await p.query('INSERT INTO staff (name, username, password, role, isActive, branchId) VALUES (?, ?, ?, ?, ?, ?)', [name, username, hashedPassword, role, isActive ?? true, branchId]);
    res.json({ success: true });
  }));

  app.put('/api/staff/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    const { name, username, password, role, isActive, branchId } = req.body;
    if (!p) {
      const data = await getJsonData();
      const index = data.staff.findIndex((s: any) => s.id == req.params.id);
      if (index !== -1) {
        const updatedStaff = { ...data.staff[index], name, username, role, isActive, branchId };
        if (password) {
          updatedStaff.password = await bcrypt.hash(password, 10);
        }
        data.staff[index] = updatedStaff;
        await saveJsonData(data);
        return res.json(data.staff[index]);
      }
      return res.status(404).json({ error: 'Staff not found' });
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await p.query('UPDATE staff SET name = ?, username = ?, password = ?, role = ?, isActive = ?, branchId = ? WHERE id = ?', [name, username, hashedPassword, role, isActive, branchId, req.params.id]);
    } else {
      await p.query('UPDATE staff SET name = ?, username = ?, role = ?, isActive = ?, branchId = ? WHERE id = ?', [name, username, role, isActive, branchId, req.params.id]);
    }
    res.json({ success: true });
  }));

  app.delete('/api/staff/:id', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.staff = data.staff.filter((s: any) => s.id != req.params.id);
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('DELETE FROM staff WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  }));

  // PWA Settings API
  app.get('/api/settings/pwa', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      return res.json(data.pwa || {});
    }
    const [rows]: any = await p.query('SELECT value FROM settings WHERE id = "pwa"');
    res.json(rows[0]?.value || {});
  }));

  app.post('/api/settings/pwa', asyncHandler(async (req: any, res: any) => {
    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      data.pwa = req.body;
      await saveJsonData(data);
      return res.json({ success: true });
    }
    await p.query('INSERT INTO settings (id, value) ON DUPLICATE KEY UPDATE value = ?', [JSON.stringify(req.body)]);
    res.json({ success: true });
  }));

  // Auth (Modified to check staff table)
  app.post('/api/login', asyncHandler(async (req: any, res: any) => {
    const { username, password } = req.body;
    
    // Fallback for old login style if only password provided
    if (!username && password === '1997') {
      return res.json({ success: true, token: 'mock-admin-token', user: { name: 'Admin', role: 'admin' } });
    }

    const p = await getPool();
    if (!p) {
      const data = await getJsonData();
      const user = (data.staff || []).find((s: any) => s.username === username && s.isActive);
      
      if (user) {
        // In JSON mode we check password using bcrypt if hashed, or plain if not (for migration)
        const isMatch = user.password?.startsWith('$2b$') 
          ? await bcrypt.compare(password, user.password)
          : (password === '1997' || password === 'admin');
          
        if (isMatch) {
          return res.json({ success: true, token: 'mock-token-' + user.id, user: { name: user.name, role: user.role, branchId: user.branchId } });
        }
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const [rows]: any = await p.query('SELECT * FROM staff WHERE username = ? AND isActive = TRUE', [username]);
    if (rows.length > 0) {
      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return res.json({ success: true, token: 'mock-token-' + user.id, user: { name: user.name, role: user.role, branchId: user.branchId } });
      }
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }));

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
