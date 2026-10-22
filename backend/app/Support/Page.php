<?php

declare(strict_types=1);

namespace App\Support;

use PDO;

final class Page
{
    /** SQL and identifiers are constants supplied by repositories, never client input. */
    public static function query(PDO $pdo, string $sql, string $countSql, array $parameters, array $query): array
    {
        $page = Input::integer($query['page'] ?? 1, 1, 1000000);
        $size = Input::integer($query['perPage'] ?? 12, 1, 100);
        $count = $pdo->prepare($countSql);
        $count->execute($parameters);
        $total = (int) $count->fetchColumn();
        $statement = $pdo->prepare($sql . ' LIMIT ' . $size . ' OFFSET ' . (($page - 1) * $size));
        $statement->execute($parameters);
        return ['items' => $statement->fetchAll(), 'pagination' => [
            'page' => $page, 'perPage' => $size, 'total' => $total, 'totalPages' => max(1, (int) ceil($total / $size)),
        ]];
    }

    public static function pattern(string $value): string
    {
        return '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value) . '%';
    }
}
