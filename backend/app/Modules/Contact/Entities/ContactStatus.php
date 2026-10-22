<?php

declare(strict_types=1);

namespace App\Modules\Contact\Entities;

enum ContactStatus: string
{
    case Unread = 'unread';
    case Read = 'read';
    case Replied = 'replied';
}
