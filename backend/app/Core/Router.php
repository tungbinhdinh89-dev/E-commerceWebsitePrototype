<?php

declare(strict_types=1);

namespace App\Core;

final class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $pattern = preg_quote($path, '~');
        $pattern = preg_replace('/\\\\\{[a-zA-Z]+\\\\\}/', '([^/]+)', $pattern);
        $this->routes[] = ['~^' . $pattern . '$~D', $handler];
    }

    public function dispatch(string $method, string $path): Response
    {
        foreach ($this->routes as [$pattern, $handler]) {
            if (preg_match($pattern, $path, $matches)) {
                if ($method !== 'GET' && $method !== 'HEAD') {
                    return new Response('Method not allowed.', 405, ['Allow' => 'GET, HEAD']);
                }
                array_shift($matches);
                return $handler(...array_map('rawurldecode', $matches));
            }
        }
        return str_starts_with($path, '/api/')
            ? Response::json(null, 404, 'Không tìm thấy tài nguyên.')
            : new Response('<h1>404</h1><p>Không tìm thấy trang.</p>', 404);
    }
}
