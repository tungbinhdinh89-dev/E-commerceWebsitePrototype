<?php

declare(strict_types=1);

namespace App\Modules\Site\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Page
{
    public function __construct(
        public int $id,
        public string $slug,
        public string $title,
        public string $content,
        public ?string $seoTitle,
        public ?string $metaDescription,
        public PageStatus $status,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
