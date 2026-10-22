<?php

declare(strict_types=1);

namespace App\Support;

use App\Core\ApiException;

final class Money
{
    public const MAX = 999999999999999;

    public static function minor(mixed $value): int
    {
        if (!is_scalar($value) || is_bool($value) || !preg_match('/^([0-9]{1,13})(?:\.([0-9]{1,2}))?$/D', (string) $value, $match)) {
            throw new ApiException('Số tiền không hợp lệ.');
        }
        return (int) $match[1] * 100 + (int) str_pad($match[2] ?? '', 2, '0');
    }

    public static function decimal(int $minor): string
    {
        if ($minor < 0 || $minor > self::MAX) {
            throw new ApiException('Giá trị đơn hàng vượt giới hạn.');
        }
        return intdiv($minor, 100) . '.' . str_pad((string) ($minor % 100), 2, '0', STR_PAD_LEFT);
    }

    public static function multiply(int $minor, int $quantity): int
    {
        if ($quantity < 1 || $minor > intdiv(self::MAX, $quantity)) {
            throw new ApiException('Giá trị đơn hàng vượt giới hạn.');
        }
        return $minor * $quantity;
    }

    public static function discount(int $subtotal, int $basisPoints): int
    {
        return intdiv($subtotal, 10000) * $basisPoints + intdiv(($subtotal % 10000) * $basisPoints + 5000, 10000);
    }
}
