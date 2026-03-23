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

let pool: Pool | null = null;

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
      restaurantAddress: 'كفر البطيخ، أمام المسجد الكبير'
    })]);
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // DB Config Endpoints
  app.get('/api/db-config', async (req, res) => {
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
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const [rows] = await p.query('SELECT * FROM categories ORDER BY `order`');
    res.json(rows);
  });

  app.get('/api/products', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const [rows] = await p.query('SELECT * FROM products');
    res.json(rows);
  });

  app.post('/api/products', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const { name, price, categoryId, description, imageUrl, isAvailable } = req.body;
    await p.query(
      'INSERT INTO products (name, price, categoryId, description, imageUrl, isAvailable) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, categoryId, description, imageUrl, isAvailable]
    );
    res.json({ success: true });
  });

  app.put('/api/products/:id', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const { name, price, categoryId, description, imageUrl, isAvailable } = req.body;
    await p.query(
      'UPDATE products SET name = ?, price = ?, categoryId = ?, description = ?, imageUrl = ?, isAvailable = ? WHERE id = ?',
      [name, price, categoryId, description, imageUrl, isAvailable, req.params.id]
    );
    res.json({ success: true });
  });

  app.delete('/api/products/:id', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    await p.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.post('/api/categories', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    let { id, name, order } = req.body;
    if (!id) {
      id = Date.now().toString();
    }
    await p.query('INSERT INTO categories (id, name, `order`) VALUES (?, ?, ?)', [id, name, order]);
    res.json({ success: true });
  });

  app.put('/api/categories/:id', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const { name, order } = req.body;
    await p.query('UPDATE categories SET name = ?, `order` = ? WHERE id = ?', [name, order, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/categories/:id', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    await p.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  });

  app.get('/api/settings', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const [rows]: any = await p.query('SELECT value FROM settings WHERE id = "global"');
    res.json(rows[0]?.value || {});
  });

  app.post('/api/settings', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    await p.query('UPDATE settings SET value = ? WHERE id = "global"', [JSON.stringify(req.body)]);
    res.json({ success: true });
  });

  app.get('/api/orders', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const [rows] = await p.query('SELECT * FROM orders ORDER BY createdAt DESC');
    res.json(rows);
  });

  app.post('/api/orders', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const { customerName, customerPhone, address, items, total, paymentMethod, type, screenshot } = req.body;
    const [result]: any = await p.query(
      'INSERT INTO orders (customerName, customerPhone, address, items, total, paymentMethod, type, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customerName, customerPhone, address, JSON.stringify(items), total, paymentMethod, type, screenshot]
    );
    res.json({ success: true, orderId: result.insertId });
  });

  app.patch('/api/orders/:id', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    const { status } = req.body;
    await p.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  });

  app.delete('/api/orders/:id', async (req, res) => {
    const p = await getPool();
    if (!p) return res.status(500).json({ error: 'DB not connected' });
    await p.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
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
