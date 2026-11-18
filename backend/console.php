<?php

declare(strict_types=1);

use App\Core\Database;
use App\Core\Migrator;

$command = $argv[1] ?? 'doctor';
if ($command === 'doctor') {
    $checks = [
        'PHP 8.3' => PHP_VERSION_ID >= 80300 && PHP_VERSION_ID < 80400,
        'Composer autoload' => is_file(__DIR__ . '/vendor/autoload.php'),
        'backend/.env' => is_file(__DIR__ . '/.env'),
    ];
    foreach (['pdo', 'pdo_mysql', 'fileinfo', 'mbstring'] as $extension) {
        $checks[$extension] = extension_loaded($extension);
    }
    foreach ($checks as $name => $passed) {
        echo ($passed ? '[OK] ' : '[MISSING] ') . $name . PHP_EOL;
    }
    if (in_array(false, $checks, true)) {
        exit(1);
    }
}
try {
    require __DIR__ . '/bootstrap.php';
    if (PHP_VERSION_ID < 80300 || PHP_VERSION_ID >= 80400) {
        throw new RuntimeException('PHP 8.3 is required.');
    }
    $config = require __DIR__ . '/config/database.php';
    if ($command === 'connection') {
        $pdo = Database::connectServer($config);
        echo '[OK] MySQL ' . $pdo->query('SELECT VERSION()')->fetchColumn() . PHP_EOL;
        echo 'PDO DSN: ' . Database::dsn($config) . PHP_EOL;
        $statement = $pdo->prepare('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME');
        $statement->execute([$config['database']]);
        $tables = $statement->fetchAll(PDO::FETCH_COLUMN);
        echo 'Existing application tables: ' . ($tables === [] ? '(none)' : implode(', ', $tables)) . PHP_EOL;
        exit(0);
    }
    if ($command === 'init') {
        $pdo = Database::connectServer($config);
        $testDatabase = App\Core\Environment::get('DB_TEST_DATABASE', $config['database'] . '_test');
        if (!preg_match('/^[a-zA-Z0-9_]{1,64}$/D', $testDatabase)
            || !str_ends_with($testDatabase, '_test') || $testDatabase === $config['database']) {
            throw new RuntimeException('Test database must be a separate name ending in _test.');
        }
        foreach ([$config['database'], $testDatabase] as $database) {
            $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . $database . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
            echo '[OK] Database ready: ' . $database . PHP_EOL;
        }
        echo 'PDO DSN: ' . Database::dsn($config) . PHP_EOL;
        exit(0);
    }
    $pdo = Database::connect($config);
    if ($command === 'migration-status') {
        echo '[CONNECTED] Database: ' . $config['database'] . ' / MySQL ' . $pdo->query('SELECT VERSION()')->fetchColumn() . PHP_EOL;
        $exists = $pdo->query("SHOW TABLES LIKE 'schema_migrations'")->fetchColumn();
        $applied = $exists ? $pdo->query('SELECT version, checksum, applied_at FROM schema_migrations ORDER BY version')->fetchAll(PDO::FETCH_UNIQUE | PDO::FETCH_ASSOC) : [];
        $files = glob(__DIR__ . '/database/migrations/*.sql');
        sort($files, SORT_STRING);
        $pending = 0; $invalid = 0; $count = 0;
        foreach ($files as $file) {
            $name = basename($file);
            $row = $applied[$name] ?? null;
            $checksum = hash('sha256', str_replace(["\r\n", "\r"], "\n", file_get_contents($file)));
            $status = !$row ? 'PENDING (not applied)' : (hash_equals($row['checksum'], $checksum) ? 'APPLIED' : 'CHANGED');
            if (!$row) $pending++; elseif ($status === 'CHANGED') $invalid++; else $count++;
            echo '[' . $status . '] ' . $name . ($row ? ' / ' . $row['applied_at'] : '') . PHP_EOL;
            unset($applied[$name]);
        }
        foreach ($applied as $name => $row) {
            echo '[MISSING FILE] ' . $name . ' / applied ' . $row['applied_at'] . PHP_EOL;
            $invalid++;
        }
        echo "Applied: $count; Pending: $pending; Integrity errors: $invalid" . PHP_EOL;
        exit($invalid > 0 ? 1 : 0);
    }
    if ($command === 'doctor') {
        echo '[OK] PDO connection to MySQL ' . $pdo->query('SELECT VERSION()')->fetchColumn() . PHP_EOL;
        $hasMigrations = $pdo->query("SHOW TABLES LIKE 'schema_migrations'")->fetchColumn();
        $versions = $hasMigrations ? $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN) : [];
        $pending = array_diff(array_map('basename', glob(__DIR__ . '/database/migrations/*.sql')), $versions);
        echo $pending === [] ? '[OK] Schema up to date' . PHP_EOL : '[PENDING] Run npm run backend:migrate' . PHP_EOL;
        exit($pending === [] ? 0 : 1);
    }
    if ($command === 'create-admin') {
        $email = App\Core\Environment::get('BOOTSTRAP_ADMIN_EMAIL');
        $password = App\Core\Environment::get('BOOTSTRAP_ADMIN_PASSWORD');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD in the ignored .env first.');
        $app = new App\Application($pdo);
        $id = $app->users->provisionAdmin($email, $password);
        echo 'Admin account ready (ID ' . $id . '). Credentials remain in local configuration.' . PHP_EOL;
    } elseif ($command === 'seed-store') {
        if (App\Core\Environment::get('APP_ENV') !== 'local') throw new RuntimeException('Initial store seed is allowed only in local development.');
        $seed = require __DIR__ . '/database/seeders/store.php';
        $admin = $pdo->query("SELECT id FROM users WHERE role='admin' AND status='active' ORDER BY id LIMIT 1")->fetchColumn();
        if (!$admin) throw new RuntimeException('Create an administrator before seeding editorial content.');
        $seed($pdo, (int) $admin);
        echo 'Initial catalog/content stored in MySQL. Existing data preserved; seed is not repeated.' . PHP_EOL;
    } elseif ($command === 'migrate') {
        $completed = (new Migrator($pdo, __DIR__ . '/database/migrations'))->run();
        echo $completed === [] ? 'Schema up to date.' . PHP_EOL : implode(PHP_EOL, $completed) . PHP_EOL;
    } elseif ($command === 'seed') {
        if (App\Core\Environment::get('APP_ENV') !== 'local') {
            throw new RuntimeException('Demo seed is allowed only when APP_ENV=local.');
        }
        $seed = require __DIR__ . '/database/seeders/catalog.php';
        $seed($pdo);
        echo 'Demo catalog seeded; existing products preserved.' . PHP_EOL;
    } else {
        throw new RuntimeException('Usage: php console.php [init|connection|doctor|migration-status|migrate|seed|seed-store|create-admin]');
    }
} catch (Throwable $error) {
    $message = $error instanceof PDOException
        ? ($command === 'migration-status'
            ? '[DISCONNECTED / CHECK FAILED] Cannot read database migration status. Check backend/.env, database existence, network and database permissions.'
            : 'Database operation failed. Check .env, MySQL 8 and migration status. MySQL DDL is not automatically rolled back.')
        : $error->getMessage();
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}
