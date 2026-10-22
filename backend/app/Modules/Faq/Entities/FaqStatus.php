<?php

declare(strict_types=1);

namespace App\Modules\Faq\Entities;

enum FaqStatus: string
{
    case Active = 'active';
    case Hidden = 'hidden';
}
