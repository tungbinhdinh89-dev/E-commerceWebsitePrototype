<?php

declare(strict_types=1);

namespace App\Core;

use RuntimeException;
use Throwable;

final readonly class View
{
    public function __construct(private string $directory)
    {
    }

    public static function escape(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    public function render(string $template, array $data = []): string
    {
        if (!preg_match('~^[a-zA-Z0-9_/-]+$~D', $template) || str_contains($template, '..')) {
            throw new RuntimeException('Invalid template.');
        }
        $path = $this->directory . '/' . $template . '.php';
        if (!is_file($path)) {
            throw new RuntimeException('Template unavailable.');
        }
        extract($data, EXTR_SKIP);
        ob_start();
        try {
            require $path;
            return (string) ob_get_clean();
        } catch (Throwable $error) {
            ob_end_clean();
            throw $error;
        }
    }
}
