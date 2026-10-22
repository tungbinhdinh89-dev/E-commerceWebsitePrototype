<?php

declare(strict_types=1);

namespace App\Modules\Cart\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class CartItem
{
    public function __construct(
        public int $id,
        public int $cartId,
        public int $productId,
        public int $quantity,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
