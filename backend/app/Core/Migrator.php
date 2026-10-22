<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use RuntimeException;

final readonly class Migrator
{
    public function __construct(private PDO $pdo, private string $directory)
    {
    }

    /** MySQL DDL implicitly commits. Run only against a backed-up/local database. */
    public function run(): array
    {
        $lock = $this->pdo->query("SELECT GET_LOCK(SHA2(CONCAT(DATABASE(), ':migrations'), 256), 10)")->fetchColumn();
        if ((int) $lock !== 1) {
            throw new RuntimeException('Another migration process is running.');
        }
        try {
            $this->pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(160) PRIMARY KEY,
                checksum CHAR(64) NOT NULL,
                applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci');
            $applied = $this->pdo->query('SELECT version, checksum FROM schema_migrations')->fetchAll(PDO::FETCH_KEY_PAIR);
            $files = glob($this->directory . '/*.sql');
            sort($files, SORT_STRING);
            $completed = [];
            foreach ($files as $file) {
                $version = basename($file);
                // Git may check out CRLF on Windows and LF on Linux.
                $contents = str_replace(["\r\n", "\r"], "\n", file_get_contents($file));
                $checksum = hash('sha256', $contents);
                if (isset($applied[$version])) {
                    if (!hash_equals($applied[$version], $checksum)) {
                        throw new RuntimeException('Applied migration has changed: ' . $version);
                    }
                    continue;
                }
                // Migration files contain plain DDL only, no procedures or semicolons in literals.
                try {
                    foreach (explode(';', $contents) as $sql) {
                        if (trim($sql) !== '') {
                            $this->pdo->exec($sql);
                        }
                    }
                } catch (\Throwable $error) {
                    throw new RuntimeException('Migration failed: ' . $version
                        . '. DDL may be partly applied; inspect the schema before retrying.', 0, $error);
                }
                $statement = $this->pdo->prepare('INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)');
                $statement->execute([$version, $checksum]);
                $completed[] = $version;
            }
            return $completed;
        } finally {
            $this->pdo->query("SELECT RELEASE_LOCK(SHA2(CONCAT(DATABASE(), ':migrations'), 256))");
        }
    }
}
