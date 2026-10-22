<?php use App\Core\View; ?>
<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= View::escape($title) ?></title>
    <meta name="description" content="<?= View::escape($description) ?>">
    <link rel="icon" href="/assets/favicon.svg">
    <link rel="stylesheet" href="/assets/catalog.css">
</head>
<body>
    <a class="skip-link" href="#main">Đến nội dung chính</a>
    <header class="header"><div class="container header-inner">
        <a class="brand" href="/">tech<span>zone.</span></a>
        <nav aria-label="Điều hướng chính"><a href="/products">Sản phẩm</a></nav>
    </div></header>
    <main class="container" id="main"><?= $content ?></main>
    <footer class="container">TechZone · Máy tính &amp; linh kiện</footer>
    <script type="module" src="/assets/catalog.js"></script>
</body>
</html>
