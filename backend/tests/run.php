<?php

declare(strict_types=1);

use App\Core\Environment;
use App\Core\Database;
use App\Core\Response;
use App\Core\Router;
use App\Core\View;
use App\Core\ApiException;
use App\Support\Money;
use App\Modules\Order\Entities\OrderStatus;
use App\Modules\User\Entities\User;
use App\Modules\User\Entities\UserRole;
use App\Modules\User\Entities\UserStatus;

require __DIR__ . '/bootstrap.php';

test('PDO DSN uses NAS host/mapped port without including credentials', static function (): void {
    $config = ['host' => '192.168.1.200', 'port' => '32771', 'database' => 'computer_store',
        'username' => 'test-user', 'password' => 'unit-test-secret'];
    check(Database::dsn($config) === 'mysql:host=192.168.1.200;port=32771;dbname=computer_store;charset=utf8mb4', 'Invalid connection string.');
    check(!str_contains(Database::dsn($config, false), 'dbname='), 'Server connection selected a database.');
    check(!str_contains(Database::dsn($config), $config['password']), 'Credentials leaked into DSN.');
    $config['database'] = 'computer_store;DROP DATABASE other';
    try {
        Database::dsn($config);
        throw new LogicException('Invalid identifier accepted.');
    } catch (RuntimeException $error) {
        check($error->getMessage() === 'Database configuration is incomplete.', 'Unexpected DSN error.');
    }
});

test('Order transitions match BR-08; terminal states cannot change', static function (): void {
    $allowed = ['pending:confirmed', 'pending:cancelled', 'confirmed:shipping', 'confirmed:cancelled', 'shipping:completed'];
    foreach (OrderStatus::cases() as $from) {
        foreach (OrderStatus::cases() as $to) {
            check($from->canTransitionTo($to) === in_array($from->value . ':' . $to->value, $allowed, true), 'Invalid state transition.');
        }
    }
});
test('Money calculations remain exact at DECIMAL limits and reject overflow', static function (): void {
    check(Money::decimal(Money::minor('9999999999999.99')) === '9999999999999.99', 'Decimal precision lost.');
    check(Money::minor('1.1') === 110 && Money::minor('0.01') === 1, 'Minor unit conversion failed.');
    check(Money::discount(101, 5000) === 51, 'Half-up discount rounding failed.');
    check(Money::discount(Money::MAX, 10000) === Money::MAX, 'Discount overflowed.');
    foreach ([static fn () => Money::minor('-1'), static fn () => Money::minor('1.001'),
        static fn () => Money::minor('1e3'), static fn () => Money::multiply(Money::MAX, 2)] as $operation) {
        try {
            $operation();
            throw new LogicException('Invalid money accepted.');
        } catch (ApiException) {
            // Expected validation response.
        }
    }
});
test('Password verification works; hashes are not publicly serialized', static function (): void {
    $hash = password_hash('Unit-test-only-123!', PASSWORD_DEFAULT);
    $user = new User(1, 'Test', 'unit@example.invalid', $hash, null, null, null,
        UserRole::Member, UserStatus::Locked, '2026-01-01 00:00:00', '2026-01-01 00:00:00');
    check($user->verifyPassword('Unit-test-only-123!') && !$user->verifyPassword('incorrect'), 'Password verification failed.');
    check(!$user->canSignIn(), 'Locked account may sign in.');
    check(!str_contains(json_encode($user), $hash), 'Password hash exposed.');
});
test('Router binds slugs and rejects unsupported methods/unknown routes', static function (): void {
    $router = new Router();
    $router->get('/products/{slug}', static fn (string $slug) => Response::json(['slug' => $slug]));
    $response = $router->dispatch('GET', '/products/demo-cpu');
    check($response->status === 200 && json_decode($response->body, true)['data']['slug'] === 'demo-cpu', 'Slug binding failed.');
    check($router->dispatch('POST', '/products/demo-cpu')->status === 405, 'POST was accepted.');
    check($router->dispatch('GET', '/products/a/b')->status === 404, 'Unexpected route matched.');
    check($router->dispatch('GET', '/api/unknown')->status === 404, 'Unknown JSON route succeeded.');
});
test('JSON envelope preserves decimal strings', static function (): void {
    $data = json_decode(Response::json(['price' => '9999999999999.99'])->body, true);
    check($data['success'] && $data['data']['price'] === '9999999999999.99' && isset($data['errors']), 'JSON contract changed.');
});
test('PHP catalog escapes database/search content and remains readable without JS', static function (): void {
    $view = new View(dirname(__DIR__, 2) . '/frontend/resources/views');
    $html = $view->render('public/products', [
        'items' => [['name' => '<script>alert(1)</script>', 'slug' => 'safe-slug', 'image' => null,
            'category' => '<b>Category</b>', 'price' => '1000.00', 'stock' => 1]],
        'query' => '\"><script>alert(2)</script>',
        'pagination' => ['total' => 1, 'page' => 1, 'totalPages' => 1],
    ]);
    check(!str_contains($html, '<script>') && str_contains($html, '&lt;script&gt;'), 'Unescaped HTML in catalog.');
    check(str_contains($html, '/products/safe-slug') && str_contains($html, 'method="get"'), 'Server-rendered links/form missing.');
    try {
        $view->render('../config/database');
        throw new LogicException('Template traversal accepted.');
    } catch (RuntimeException $error) {
        check($error->getMessage() === 'Invalid template.', 'Unexpected exception.');
    }
});
test('Environment loader preserves shell values and handles quoted values containing equals', static function (): void {
    $path = tempnam(sys_get_temp_dir(), 'techzone-env-');
    $original = getenv('TECHZONE_UNIT_ENV');
    try {
        file_put_contents($path, "# comment\nTECHZONE_UNIT_ENV=\"a=b\"\n");
        putenv('TECHZONE_UNIT_ENV');
        Environment::load($path);
        check(Environment::get('TECHZONE_UNIT_ENV') === 'a=b', 'Quoted environment value parsed incorrectly.');
        putenv('TECHZONE_UNIT_ENV=shell-value');
        Environment::load($path);
        check(Environment::get('TECHZONE_UNIT_ENV') === 'shell-value', 'Shell value overwritten.');
    } finally {
        unlink($path);
        putenv($original === false ? 'TECHZONE_UNIT_ENV' : 'TECHZONE_UNIT_ENV=' . $original);
    }
});
