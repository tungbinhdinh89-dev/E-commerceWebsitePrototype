<?php

declare(strict_types=1);

namespace App\Modules\User\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class User
{
    public function __construct(
        public int $id,
        public string $fullName,
        public string $email,
        private string $passwordHash,
        public ?string $phone,
        public ?string $address,
        public ?string $avatarPath,
        public UserRole $role,
        public UserStatus $status,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }

    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->passwordHash);
    }

    public function canSignIn(): bool
    {
        return $this->status === UserStatus::Active;
    }
}
