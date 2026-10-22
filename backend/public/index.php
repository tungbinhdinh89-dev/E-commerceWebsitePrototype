<?php

declare(strict_types=1);

use App\Core\Response;

ini_set('display_errors', '0');
ini_set('log_errors', '1');
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
try {
    require dirname(__DIR__) . '/bootstrap.php';
    if (PHP_VERSION_ID < 80300 || PHP_VERSION_ID >= 80400) {
        throw new RuntimeException('PHP 8.3 is required.');
    }
    $router = require dirname(__DIR__) . '/routes/web.php';
    $response = $router->dispatch($_SERVER['REQUEST_METHOD'], $path);
} catch (\App\Core\ApiException $error) {
    Response::json(null, $error->status, $error->getMessage(), $error->errors)->send();
    return;
} catch (Throwable $error) {
    // Log only the exception type: PDO messages can contain database credentials/SQL.
    error_log('Request failed: ' . get_class($error));
    http_response_code(503);
    header('Content-Type: ' . (str_starts_with($path, '/api/') ? 'application/json' : 'text/html') . '; charset=utf-8');
    header('Cache-Control: no-store');
    echo str_starts_with($path, '/api/')
        ? json_encode(['success' => false, 'data' => null, 'message' => 'Dịch vụ tạm thời chưa sẵn sàng.', 'errors' => []])
        : '<h1>Dịch vụ tạm thời chưa sẵn sàng</h1><p>Vui lòng thử lại sau.</p>';
    return;
}
$response->send();
