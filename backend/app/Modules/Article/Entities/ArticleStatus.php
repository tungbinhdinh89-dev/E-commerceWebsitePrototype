<?php

declare(strict_types=1);

namespace App\Modules\Article\Entities;

enum ArticleStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Hidden = 'hidden';
}
