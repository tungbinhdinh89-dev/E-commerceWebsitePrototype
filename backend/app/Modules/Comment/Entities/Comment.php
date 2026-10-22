<?php

declare(strict_types=1);

namespace App\Modules\Comment\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class Comment
{
    public function __construct(
        public int $id,
        public int $articleId,
        public int $userId,
        public string $content,
        public CommentStatus $status,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
