<?php

declare(strict_types=1);

// Development only. The document root must still be backend/public/.
$webroot = realpath(__DIR__ . '/public');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
$file = realpath($webroot . $path);
$safeStatic = $file !== false && str_starts_with($file, $webroot . DIRECTORY_SEPARATOR)
    && !preg_match('~(?:^|[/\\\\])\.~', $path)
    && preg_match('/\.(?:css|js|png|jpe?g|webp|ico|svg|woff2?)$/iD', $file)
    && (!str_starts_with($path, '/uploads/') || preg_match('/\.(?:png|jpe?g|webp)$/iD', $file));
if ($safeStatic && is_file($file)) {
    return false;
}
require __DIR__ . '/public/index.php';
