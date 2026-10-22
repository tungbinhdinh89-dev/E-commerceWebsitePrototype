<?php

declare(strict_types=1);

namespace App\Core;

final class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    private function add(string $method, string $path, callable $handler): void
    {
        $pattern = preg_quote($path, '~');
        $pattern = preg_replace('/\\\\\{[a-zA-Z]+\\\\\}/', '([^/]+)', $pattern);
        $this->routes[] = ['~^' . $pattern . '$~D', $handler, $method];
    }

    public function dispatch(string $method, string $path): Response
    {
        $allowed = [];
        foreach ($this->routes as [$pattern, $handler, $expectedMethod]) {
            if (preg_match($pattern, $path, $matches)) {
                if ($method !== $expectedMethod && !($method === 'HEAD' && $expectedMethod === 'GET')) {
                    $allowed[] = $expectedMethod;
                    continue;
                }
                array_shift($matches);
                return $handler(...array_map('rawurldecode', $matches));
            }
        }
        if ($allowed !== []) return str_starts_with($path, '/api/')
            ? Response::json(null, 405, 'Phương thức không được hỗ trợ.')
            : new Response('Method not allowed.', 405, ['Allow' => implode(', ', $allowed)]);
        return str_starts_with($path, '/api/')
            ? Response::json(null, 404, 'Không tìm thấy tài nguyên.')
            : new Response('<h1>404</h1><p>Không tìm thấy trang.</p>', 404);
    }
}
