<?php

declare(strict_types=1);

namespace App\Modules\Order\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class OrderItem
{
    public function __construct(
        public int $id,
        public int $orderId,
        public int $productId,
        public string $productName,
        public string $sku,
        public int $quantity,
        public string $unitPrice,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
