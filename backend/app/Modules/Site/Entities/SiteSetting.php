<?php

declare(strict_types=1);

namespace App\Modules\Site\Entities;

/** Database entity. Monetary values stay decimal strings; timestamps are UTC. */
final readonly class SiteSetting
{
    public function __construct(
        public int $id,
        public string $settingKey,
        public string $settingValue,
        public string $createdAt,
        public string $updatedAt,
    ) {
    }
}
