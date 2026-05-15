<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$CONFIG_FILE = __DIR__ . '/../db-config.json';

function get_db_connection() {
    global $CONFIG_FILE;
    if (!file_exists($CONFIG_FILE)) {
        return null;
    }

    $config = json_decode(file_get_contents($CONFIG_FILE), true);
    if (!$config) return null;

    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, $config['user'], $config['password'], $options);
        init_db($pdo);
        return $pdo;
    } catch (\PDOException $e) {
        return null;
    }
}

function init_db($pdo) {
    $queries = [
        "CREATE TABLE IF NOT EXISTS categories (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            `order` INT DEFAULT 0,
            image TEXT,
            printerName VARCHAR(100) DEFAULT NULL,
            isActive BOOLEAN DEFAULT TRUE
        )",
        "CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            categoryId VARCHAR(50),
            description TEXT,
            imageUrl TEXT,
            isAvailable BOOLEAN DEFAULT TRUE,
            ingredients TEXT,
            sizes JSON DEFAULT NULL
        )",
        "CREATE TABLE IF NOT EXISTS branch_availability (
            branchId INT,
            productId INT,
            isAvailable BOOLEAN,
            PRIMARY KEY (branchId, productId)
        )",
        "CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(50) PRIMARY KEY,
            value JSON NOT NULL
        )",
        "CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customerName VARCHAR(100) NOT NULL,
            customerPhone VARCHAR(20) NOT NULL,
            address TEXT NOT NULL,
            type VARCHAR(20) DEFAULT 'delivery',
            items JSON NOT NULL,
            subtotal DECIMAL(10, 2) DEFAULT 0,
            discount DECIMAL(10, 2) DEFAULT 0,
            taxAmount DECIMAL(10, 2) DEFAULT 0,
            serviceChargeAmount DECIMAL(10, 2) DEFAULT 0,
            deliveryFee DECIMAL(10, 2) DEFAULT 0,
            couponCode VARCHAR(50),
            pointsUsed INT DEFAULT 0,
            pointsValue DECIMAL(10, 2) DEFAULT 0,
            total DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            paymentMethod VARCHAR(50),
            screenshot TEXT,
            branchId INT,
            deliveryBoyId INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS branches (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            whatsappNumber VARCHAR(20),
            deliveryFee DECIMAL(10, 2) DEFAULT 0,
            address TEXT,
            isActive BOOLEAN DEFAULT TRUE
        )",
        "CREATE TABLE IF NOT EXISTS staff (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL,
            permissions JSON,
            branchId INT,
            isActive BOOLEAN DEFAULT TRUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS coupons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            type VARCHAR(20) NOT NULL,
            value DECIMAL(10, 2) NOT NULL,
            minOrder DECIMAL(10, 2) DEFAULT 0,
            maxDiscount DECIMAL(10, 2),
            expiryDate DATETIME,
            usageLimit INT,
            usedCount INT DEFAULT 0,
            isActive BOOLEAN DEFAULT TRUE
        )",
        "CREATE TABLE IF NOT EXISTS customers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255),
            address TEXT,
            points INT DEFAULT 0,
            isActive BOOLEAN DEFAULT TRUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS offers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            imageUrl TEXT,
            products JSON,
            price DECIMAL(10, 2) DEFAULT 0,
            isActive BOOLEAN DEFAULT TRUE
        )",
        "CREATE TABLE IF NOT EXISTS tables (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            capacity INT DEFAULT 2,
            status VARCHAR(20) DEFAULT 'available',
            branchId INT,
            qrCode TEXT,
            isActive BOOLEAN DEFAULT TRUE
        )",
        "CREATE TABLE IF NOT EXISTS printer_settings (
            id VARCHAR(50) PRIMARY KEY,
            value JSON NOT NULL
        )",
        "CREATE TABLE IF NOT EXISTS errors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message TEXT,
            stack TEXT,
            url TEXT,
            browser TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($queries as $query) {
        $pdo->exec($query);
    }

    // Migration logic for existing tables in PHP
    try {
        $pdo->exec("ALTER TABLE categories ADD COLUMN image TEXT AFTER `order` ");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE categories ADD COLUMN printerName VARCHAR(100) DEFAULT NULL AFTER image");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE categories ADD COLUMN isActive BOOLEAN DEFAULT TRUE AFTER printerName");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE staff ADD COLUMN permissions JSON AFTER role");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE products ADD COLUMN ingredients TEXT AFTER description");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE products ADD COLUMN sizes JSON DEFAULT NULL AFTER ingredients");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE offers ADD COLUMN products JSON AFTER imageUrl");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE offers ADD COLUMN price DECIMAL(10, 2) DEFAULT 0 AFTER products");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) DEFAULT 0 AFTER items");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0 AFTER subtotal");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN taxAmount DECIMAL(10, 2) DEFAULT 0 AFTER discount");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN serviceChargeAmount DECIMAL(10, 2) DEFAULT 0 AFTER taxAmount");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN deliveryFee DECIMAL(10, 2) DEFAULT 0 AFTER serviceChargeAmount");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN couponCode VARCHAR(50) AFTER deliveryFee");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN pointsUsed INT DEFAULT 0 AFTER couponCode");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN pointsValue DECIMAL(10, 2) DEFAULT 0 AFTER pointsUsed");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN branchId INT AFTER screenshot");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN deliveryBoyId INT AFTER branchId");
    } catch (Exception $e) {}
    try {
        $pdo->exec("ALTER TABLE orders ADD COLUMN tableId INT AFTER deliveryBoyId");
    } catch (Exception $e) {}

    // Seed initial data if empty
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $pdo->exec("INSERT INTO categories (id, name, `order`) VALUES 
            ('burgers', 'برجر ع الفحم', 1),
            ('crepes', 'كريب حادق', 2),
            ('pizza', 'بيتزا إيطالي', 3)
        ");
        
        $pdo->exec("INSERT INTO products (name, price, categoryId, description, imageUrl) VALUES 
            ('برجر كلاسيك', 85, 'burgers', 'قطعة برجر 150 جرام، خس، طماطم، بصل، صوص كلاسيك', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500')
        ");
        
        $settings = [
            'restaurantName' => "Bite's Menu",
            'whatsappNumber' => '201012345678',
            'walletNumber' => '201012345678',
            'deliveryFee' => 20,
            'paymentMethods' => ['cash' => true, 'instapay' => true, 'card' => false, 'wallet' => true],
            'restaurantAddress' => 'كفر البطيخ',
            'features' => [
                'enableCoupons' => true,
                'enablePoints' => true,
                'requireLogin' => false,
                'orderMethod' => 'whatsapp',
                'menuTheme' => 'classic'
            ],
            'pointsConfig' => [
                'pointsPerCurrency' => 1,
                'currencyPerPoint' => 0.05,
                'minPointsToRedeem' => 100
            ],
            'taxConfig' => [
                'enableTax' => false,
                'taxRate' => 0,
                'enableServiceCharge' => false,
                'serviceChargeRate' => 0
            ]
        ];
        $stmt = $pdo->prepare("INSERT INTO settings (id, value) VALUES ('global', ?)");
        $stmt->execute([json_encode($settings)]);

        // Add default admin staff
        $passwordHash = password_hash('1997', PASSWORD_DEFAULT);
        $pdo->exec("INSERT INTO staff (name, username, password, role) VALUES ('Admin', 'admin', '$passwordHash', 'admin')");
    }
}

$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';
$path = str_replace($base_path, '', $request_uri);
$path = explode('?', $path)[0];
$method = $_SERVER['REQUEST_METHOD'];

$pdo = get_db_connection();

// API Routes
if ($path === '/health') {
    echo json_encode(['status' => 'ok', 'dbStatus' => 'connected']);
    exit();
}
if ($path === '/db-config') {
    if ($method === 'GET') {
        if (file_exists($CONFIG_FILE)) {
            $config = json_decode(file_get_contents($CONFIG_FILE), true);
            unset($config['password']); // Don't send password
            echo json_encode($config);
        } else {
            echo json_encode(['host' => '', 'user' => '', 'database' => '']);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        file_put_contents($CONFIG_FILE, json_encode($data, JSON_PRETTY_PRINT));
        $pdo = get_db_connection();
        if ($pdo) {
            echo json_encode(['success' => true, 'message' => 'Database connected successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to connect']);
        }
    }
    exit();
}

if ($path === '/login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$pdo) {
        // Fallback for initial setup if DB is not connected
        if ($data['username'] === 'admin' && $data['password'] === '1997') {
            echo json_encode([
                'success' => true, 
                'token' => 'master-session-' . bin2hex(random_bytes(16)), 
                'user' => ['id' => 0, 'name' => 'Master Admin', 'username' => 'admin', 'role' => 'admin']
            ]);
        } else {
            http_response_code(503);
            echo json_encode(['success' => false, 'message' => 'Database not connected. Please use master credentials for setup.']);
        }
        exit();
    }

    $stmt = $pdo->prepare("SELECT * FROM staff WHERE username = ? AND isActive = 1");
    $stmt->execute([$data['username']]);
    $user = $stmt->fetch();
    if ($user && password_verify($data['password'], $user['password'])) {
        unset($user['password']);
        echo json_encode(['success' => true, 'token' => 'php-session-' . bin2hex(random_bytes(16)), 'user' => $user]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
    exit();
}

if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'DB not connected']);
    exit();
}

