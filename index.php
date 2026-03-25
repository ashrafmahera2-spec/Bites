<?php
// Simple PHP Router to serve the React build and API
$request_uri = $_SERVER['REQUEST_URI'];
$path = explode('?', $request_uri)[0];

// Handle API requests
if (strpos($path, '/api') === 0) {
    require_once __DIR__ . '/api/index.php';
    exit();
}

// Serve static files from current dir or dist/
$dist_path = file_exists(__DIR__ . '/dist') ? __DIR__ . '/dist' : __DIR__;
$file_path = $dist_path . $path;

if ($path !== '/' && file_exists($file_path) && !is_dir($file_path)) {
    $mime_types = [
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml',
        'json' => 'application/json',
        'ico'  => 'image/x-icon',
    ];
    $ext = pathinfo($file_path, PATHINFO_EXTENSION);
    if (isset($mime_types[$ext])) {
        header('Content-Type: ' . $mime_types[$ext]);
    }
    readfile($file_path);
    exit();
}

// Fallback to index.html for SPA routing
if (file_exists($dist_path . '/index.html')) {
    readfile($dist_path . '/index.html');
} else {
    echo "Please run 'npm run build' to generate the frontend files.";
}
