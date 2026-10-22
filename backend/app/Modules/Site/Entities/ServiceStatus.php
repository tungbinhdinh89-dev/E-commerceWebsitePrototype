<?php

declare(strict_types=1);

namespace App\Modules\Site\Entities;

enum ServiceStatus: string
{
    case Active = 'active';
    case Hidden = 'hidden';
}
