<?php

declare(strict_types=1);

namespace App\Support;

use App\Core\ApiException;

final class Input
{
    public static function text(array $data, string $key, int $max = 200, int $min = 0): string
    {
        $value = $data[$key] ?? '';
        if (!is_string($value) || !mb_check_encoding($value, 'UTF-8')) {
            throw new ApiException('Dữ liệu không hợp lệ: ' . $key);
        }
        $value = trim($value);
        if (mb_strlen($value) < $min || mb_strlen($value) > $max) {
            throw new ApiException('Độ dài không hợp lệ: ' . $key);
        }
        return $value;
    }

    public static function id(mixed $value): int
    {
        if ((!is_string($value) && !is_int($value)) || !preg_match('/^[1-9][0-9]{0,17}$/D', (string) $value)) {
            throw new ApiException('Mã dữ liệu không hợp lệ.');
        }
        return (int) $value;
    }

    public static function integer(mixed $value, int $min = 0, int $max = 10000): int
    {
        $result = filter_var($value, FILTER_VALIDATE_INT);
        if ($result === false || $result < $min || $result > $max) {
            throw new ApiException('Số lượng hoặc giá trị không hợp lệ.');
        }
        return $result;
    }

    public static function email(array $data, string $key = 'email'): string
    {
        $value = mb_strtolower(self::text($data, $key, 254, 3));
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException('Email không hợp lệ.');
        }
        return $value;
    }

    public static function slug(string $text): string
    {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
        $slug = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $ascii ?: $text), '-'));
        return substr($slug ?: 'item', 0, 140);
    }

    public static function image(mixed $path): string
    {
        if (!is_string($path) || strlen($path) > 255 || ($path !== '' &&
            (!preg_match('~^/(assets|uploads)/[a-zA-Z0-9_./-]+\.(jpe?g|png|webp|svg)$~iD', $path)
                || str_contains($path, '..') || (str_starts_with($path, '/uploads/') && str_ends_with(strtolower($path), '.svg'))))) {
            throw new ApiException('Vui lòng sử dụng ảnh đã tải lên máy chủ.');
        }
        return $path;
    }
}
