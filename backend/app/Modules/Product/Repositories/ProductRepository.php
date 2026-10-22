<?php

declare(strict_types=1);

namespace App\Modules\Product\Repositories;

use App\Modules\Product\Entities\Product;
use App\Modules\Product\Entities\ProductStatus;
use PDO;

final readonly class ProductRepository
{
    private const SELECT_PUBLIC = 'SELECT p.*, c.name AS category_name, i.file_path AS image_path
        FROM products p JOIN categories c ON c.id = p.category_id
        LEFT JOIN product_images i ON i.product_id = p.id AND i.is_primary = 1';
    private const VISIBLE = "p.status = 'active' AND c.status = 'active'";

    public function __construct(private PDO $pdo)
    {
    }

    public function search(string $query, int $limit, int $offset): array
    {
        $where = self::VISIBLE;
        $parameters = [];
        if ($query !== '') {
            $where .= " AND (p.name LIKE :name ESCAPE '!' OR p.sku LIKE :sku ESCAPE '!')";
            $pattern = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $query) . '%';
            $parameters = ['name' => $pattern, 'sku' => $pattern];
        }
        $count = $this->pdo->prepare('SELECT COUNT(*) FROM products p JOIN categories c ON c.id = p.category_id WHERE ' . $where);
        $count->execute($parameters);
        $total = (int) $count->fetchColumn();
        $statement = $this->pdo->prepare(self::SELECT_PUBLIC . ' WHERE ' . $where . ' ORDER BY p.created_at DESC, p.id DESC LIMIT :limit OFFSET :offset');
        foreach ($parameters as $name => $value) {
            $statement->bindValue(':' . $name, $value, PDO::PARAM_STR);
        }
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->bindValue(':offset', $offset, PDO::PARAM_INT);
        $statement->execute();
        return ['items' => array_map($this->hydrate(...), $statement->fetchAll()), 'total' => $total];
    }

    public function findPublishedBySlug(string $slug): ?array
    {
        $statement = $this->pdo->prepare(self::SELECT_PUBLIC . ' WHERE ' . self::VISIBLE . ' AND p.slug = :slug LIMIT 1');
        $statement->execute(['slug' => $slug]);
        $row = $statement->fetch();
        return $row === false ? null : $this->hydrate($row);
    }

    private function hydrate(array $row): array
    {
        return [
            'product' => new Product(
                (int) $row['id'], (int) $row['category_id'], $row['sku'], $row['name'], $row['slug'],
                $row['brand'], (string) $row['price'], (int) $row['stock'], $row['description'],
                $row['specifications'], (bool) $row['featured'], ProductStatus::from($row['status']),
                $row['created_at'], $row['updated_at'],
            ),
            'category' => $row['category_name'],
            'image' => $row['image_path'],
        ];
    }
}
