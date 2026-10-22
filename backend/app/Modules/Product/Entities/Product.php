<?php

declare(strict_types=1);

namespace App\Modules\Product\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Product
{
    public function __construct(
        public int $id,
        public int $categoryId,
        public string $sku,
        public string $name,
        public string $slug,
        public string $brand,
        public string $price,
        public int $stock,
        public string $description,
        public ?string $specifications,
        public bool $featured,
        public ProductStatus $status,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
