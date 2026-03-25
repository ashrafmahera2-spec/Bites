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
            `order` INT DEFAULT 0
        )",
        "CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            categoryId VARCHAR(50),
            description TEXT,
            imageUrl TEXT,
            isAvailable BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
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
            total DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            paymentMethod VARCHAR(50),
            screenshot TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($queries as $query) {
        $pdo->exec($query);
    }

    // Seed initial data if empty
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM categories");
    $row = $stmt->fetch();
    if ($row['count'] == 0) {
        $pdo->exec("INSERT INTO categories (id, name, `order`) VALUES 
            ('burgers', 'برجر ع الفحم', 1),
            ('crepes', 'كريب حادق', 2),
            ('pizza', 'بيتزا إيطالي', 3),
            ('pasta', 'مكرونات وباشميل', 4),
            ('appetizers', 'مقبلات وسناكس', 5),
            ('drinks', 'مشروبات باردة', 6)
        ");
        
        $pdo->exec("INSERT INTO products (name, price, categoryId, description, imageUrl) VALUES 
            ('برجر كلاسيك', 85, 'burgers', 'قطعة برجر 150 جرام، خس، طماطم، بصل، صوص كلاسيك', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'),
            ('كريب زنجر سوبريم', 95, 'crepes', 'قطع دجاج زنجر حار، موتزاريلا، فلفل، زيتون، صوص مايونيز', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500')
        ");
        
        $settings = [
            'whatsappNumber' => '201012345678',
            'walletNumber' => '201012345678',
            'deliveryFee' => 20,
            'paymentMethods' => ['cash' => true, 'instapay' => true, 'card' => false, 'wallet' => true],
            'restaurantAddress' => 'كفر البطيخ، أمام المسجد الكبير'
        ];
        $stmt = $pdo->prepare("INSERT INTO settings (id, value) VALUES ('global', ?)");
        $stmt->execute([json_encode($settings)]);
    }
}

$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/api';
$path = str_replace($base_path, '', $request_uri);
$path = explode('?', $path)[0];
$method = $_SERVER['REQUEST_METHOD'];

$pdo = get_db_connection();

// DB Config Endpoints
if ($path === '/db-config') {
    if ($method === 'GET') {
        if (file_exists($CONFIG_FILE)) {
            echo file_get_contents($CONFIG_FILE);
        } else {
            echo json_encode(['host' => '', 'user' => '', 'password' => '', 'database' => '']);
        }
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        file_put_contents($CONFIG_FILE, json_encode($data, JSON_PRETTY_PRINT));
        $pdo = get_db_connection();
        if ($pdo) {
            echo json_encode(['success' => true, 'message' => 'Database connected successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to connect with provided credentials']);
        }
    }
    exit();
}

if (!$pdo) {
    http_response_code(500);
    echo json_encode(['error' => 'DB not connected']);
    exit();
}

// API Routes
if ($path === '/categories') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM categories ORDER BY `order` ASC");
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['id'] ?? (string)round(microtime(true) * 1000);
        $stmt = $pdo->prepare("INSERT INTO categories (id, name, `order`) VALUES (?, ?, ?)");
        $stmt->execute([$id, $data['name'], $data['order']]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/categories\/(.+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE categories SET name = ?, `order` = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['order'], $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/products') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM products");
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO products (name, price, categoryId, description, imageUrl, isAvailable) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['price'], $data['categoryId'], $data['description'], $data['imageUrl'], $data['isAvailable']]);
        echo json_encode(['success' => true]);
    }
} elseif (preg_match('/^\/products\/(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE products SET name = ?, price = ?, categoryId = ?, description = ?, imageUrl = ?, isAvailable = ? WHERE id = ?");
        $stmt->execute([$data['name'], $data['price'], $data['categoryId'], $data['description'], $data['imageUrl'], $data['isAvailable'], $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/settings') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT value FROM settings WHERE id = 'global'");
        $row = $stmt->fetch();
        echo $row ? $row['value'] : json_encode([]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE settings SET value = ? WHERE id = 'global'");
        $stmt->execute([json_encode($data)]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/orders') {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM orders ORDER BY createdAt DESC");
        echo json_encode($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO orders (customerName, customerPhone, address, items, total, paymentMethod, type, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['customerName'], 
            $data['customerPhone'], 
            $data['address'], 
            json_encode($data['items']), 
            $data['total'], 
            $data['paymentMethod'], 
            $data['type'], 
            $data['screenshot'] ?? null
        ]);
        echo json_encode(['success' => true, 'orderId' => $pdo->lastInsertId()]);
    }
} elseif (preg_match('/^\/orders\/(\d+)$/', $path, $matches)) {
    $id = $matches[1];
    if ($method === 'PATCH') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $id]);
        echo json_encode(['success' => true]);
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    }
} elseif ($path === '/login') {
    $data = json_decode(file_get_contents('php://input'), true);
    if ($data['password'] === '1997') {
        echo json_encode(['success' => true, 'token' => 'mock-admin-token']);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid password']);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found', 'path' => $path]);
}
