<?php

declare(strict_types=1);

namespace App\Modules\Contact\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Contact
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public string $subject,
        public string $message,
        public ContactStatus $status,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
