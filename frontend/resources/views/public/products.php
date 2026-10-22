<?php use App\Core\View; ?>
<section class="intro"><p class="eyebrow">KHÁM PHÁ CÔNG NGHỆ</p><h1>Sản phẩm tại TechZone</h1><p>Lựa chọn linh kiện phù hợp cho góc máy của bạn.</p></section>
<form action="/products" method="get" class="search" id="catalog-search">
    <label for="keyword">Tìm theo tên hoặc SKU</label>
    <div class="search-row"><input id="keyword" name="q" maxlength="100" value="<?= View::escape($query) ?>" placeholder="Bạn đang tìm gì?"><button>Tìm kiếm</button></div>
</form>
<p id="catalog-status" role="status" aria-live="polite"><?= View::escape($pagination['total']) ?> sản phẩm</p>
<div class="product-grid" id="catalog-results">
<?php foreach ($items as $product): ?>
    <article class="product-card">
        <a href="/products/<?= View::escape($product['slug']) ?>">
            <?php if ($product['image']): ?><img src="<?= View::escape($product['image']) ?>" alt="<?= View::escape($product['name']) ?>" width="360" height="250" loading="lazy"><?php endif; ?>
            <span class="category"><?= View::escape($product['category']) ?></span>
            <h2><?= View::escape($product['name']) ?></h2>
        </a>
        <p class="price"><?= View::escape(number_format((float) $product['price'], 0, ',', '.')) ?> ₫</p>
        <p><?= $product['stock'] > 0 ? 'Còn hàng' : 'Tạm hết hàng' ?></p>
    </article>
<?php endforeach; ?>
<?php if ($items === []): ?><p>Không tìm thấy sản phẩm phù hợp.</p><?php endif; ?>
</div>
<nav class="pagination" id="catalog-pagination" aria-label="Phân trang sản phẩm">
    <?php if ($pagination['page'] > 1): ?><a href="/products?<?= View::escape(http_build_query(['q' => $query, 'page' => $pagination['page'] - 1])) ?>">← Trang trước</a><?php endif; ?>
    <span>Trang <?= View::escape($pagination['page']) ?> / <?= max(1, $pagination['totalPages']) ?></span>
    <?php if ($pagination['page'] < $pagination['totalPages']): ?><a href="/products?<?= View::escape(http_build_query(['q' => $query, 'page' => $pagination['page'] + 1])) ?>">Trang sau →</a><?php endif; ?>
</nav>
