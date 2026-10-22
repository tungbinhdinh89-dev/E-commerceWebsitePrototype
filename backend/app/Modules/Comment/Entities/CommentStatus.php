<?php

declare(strict_types=1);

namespace App\Modules\Comment\Entities;

enum CommentStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Hidden = 'hidden';
}
