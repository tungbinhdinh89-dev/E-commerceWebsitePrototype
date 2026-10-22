<?php

declare(strict_types=1);

use App\Core\Database;
use App\Core\Environment;
use App\Core\Migrator;
use App\Modules\Product\Repositories\ProductRepository;
use App\Modules\Product\Services\ProductQueryService;

require __DIR__ . '/bootstrap.php';
Environment::load(dirname(__DIR__) . '/.env');
$config = require dirname(__DIR__) . '/config/database.php';
$testDatabase = Environment::get('DB_TEST_DATABASE', $config['database'] . '_test');
if (!str_ends_with($testDatabase, '_test') || $testDatabase === $config['database']) {
    throw new RuntimeException('Integration tests require a separate database ending in _test.');
}
$config['database'] = $testDatabase;
$pdo = Database::connect($config);
$migrator = new Migrator($pdo, dirname(__DIR__) . '/database/migrations');
$migrator->run();

function rejects(PDO $pdo, string $sql, array $values, int $driverCode): void
{
    try {
        $pdo->prepare($sql)->execute($values);
    } catch (PDOException $error) {
        check((int) ($error->errorInfo[1] ?? 0) === $driverCode, 'Unexpected database error code.');
        return;
    }
    throw new RuntimeException('Database accepted invalid data.');
}

test('All 15 tables exist; re-running migrations is a no-op', static function () use ($pdo, $migrator): void {
    $count = $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME <> 'schema_migrations'")->fetchColumn();
    check((int) $count === 15, 'Expected 15 domain tables.');
    check($migrator->run() === [], 'Migrations are not idempotent.');
});
$seed = require dirname(__DIR__) . '/database/seeders/catalog.php';
$seed($pdo);
test('Demo seed is idempotent and search uses real MySQL data', static function () use ($pdo, $seed): void {
    $before = $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
    $seed($pdo);
    check($before === $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn(), 'Duplicate seed products.');
    $service = new ProductQueryService(new ProductRepository($pdo));
    $result = $service->search('DEMO-CPU-001', 1);
    check($result['pagination']['total'] === 1 && is_string($result['items'][0]['price']), 'Catalog/decimal contract invalid.');
    check($service->search("' OR 1=1 --", 1)['pagination']['total'] === 0, 'Search is not parameterized.');
    check($service->search('%DEMO-CPU-001%', 1)['pagination']['total'] === 0, 'LIKE wildcard was not escaped.');
});

