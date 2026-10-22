<?php

declare(strict_types=1);

use App\Core\Environment;

return [
    'host' => Environment::get('DB_HOST', '127.0.0.1'),
    'port' => Environment::get('DB_PORT', '13306'),
    'database' => Environment::get('DB_DATABASE', 'computer_store'),
    'username' => Environment::get('DB_USERNAME'),
    'password' => Environment::get('DB_PASSWORD'),
];
