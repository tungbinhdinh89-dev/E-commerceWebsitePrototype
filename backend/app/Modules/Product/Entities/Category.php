<?php

declare(strict_types=1);

namespace App\Modules\Product\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Category
{
    public function __construct(
        public int $id,
        public string $name,
        public string $slug,
        public ?int $parentId,
        public CategoryStatus $status,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
