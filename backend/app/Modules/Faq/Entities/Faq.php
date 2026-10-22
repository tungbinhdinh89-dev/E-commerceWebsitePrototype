<?php

declare(strict_types=1);

namespace App\Modules\Faq\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Faq
{
    public function __construct(
        public int $id,
        public string $question,
        public string $answer,
        public int $sortOrder,
        public FaqStatus $status,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
