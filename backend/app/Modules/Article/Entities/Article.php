<?php

declare(strict_types=1);

namespace App\Modules\Article\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Article
{
    public function __construct(
        public int $id,
        public int $authorId,
        public string $title,
        public string $slug,
        public string $summary,
        public string $content,
        public ?string $thumbnailPath,
        public ?string $seoTitle,
        public ?string $metaDescription,
        public ?string $keywords,
        public ArticleStatus $status,
        public ?string $publishedAt,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
