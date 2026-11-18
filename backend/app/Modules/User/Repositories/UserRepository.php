<?php

declare(strict_types=1);

namespace App\Modules\User\Repositories;

use App\Support\Page;
use PDO;

final readonly class UserRepository
{
    public function __construct(private PDO $pdo) {}

    public function find(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
        $statement->execute([$id]);
        return $statement->fetch() ?: null;
    }

    public function byEmail(string $email): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $statement->execute([$email]);
        return $statement->fetch() ?: null;
    }

    public function create(string $name, string $email, string $hash, string $role = 'member'): int
    {
        $statement = $this->pdo->prepare('INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)');
        $statement->execute([$name, $email, $hash, $role]);
        return (int) $this->pdo->lastInsertId();
    }

    public function password(int $id, string $previous, string $hash): bool
    {
        $statement = $this->pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ? AND status = \'active\'');
        $statement->execute([$hash, $id, $previous]);
        return $statement->rowCount() === 1;
    }

    public function profile(int $id, string $name, string $phone, string $address): void
    {
        $this->pdo->prepare('UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?')->execute([$name, $phone, $address, $id]);
    }

    public function listing(array $query): array
    {
        $pattern = Page::pattern(\App\Support\Input::text($query, 'q', 100));
        $where = " FROM users WHERE (full_name LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!')";
        return Page::query($this->pdo, 'SELECT *' . $where . ' ORDER BY id DESC', 'SELECT COUNT(*)' . $where, [$pattern, $pattern], $query);
    }

    public function toggle(int $id): void
    {
        $this->pdo->prepare("UPDATE users SET status = CASE WHEN status = 'active' THEN 'locked' ELSE 'active' END WHERE id = ?")->execute([$id]);
    }

    public function activeAdmins(): array
    {
        return $this->pdo->query("SELECT id FROM users WHERE role = 'admin' AND status = 'active' ORDER BY id FOR UPDATE")->fetchAll(PDO::FETCH_COLUMN);
    }

    public function names(array $ids): array
    {
        if ($ids === []) return [];
        $statement = $this->pdo->prepare('SELECT id, full_name FROM users WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')');
        $statement->execute($ids);
        return $statement->fetchAll(PDO::FETCH_KEY_PAIR);
    }

    public function favorites(int $id): array
    {
        $statement = $this->pdo->prepare('SELECT product_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC');
        $statement->execute([$id]);
        return array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN));
    }

    public function favorite(int $userId, int $productId): void
    {
        $statement = $this->pdo->prepare('SELECT id FROM users WHERE id = ? FOR UPDATE');
        $statement->execute([$userId]);
        $find = $this->pdo->prepare('SELECT product_id FROM user_favorites WHERE user_id = ? AND product_id = ?');
        $find->execute([$userId, $productId]);
        $sql = $find->fetchColumn() === false
            ? 'INSERT INTO user_favorites (user_id, product_id) VALUES (?, ?)'
            : 'DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?';
        $this->pdo->prepare($sql)->execute([$userId, $productId]);
    }

    public function attempts(string $scope): int
    {
        $statement = $this->pdo->prepare('SELECT attempts FROM auth_attempts WHERE scope = ? AND window_started_at > UTC_TIMESTAMP() - INTERVAL 15 MINUTE');
        $statement->execute([$scope]);
        return (int) $statement->fetchColumn();
    }

    public function failedLogin(string $scope): void
    {
        $this->pdo->prepare('INSERT INTO auth_attempts (scope) VALUES (?) ON DUPLICATE KEY UPDATE
            attempts = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, 1, attempts + 1),
            window_started_at = IF(window_started_at < UTC_TIMESTAMP() - INTERVAL 15 MINUTE, UTC_TIMESTAMP(), window_started_at)')->execute([$scope]);
    }

    public function clearAttempts(string $scope): void
    {
        $this->pdo->prepare('DELETE FROM auth_attempts WHERE scope = ?')->execute([$scope]);
    }

    public function memberCount(): int
    {
        return (int) $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'member'")->fetchColumn();
    }
}
