<?php

declare(strict_types=1);

namespace App\Modules\Product\Entities;

enum ProductStatus: string
{
    case Active = 'active';
    case Hidden = 'hidden';
    case Discontinued = 'discontinued';
}
