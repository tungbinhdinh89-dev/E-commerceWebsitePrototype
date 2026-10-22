<?php

declare(strict_types=1);

namespace App\Modules\Site\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Service
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public string $description,
        public string $price,
        public ServiceStatus $status,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
