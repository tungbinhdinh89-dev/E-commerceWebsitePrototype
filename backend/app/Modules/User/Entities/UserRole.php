<?php

declare(strict_types=1);

namespace App\Modules\User\Entities;

enum UserRole: string
{
    case Member = 'member';
    case Admin = 'admin';
}
