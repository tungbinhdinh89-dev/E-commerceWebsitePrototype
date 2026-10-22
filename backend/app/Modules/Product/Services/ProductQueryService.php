<?php

declare(strict_types=1);

namespace App\Modules\Product\Services;

use App\Modules\Product\Repositories\ProductRepository;
use InvalidArgumentException;

final readonly class ProductQueryService
{
    public function __construct(private ProductRepository $products)
    {
    }

    public function search(string $query, int $page): array
    {
        $query = trim($query);
        if (mb_strlen($query) > 100 || $page < 1 || $page > 1000000) {
            throw new InvalidArgumentException('Từ khóa tối đa 100 ký tự; số trang từ 1 đến 1000000.');
        }
        $perPage = 12;
        $result = $this->products->search($query, $perPage, ($page - 1) * $perPage);
        return [
            'items' => array_map($this->present(...), $result['items']),
            'query' => $query,
            'pagination' => [
                'page' => $page, 'perPage' => $perPage, 'total' => $result['total'],
                'totalPages' => (int) ceil($result['total'] / $perPage),
            ],
        ];
    }

    public function findBySlug(string $slug): ?array
    {
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 220) {
            return null;
        }
        $result = $this->products->findPublishedBySlug($slug);
        return $result === null ? null : $this->present($result);
    }

    private function present(array $row): array
    {
        $product = $row['product'];
        $image = $row['image'];
        if ($image === null || !preg_match('~^/(?:assets|uploads)/[a-zA-Z0-9_./-]+$~D', $image)
            || str_contains($image, '..')) {
            $image = null;
        }
        return [
            'id' => $product->id, 'sku' => $product->sku, 'name' => $product->name,
            'slug' => $product->slug, 'brand' => $product->brand, 'category' => $row['category'],
            'price' => $product->price, 'stock' => $product->stock, 'image' => $image,
            'description' => $product->description, 'specifications' => $product->specifications,
        ];
    }
}
