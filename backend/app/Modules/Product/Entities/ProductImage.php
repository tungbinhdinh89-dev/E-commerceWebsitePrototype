<?php

declare(strict_types=1);

namespace App\Modules\Product\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class ProductImage
{
    public function __construct(
        public int $id,
        public int $productId,
        public string $filePath,
        public string $altText,
        public bool $isPrimary,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
