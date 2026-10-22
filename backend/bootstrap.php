<?php

declare(strict_types=1);

if (!is_file(__DIR__ . '/vendor/autoload.php')) {
    throw new RuntimeException('Run composer install in backend/ first.');
}
require __DIR__ . '/vendor/autoload.php';
App\Core\Environment::load(__DIR__ . '/.env');
date_default_timezone_set('UTC');
