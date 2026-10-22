<?php

declare(strict_types=1);

use App\Core\Database;
use App\Core\Response;
use App\Core\Router;
use App\Core\View;
use App\Modules\Product\Controllers\ProductController;
use App\Modules\Product\Repositories\ProductRepository;
use App\Modules\Product\Services\ProductQueryService;

$router = new Router();
$store = static function (): \App\Http\StoreController {
    \App\Core\Session::start();
    return new \App\Http\StoreController(new \App\Application(Database::connect(require dirname(__DIR__) . '/config/database.php')));
};
$router->get('/api/store', static fn () => $store()->snapshot());
$router->get('/api/store/list/{resource}', static fn (string $resource) => $store()->listing($resource));
$router->get('/api/store/item/{resource}/{id}', static fn (string $resource, string $id) => $store()->item($resource, $id));
$router->post('/api/store/{action}', static fn (string $action) => $store()->mutate($action));
// Lazy wiring: unknown routes do not open a database connection.
$catalog = static function (): ProductController {
    $pdo = Database::connect(require dirname(__DIR__) . '/config/database.php');
    return new ProductController(
        new ProductQueryService(new ProductRepository($pdo)),
        new View(dirname(__DIR__, 2) . '/frontend/resources/views'),
    );
};
$router->get('/', static fn () => new Response('', 302, ['Location' => '/products']));
$router->get('/products', static fn () => $catalog()->index($_GET));
$router->get('/products/{slug}', static fn (string $slug) => $catalog()->show($slug));
$router->get('/api/products', static fn () => $catalog()->index($_GET, true));
$router->get('/api/health', static function (): Response {
    $pdo = Database::connect(require dirname(__DIR__) . '/config/database.php');
    $applied = $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
    $expected = array_map('basename', glob(dirname(__DIR__) . '/database/migrations/*.sql'));
    $ready = array_diff($expected, $applied) === [];
    return Response::json(['database' => true, 'schemaReady' => $ready], $ready ? 200 : 503);
});
return $router;
