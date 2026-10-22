<?php

declare(strict_types=1);

return static function (PDO $pdo): void {
    $pdo->beginTransaction();
    try {
        $category = $pdo->prepare("INSERT INTO categories (name, slug) VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)");
        $category->execute(['Linh kiện máy tính', 'demo-components']);
        $categoryId = (int) $pdo->lastInsertId();
        $product = $pdo->prepare('INSERT INTO products
            (category_id, sku, name, slug, brand, price, stock, description, specifications, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)');
        $image = $pdo->prepare('INSERT INTO product_images (product_id, file_path, alt_text, is_primary)
            VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE id = id');
        $examples = [
            ['DEMO-CPU-001', 'Intel Core i5-14400F', 'demo-intel-core-i5-14400f', 'Intel', '4290000.00', 15,
                'Bộ vi xử lý dành cho học tập, làm việc và PC gaming.', '10 nhân / 16 luồng\nSocket LGA1700', 'cpu-intel.webp'],
            ['DEMO-RAM-001', 'Corsair Vengeance 32GB DDR5', 'demo-corsair-vengeance-32gb', 'Corsair', '2890000.00', 20,
                'Bộ nhớ DDR5 cho hệ thống đa nhiệm.', 'Dung lượng 32GB\nChuẩn DDR5', 'ram-corsair.webp'],
            ['DEMO-SSD-001', 'Samsung 990 PRO 1TB', 'demo-samsung-990-pro-1tb', 'Samsung', '2590000.00', 12,
                'Ổ cứng SSD NVMe cho lưu trữ tốc độ cao.', 'Dung lượng 1TB\nChuẩn M.2 NVMe', 'ssd-samsung.webp'],
        ];
        foreach ($examples as [$sku, $name, $slug, $brand, $price, $stock, $description, $specifications, $file]) {
            $product->execute([$categoryId, $sku, $name, $slug, $brand, $price, $stock, $description, str_replace('\\n', "\n", $specifications)]);
            $image->execute([(int) $pdo->lastInsertId(), '/assets/images/' . $file, $name]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
};
