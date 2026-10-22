<?php

declare(strict_types=1);

namespace App\Modules\Product\Controllers;

use App\Core\Response;
use App\Core\View;
use App\Modules\Product\Services\ProductQueryService;
use InvalidArgumentException;

final readonly class ProductController
{
    public function __construct(private ProductQueryService $products, private View $view)
    {
    }

    public function index(array $query, bool $json = false): Response
    {
        try {
            $keyword = $query['q'] ?? '';
            $page = $query['page'] ?? '1';
            if (!is_string($keyword) || !is_string($page) || !preg_match('/^[1-9][0-9]{0,6}$/D', $page)) {
                throw new InvalidArgumentException('Từ khóa hoặc số trang không hợp lệ.');
            }
            $data = $this->products->search($keyword, (int) $page);
        } catch (InvalidArgumentException $error) {
            return $json
                ? Response::json(null, 422, $error->getMessage(), ['query' => $error->getMessage()])
                : $this->page('public/error', ['message' => $error->getMessage()], 'Dữ liệu không hợp lệ', 422);
        }
        return $json ? Response::json($data) : $this->page('public/products', $data, 'Sản phẩm | TechZone');
    }

    public function show(string $slug): Response
    {
        $product = $this->products->findBySlug($slug);
        return $product === null
            ? $this->page('public/error', ['message' => 'Không tìm thấy sản phẩm.'], 'Không tìm thấy sản phẩm', 404)
            : $this->page('public/product', ['product' => $product], $product['name'] . ' | TechZone');
    }

    private function page(string $template, array $data, string $title, int $status = 200): Response
    {
        $content = $this->view->render($template, $data);
        return new Response($this->view->render('layouts/public', [
            'content' => $content, 'title' => $title,
            'description' => 'Máy tính và linh kiện chính hãng tại TechZone. Tìm sản phẩm, giá và thông số.',
        ]), $status);
    }
}
