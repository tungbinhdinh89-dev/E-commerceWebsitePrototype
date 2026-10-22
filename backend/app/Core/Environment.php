<?php

declare(strict_types=1);

namespace App\Core;

use RuntimeException;

final class Environment
{
    /** Simple KEY=value files; shell/container variables take precedence. No interpolation. */
    public static function load(string $path): void
    {
        if (!is_file($path)) {
            return;
        }
        foreach (file($path, FILE_IGNORE_NEW_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (!preg_match('/^([A-Z][A-Z0-9_]*)=(.*)$/', $line, $matches)) {
                throw new RuntimeException('Invalid environment configuration.');
            }
            [, $name, $value] = $matches;
            $value = trim($value);
            if (strlen($value) >= 2 && (($value[0] === '"' && str_ends_with($value, '"'))
                || ($value[0] === "'" && str_ends_with($value, "'")))) {
                $value = substr($value, 1, -1);
            }
            if (getenv($name) === false) {
                putenv($name . '=' . $value);
            }
        }
    }

    public static function get(string $name, string $default = ''): string
    {
        $value = getenv($name);
        return $value === false ? $default : $value;
    }
}
