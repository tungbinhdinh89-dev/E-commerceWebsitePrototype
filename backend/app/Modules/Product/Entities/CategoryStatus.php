<?php

declare(strict_types=1);

namespace App\Modules\Product\Entities;

enum CategoryStatus: string
{
    case Active = 'active';
    case Hidden = 'hidden';
}
