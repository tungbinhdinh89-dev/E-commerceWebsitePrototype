<?php

declare(strict_types=1);

namespace App\Modules\Site\Entities;

enum PageStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Hidden = 'hidden';
}