// REST API logic
if ($path === '/categories') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY `order` ASC");
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? (string)round(microtime(true) * 1000);
        $stmt = $pdo->prepare("INSERT INTO categories (id, name, `order`) VALUES (?, ?, ?)");
        $stmt->execute([$id, $data['name'], (int)$data['order']]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/categories\/(.+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE categories SET name = ?, `order` = ? WHERE id = ?");
        $stmt->execute([$data['name'], (int)$data['order'], $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/products') {
    if ($method === 'GET') {
        $branchId = $_GET['branchId'] ?? null;
        if ($branchId) {
            $stmt = $pdo->prepare("
                SELECT p.*, COALESCE(ba.isAvailable, p.isAvailable) as isAvailable 
                FROM products p 
                LEFT JOIN branch_availability ba ON p.id = ba.productId AND ba.branchId = ?
            ");
            $stmt->execute([$branchId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM products");
        }
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO products (name, price, categoryId, description, imageUrl, isAvailable, ingredients, sizes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['price'], $data['categoryId'], $data['description'], $data['imageUrl'], $data['isAvailable'] ? 1 : 0, $data['ingredients'] ?? '', json_encode($data['sizes'] ?? null)]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/products\/(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE products SET name = ?, price = ?, categoryId = ?, description = ?, imageUrl = ?, isAvailable = ?, ingredients = ?, sizes = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['price'], $data['categoryId'], $data['description'], $data['imageUrl'], $data['isAvailable'] ? 1 : 0, $data['ingredients'] ?? '', json_encode($data['sizes'] ?? null), $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/branches\/(\d+)\/products\/(\d+)\/availability$/', $path, $matches)) {
    $branchId = $matches[1];
    $productId = $matches[2];
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO branch_availability (branchId, productId, isAvailable) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE isAvailable = VALUES(isAvailable)");
        $stmt->execute([$branchId, $productId, $data['isAvailable'] ? 1 : 0]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/settings') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT value FROM settings WHERE id = 'global'");
        $row = $stmt->fetch();
        echo $row ? $row['value'] : json_encode([]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO settings (id, value) VALUES ('global', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)");
        $stmt->execute([json_encode($data)]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/settings/pwa') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT value FROM settings WHERE id = 'pwa'");
        $row = $stmt->fetch();
        echo $row ? $row['value'] : json_encode([]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $pdo->prepare("INSERT INTO settings (id, value) VALUES ('pwa', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)")->execute([json_encode($data)]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/orders') {
    if ($method === 'GET') {
        $branchId = $_GET['branchId'] ?? null;
        if ($branchId) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE branchId = ? ORDER BY createdAt DESC");
            $stmt->execute([$branchId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
        }
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO orders (customerName, customerPhone, address, items, subtotal, discount, taxAmount, serviceChargeAmount, deliveryFee, couponCode, pointsUsed, pointsValue, total, paymentMethod, type, screenshot, branchId, tableId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['customerName'], 
            $data['customerPhone'], 
            $data['address'], 
            json_encode($data['items']), 
            $data['subtotal'] ?? $data['total'],
            $data['discount'] ?? 0,
            $data['taxAmount'] ?? 0,
            $data['serviceChargeAmount'] ?? 0,
            $data['deliveryFee'] ?? 0,
            $data['couponCode'] ?? null,
            $data['pointsUsed'] ?? 0,
            $data['pointsValue'] ?? 0,
            $data['total'], 
            $data['paymentMethod'], 
            $data['type'], 
            $data['screenshot'] ?? null,
            $data['branchId'] ?? null,
            $data['tableId'] ?? null,
            $data['status'] ?? 'pending'
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
} elseif (preg_match('/^\/orders\/(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PATCH') {
        $data = json_decode(file_get_contents('php://input'), true);
        $sql = "UPDATE orders SET status = ?" . (isset($data['deliveryBoyId']) ? ", deliveryBoyId = ?" : "") . " WHERE id = ?";
        $params = [$data['status']];
        if (isset($data['deliveryBoyId'])) $params[] = $data['deliveryBoyId'];
        $params[] = $id;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/orders\/(\d+)\/assign-delivery$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE orders SET deliveryBoyId = ? WHERE id = ?");
        $stmt->execute([$data['deliveryBoyId'], $id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/branches') {
    if ($method === 'GET') {
        echo json_encode($pdo->query("SELECT * FROM branches")->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO branches (name, phone, whatsappNumber, deliveryFee, address, isActive) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['phone'], $data['whatsappNumber'], $data['deliveryFee'], $data['address'], $data['isActive'] ? 1 : 0]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/coupons') {
    if ($method === 'GET') {
        echo json_encode($pdo->query("SELECT * FROM coupons")->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO coupons (code, type, value, minOrder, maxDiscount, expiryDate, usageLimit) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['code'], $data['type'], $data['value'], $data['minOrder'], $data['maxDiscount'], $data['expiryDate'], $data['usageLimit']]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/coupons\/validate\/(.+)$/', $path, $matches)) {
    $code = $matches[1];
    $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND isActive = 1 AND (expiryDate IS NULL OR expiryDate > NOW())");
    $stmt->execute([$code]);
    $coupon = $stmt->fetch();
    if ($coupon) {
        if ($coupon['usageLimit'] && $coupon['usedCount'] >= $coupon['usageLimit']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Coupon usage limit reached']);
        } else {
            echo json_encode($coupon);
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired coupon']);
    }
} elseif ($path === '/customers/register') {
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $stmt = $pdo->prepare("INSERT INTO customers (name, phone, password, address) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['phone'], password_hash($data['password'], PASSWORD_DEFAULT), $data['address'] ?? '']);
        
        $userId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT id, name, phone, address, points, isActive, createdAt FROM customers WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        echo json_encode([
            'success' => true, 
            'token' => 'cust-session-' . bin2hex(random_bytes(16)), 
            'user' => $user
        ]);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
    }
} elseif ($path === '/customers/login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("SELECT * FROM customers WHERE phone = ? AND isActive = 1");
    $stmt->execute([$data['phone']]);
    $user = $stmt->fetch();
    if ($user && password_verify($data['password'], $user['password'])) {
        unset($user['password']);
        echo json_encode(['success' => true, 'token' => 'cust-session-' . bin2hex(random_bytes(16)), 'user' => $user]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
} elseif ($path === '/staff') {
    if ($method === 'GET') {
        echo json_encode($pdo->query("SELECT id, name, username, role, branchId, isActive, createdAt FROM staff")->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO staff (name, username, password, role, branchId) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['username'], password_hash($data['password'], PASSWORD_DEFAULT), $data['role'], $data['branchId']]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/offers') {
    if ($method === 'GET') {
        echo json_encode($pdo->query("SELECT * FROM offers")->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO offers (title, description, imageUrl, products, price, isActive) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['title'], $data['description'], $data['imageUrl'], json_encode($data['products'] ?? []), $data['price'] ?? 0, $data['isActive'] ? 1 : 0]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/offers\/(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE offers SET title = ?, description = ?, imageUrl = ?, products = ?, price = ?, isActive = ? WHERE id = ?");
        $stmt->execute([$data['title'], $data['description'], $data['imageUrl'], json_encode($data['products'] ?? []), $data['price'] ?? 0, $data['isActive'] ? 1 : 0, $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM offers WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/tables') {
    if ($method === 'GET') {
        $branchId = $_GET['branchId'] ?? null;
        if ($branchId) {
            $stmt = $pdo->prepare("SELECT * FROM tables WHERE branchId = ? AND isActive = 1");
            $stmt->execute([$branchId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM tables WHERE isActive = 1");
        }
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO tables (name, capacity, status, branchId, isActive) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['capacity'], $data['status'] ?? 'available', $data['branchId'], $data['isActive'] ? 1 : 0]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/tables\/(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE tables SET name = ?, capacity = ?, status = ?, branchId = ?, isActive = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['capacity'], $data['status'], $data['branchId'], $data['isActive'] ? 1 : 0, $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("UPDATE tables SET isActive = 0 WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/printer-settings') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT value FROM printer_settings WHERE id = 'config'");
        $row = $stmt->fetch();
        echo $row ? $row['value'] : json_encode([]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $pdo->prepare("INSERT INTO printer_settings (id, value) VALUES ('config', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)")->execute([json_encode($data)]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/customers') {
    if ($method === 'GET') {
        echo json_encode($pdo->query("SELECT id, name, phone, address, points, isActive, createdAt FROM customers")->fetchAll());
    }
} elseif (preg_match('/^\/customers\/(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, address = ?, points = ?, isActive = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['phone'], $data['address'], (int)$data['points'], $data['isActive'] ? 1 : 0, $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/customers/profile') {
    if ($method === 'GET') {
        $phone = $_GET['phone'] ?? '';
        $id = $_GET['id'] ?? '';
        
        if ($id) {
            $stmt = $pdo->prepare("SELECT id, name, phone, address, points, isActive, createdAt FROM customers WHERE id = ?");
            $stmt->execute([$id]);
        } else {
            $stmt = $pdo->prepare("SELECT id, name, phone, address, points, isActive, createdAt FROM customers WHERE phone = ?");
            $stmt->execute([$phone]);
        }
        
        $user = $stmt->fetch();
        if ($user) {
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Customer not found']);
        }
    }
} elseif ($path === '/customers/orders') {
    if ($method === 'GET') {
        $phone = $_GET['phone'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE customerPhone = ? ORDER BY createdAt DESC");
        $stmt->execute([$phone]);
        echo json_encode($stmt->fetchAll());
    }
} elseif ($path === '/errors') {
    if ($method === 'GET') {
        echo json_encode($pdo->query("SELECT * FROM errors ORDER BY timestamp DESC")->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO errors (message, stack, url, browser) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['message'], $data['stack'], $data['url'], $data['userAgent']]);
        echo json_encode(['success' => true]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found', 'path' => $path]);
}
