<?php

declare(strict_types=1);

namespace App\Modules\Order\Entities;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Shipping = 'shipping';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Pending => in_array($next, [self::Confirmed, self::Cancelled], true),
            self::Confirmed => in_array($next, [self::Shipping, self::Cancelled], true),
            self::Shipping => $next === self::Completed,
            self::Completed, self::Cancelled => false,
        };
    }
}
