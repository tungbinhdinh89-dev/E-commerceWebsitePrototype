<?php

declare(strict_types=1);

namespace App\Core;

final readonly class Response
{
    public function __construct(
        public string $body,
        public int $status = 200,
        public array $headers = ['Content-Type' => 'text/html; charset=utf-8'],
    ) {
    }

    public static function json(mixed $data, int $status = 200, string $message = '', array $errors = []): self
    {
        return new self(json_encode([
            'success' => $status < 400,
            'data' => $data,
            'message' => $message,
            'errors' => $errors,
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE), $status, [
            'Content-Type' => 'application/json; charset=utf-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    public function send(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        echo $this->body;
    }
}
