<?php

declare(strict_types=1);

namespace App\Modules\User\Services;

use App\Core\ApiException;
use App\Core\Session;
use App\Modules\User\Repositories\UserRepository;
use App\Support\Input;
use PDO;
use PDOException;

final readonly class UserService
{
    public function __construct(private PDO $pdo, private UserRepository $users) {}

    public function current(): ?array
    {
        $id = $_SESSION['user_id'] ?? null;
        $row = $id ? $this->users->find((int) $id) : null;
        if ($id && (!$row || $row['status'] !== 'active'
            || !hash_equals(hash('sha256', $row['password_hash']), $_SESSION['credential_version'] ?? ''))) {
            Session::signOut();
            return null;
        }
        return $row ? $this->present($row) : null;
    }

    public function requireUser(): array
    {
        return $this->current() ?? throw new ApiException('Vui lòng đăng nhập để tiếp tục.', 401);
    }

    public function requireAdmin(): array
    {
        $user = $this->requireUser();
        if ($user['role'] !== 'ADMIN') throw new ApiException('Bạn không có quyền quản trị.', 403);
        return $user;
    }

    public function login(array $data): array
    {
        $email = Input::email($data);
        $password = $data['password'] ?? '';
        $scope = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'cli') . ':' . $email);
        if ($this->users->attempts($scope) >= 8) throw new ApiException('Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút.', 429);
        $row = $this->users->byEmail($email);
        $hash = $row['password_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid = is_string($password) && strlen($password) <= 72 && password_verify($password, $hash);
        if (!$row || !$valid || $row['status'] !== 'active') {
            $this->users->failedLogin($scope);
            throw new ApiException('Email hoặc mật khẩu không chính xác.', 401);
        }
        $this->users->clearAttempts($scope);
        Session::signIn((int) $row['id']);
        $_SESSION['credential_version'] = hash('sha256', $row['password_hash']);
        return $this->present($row);
    }

    public function register(array $data): int
    {
        $name = Input::text($data, 'name', 150, 2);
        $email = Input::email($data);
        $password = $data['password'] ?? null;
        if (!is_string($password) || strlen($password) < 8 || strlen($password) > 72
            || ($data['passwordConfirmation'] ?? null) !== $password) {
            throw new ApiException('Mật khẩu cần 8–72 ký tự và xác nhận phải trùng khớp.');
        }
        try {
            return $this->users->create($name, $email, password_hash($password, PASSWORD_DEFAULT));
        } catch (PDOException $error) {
            if (($error->errorInfo[1] ?? null) === 1062) throw new ApiException('Email này đã được đăng ký.', 409);
            throw $error;
        }
    }

    private function newPassword(array $data): string
    {
        $password = $data['password'] ?? null;
        if (!is_string($password) || strlen($password) < 8 || strlen($password) > 72
            || ($data['passwordConfirmation'] ?? null) !== $password) {
            throw new ApiException('Mật khẩu cần 8–72 byte và xác nhận phải trùng khớp.');
        }
        return $password;
    }

    public function changePassword(array $data): void
    {
        $user = $this->requireUser();
        $row = $this->users->find((int) $user['id']);
        $old = $data['currentPassword'] ?? null;
        if (!is_string($old) || strlen($old) > 72 || !password_verify($old, $row['password_hash'])) {
            throw new ApiException('Mật khẩu hiện tại không chính xác.');
        }
        $hash = password_hash($this->newPassword($data), PASSWORD_DEFAULT);
        if (!$this->users->password((int) $user['id'], $row['password_hash'], $hash)) {
            throw new ApiException('Tài khoản đã thay đổi. Vui lòng đăng nhập lại.', 409);
        }
        Session::signIn((int) $user['id']);
        $_SESSION['credential_version'] = hash('sha256', $hash);
    }

    public function resetPassword(array $data): void
    {
        $this->requireAdmin();
        $id = Input::id($data['id'] ?? null);
        $row = $this->users->find($id) ?? throw new ApiException('Không tìm thấy tài khoản.', 404);
        if ($row['role'] !== 'member') throw new ApiException('Chỉ đặt lại mật khẩu thành viên.', 403);
        $hash = password_hash($this->newPassword($data), PASSWORD_DEFAULT);
        if (!$this->users->password($id, $row['password_hash'], $hash)) {
            throw new ApiException('Tài khoản đã thay đổi. Vui lòng thử lại.', 409);
        }
    }

    public function profile(array $data): void
    {
        $user = $this->requireUser();
        $phone = Input::text($data, 'phone', 30);
        if ($phone !== '' && !preg_match('/^(0|\+84)[0-9]{9,10}$/D', preg_replace('/\s+/', '', $phone))) {
            throw new ApiException('Số điện thoại không hợp lệ.');
        }
        $this->users->profile((int) $user['id'], Input::text($data, 'name', 150, 2), $phone, Input::text($data, 'address', 2000));
    }

    public function listing(array $query): array
    {
        $this->requireAdmin();
        $page = $this->users->listing($query);
        $page['items'] = array_map($this->present(...), $page['items']);
        return $page;
    }

    public function toggle(int $id): void
    {
        $actor = $this->requireAdmin();
        if ((int) $actor['id'] === $id) throw new ApiException('Không thể khóa tài khoản đang đăng nhập.', 409);
        $this->pdo->beginTransaction();
        try {
            $admins = $this->users->activeAdmins();
            $user = $this->users->find($id) ?? throw new ApiException('Không tìm thấy tài khoản.', 404);
            if ($user['role'] === 'admin' && $user['status'] === 'active' && count($admins) <= 1) {
                throw new ApiException('Không thể khóa quản trị viên cuối cùng.', 409);
            }
            $this->users->toggle($id);
            $this->pdo->commit();
        } catch (\Throwable $error) { $this->pdo->rollBack(); throw $error; }
    }

    public function names(array $ids): array { return $this->users->names(array_values(array_unique($ids))); }
    public function favorites(int $id): array { return $this->users->favorites($id); }
    public function favorite(int $productId): void
    {
        $id = (int) $this->requireUser()['id'];
        $this->pdo->beginTransaction();
        try { $this->users->favorite($id, $productId); $this->pdo->commit(); }
        catch (\Throwable $error) { $this->pdo->rollBack(); throw $error; }
    }
    public function memberCount(): int { return $this->users->memberCount(); }

    public function provisionAdmin(string $email, string $password): int
    {
        if (PHP_SAPI !== 'cli') throw new ApiException('Không được phép.', 403);
        $existing = $this->users->byEmail($email);
        if ($existing) {
            if ($existing['role'] !== 'admin') throw new \RuntimeException('Admin email belongs to an existing member.');
            return (int) $existing['id'];
        }
        if (strlen($password) < 16 || strlen($password) > 72) throw new \RuntimeException('Bootstrap admin requires a 16–72 character password.');
        return $this->users->create('Quản trị TechZone', $email, password_hash($password, PASSWORD_DEFAULT), 'admin');
    }

    private function present(array $row): array
    {
        return ['id' => (string) $row['id'], 'name' => $row['full_name'], 'email' => $row['email'],
            'role' => strtoupper($row['role']), 'phone' => $row['phone'] ?? '', 'address' => $row['address'] ?? '',
            'active' => $row['status'] === 'active'];
    }
}
