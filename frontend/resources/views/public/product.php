<?php use App\Core\View; ?>
<p class="breadcrumb"><a href="/products">← Tất cả sản phẩm</a> / <?= View::escape($product['category']) ?></p>
<article class="product-detail">
    <div><?php if ($product['image']): ?><img src="<?= View::escape($product['image']) ?>" alt="<?= View::escape($product['name']) ?>" width="600" height="450"><?php endif; ?></div>
    <div><p class="eyebrow"><?= View::escape($product['brand']) ?></p>
        <h1><?= View::escape($product['name']) ?></h1>
        <p>SKU: <?= View::escape($product['sku']) ?></p>
        <p class="price"><?= View::escape(number_format((float) $product['price'], 0, ',', '.')) ?> ₫</p>
        <p><?= $product['stock'] > 0 ? 'Còn hàng' : 'Tạm hết hàng' ?></p>
        <h2>Mô tả sản phẩm</h2><p><?= nl2br(View::escape($product['description'])) ?></p>
        <?php if ($product['specifications']): ?><h2>Thông số chính</h2><p><?= nl2br(View::escape($product['specifications'])) ?></p><?php endif; ?>
    </div>
</article>
