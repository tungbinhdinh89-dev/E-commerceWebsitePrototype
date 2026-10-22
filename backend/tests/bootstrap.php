<?php

declare(strict_types=1);

// Unit tests have no third-party dependencies and can run before composer install.
// The application uses Composer's PSR-4 loader exclusively.
spl_autoload_register(static function (string $class): void {
    if (str_starts_with($class, 'App\\')) {
        $file = dirname(__DIR__) . '/app/' . str_replace('\\', '/', substr($class, 4)) . '.php';
        if (is_file($file)) {
            require $file;
        }
    }
});

function check(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function test(string $name, callable $work): void
{
    $work();
    echo '[PASS] ' . $name . PHP_EOL;
}
