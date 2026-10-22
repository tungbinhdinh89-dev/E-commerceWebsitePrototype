<?php

declare(strict_types=1);

namespace App\Modules\Order\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Order
{
    public function __construct(
        public int $id,
        public int $userId,
        public string $orderNumber,
        public string $recipientName,
        public string $phone,
        public string $shippingAddress,
        public ?string $note,
        public string $totalAmount,
        public string $paymentMethod,
        public OrderStatus $status,
        public ?string $cancelledAt,
        public ?string $inventoryRestoredAt,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
