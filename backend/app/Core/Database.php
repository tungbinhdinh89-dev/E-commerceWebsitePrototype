<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use RuntimeException;

final class Database
{
    public static function connect(array $config): PDO
    {
        return self::open($config, true);
    }

    public static function connectServer(array $config): PDO
    {
        return self::open($config, false);
    }

    /** PDO DSNs contain no credentials; authentication is passed separately. */
    public static function dsn(array $config, bool $includeDatabase = true): string
    {
        if (!preg_match('/^[a-zA-Z0-9_]{1,64}$/D', $config['database'])
            || !preg_match('/^[a-zA-Z0-9.:-]+$/D', $config['host'])
            || !ctype_digit((string) $config['port'])
            || (int) $config['port'] < 1 || (int) $config['port'] > 65535) {
            throw new RuntimeException('Database configuration is incomplete.');
        }
        return sprintf('mysql:host=%s;port=%s;%scharset=utf8mb4',
            $config['host'], $config['port'], $includeDatabase ? 'dbname=' . $config['database'] . ';' : '');
    }

    private static function open(array $config, bool $includeDatabase): PDO
    {
        if ($config['username'] === '') {
            throw new RuntimeException('Database username is missing.');
        }
        $pdo = new PDO(
            self::dsn($config, $includeDatabase),
            $config['username'],
            $config['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 8,
                PDO::MYSQL_ATTR_MULTI_STATEMENTS => false,
            ],
        );
        $version = (string) $pdo->query('SELECT VERSION()')->fetchColumn();
        $baseline = str_starts_with($version, '8.') && version_compare($version, '8.0.16', '>=');
        $nas = preg_match('/^26\.7\.[0-9]+(?:[-+]|$)/D', $version) === 1;
        if (stripos($version, 'MariaDB') !== false || (!$baseline && !$nas)) {
            throw new RuntimeException('Supported database: MySQL 8.x (8.0.16+) or NAS MySQL 26.7.x; server reports ' . $version . '.');
        }
        $pdo->exec("SET SESSION time_zone = '+00:00'");
        $pdo->exec("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
        return $pdo;
    }
}