$productId = (int) $pdo->query("SELECT id FROM products WHERE sku = 'DEMO-CPU-001'")->fetchColumn();
$originalStock = $pdo->query('SELECT stock FROM products WHERE id = ' . $productId)->fetchColumn();
$pdo->beginTransaction();
try {
    $token = bin2hex(random_bytes(8));
    $email = $token . '@example.invalid';
    $statement = $pdo->prepare('INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)');
    $statement->execute(['Integration test', $email, password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT)]);
    $userId = (int) $pdo->lastInsertId();
    test('Unique email and one persistent cart per member', static function () use ($pdo, $email, $userId): void {
        rejects($pdo, 'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)', ['Duplicate', strtoupper($email), 'unused'], 1062);
        $pdo->prepare('INSERT INTO carts (user_id) VALUES (?)')->execute([$userId]);
        rejects($pdo, 'INSERT INTO carts (user_id) VALUES (?)', [$userId], 1062);
    });
    $cartId = (int) $pdo->query('SELECT id FROM carts WHERE user_id = ' . $userId)->fetchColumn();
    test('Cart uniqueness, positive quantity and foreign keys', static function () use ($pdo, $cartId, $productId): void {
        rejects($pdo, 'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 0)', [$cartId, $productId], 3819);
        $pdo->prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 1)')->execute([$cartId, $productId]);
        rejects($pdo, 'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 1)', [$cartId, $productId], 1062);
        rejects($pdo, 'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 1)', [0, $productId], 1452);
    });
    test('Negative prices/stock and multiple primary images are rejected', static function () use ($pdo, $productId): void {
        rejects($pdo, 'UPDATE products SET price = -1 WHERE id = ?', [$productId], 3819);
        rejects($pdo, 'UPDATE products SET stock = -1 WHERE id = ?', [$productId], 1264);
        rejects($pdo, "INSERT INTO product_images (product_id, file_path, is_primary) VALUES (?, '/uploads/products/duplicate.webp', 1)", [$productId], 1062);
    });
    $statement = $pdo->prepare("INSERT INTO orders (user_id, order_number, recipient_name, phone, shipping_address, total_amount)
        VALUES (?, ?, 'Test recipient', '0900000000', 'Test address', '4290000.00')");
    $statement->execute([$userId, 'TEST-' . $token]);
    $orderId = (int) $pdo->lastInsertId();
    $pdo->prepare("INSERT INTO order_items (order_id, product_id, product_name, sku, quantity, unit_price)
        VALUES (?, ?, 'Snapshot name', 'SNAPSHOT-SKU', 1, '4290000.00')")->execute([$orderId, $productId]);
    test('Order snapshots survive catalog edits; history blocks hard deletes', static function () use ($pdo, $orderId, $productId, $userId): void {
        $pdo->prepare("UPDATE products SET name = 'Changed name', price = 1, stock = stock - 1 WHERE id = ?")->execute([$productId]);
        $item = $pdo->query('SELECT product_name, unit_price FROM order_items WHERE order_id = ' . $orderId)->fetch();
        check($item['product_name'] === 'Snapshot name' && $item['unit_price'] === '4290000.00', 'Snapshot changed.');
        rejects($pdo, 'DELETE FROM products WHERE id = ?', [$productId], 1451);
        rejects($pdo, 'DELETE FROM users WHERE id = ?', [$userId], 1451);
        rejects($pdo, "UPDATE orders SET status = 'cancelled' WHERE id = ?", [$orderId], 3819);
        $pdo->prepare("UPDATE orders SET status = 'cancelled', cancelled_at = UTC_TIMESTAMP(), inventory_restored_at = UTC_TIMESTAMP() WHERE id = ?")->execute([$orderId]);
    });
    test('Hidden products are excluded from search/detail', static function () use ($pdo, $productId): void {
        $pdo->prepare("UPDATE products SET status = 'hidden' WHERE id = ?")->execute([$productId]);
        $service = new ProductQueryService(new ProductRepository($pdo));
        check($service->search('DEMO-CPU-001', 1)['items'] === [], 'Hidden product exposed.');
        check($service->findBySlug('demo-intel-core-i5-14400f') === null, 'Hidden detail exposed.');
    });
    test('New comments require moderation and cannot be blank', static function () use ($pdo, $userId, $token): void {
        $pdo->prepare("INSERT INTO articles (author_id, title, slug, summary, content) VALUES (?, 'Test', ?, '', '')")->execute([$userId, 'test-' . $token]);
        $articleId = (int) $pdo->lastInsertId();
        $pdo->prepare("INSERT INTO comments (article_id, user_id, content) VALUES (?, ?, 'Test comment')")->execute([$articleId, $userId]);
        $commentId = (int) $pdo->lastInsertId();
        check($pdo->query('SELECT status FROM comments WHERE id = ' . $commentId)->fetchColumn() === 'pending', 'Comment was auto-approved.');
        rejects($pdo, "INSERT INTO comments (article_id, user_id, content) VALUES (?, ?, '   ')", [$articleId, $userId], 3819);
    });
} finally {
    $pdo->rollBack();
}
test('Rollback preserves catalog stock', static function () use ($pdo, $productId, $originalStock): void {
    check($pdo->query('SELECT stock FROM products WHERE id = ' . $productId)->fetchColumn() === $originalStock, 'Stock was not rolled back.');
});
