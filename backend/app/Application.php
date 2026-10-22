<?php
declare(strict_types=1);
namespace App;

use PDO;
use App\Modules\User\Repositories\UserRepository;
use App\Modules\User\Services\UserService;
use App\Modules\Product\Repositories\CatalogRepository;
use App\Modules\Product\Services\CatalogService;
use App\Modules\Cart\Repositories\CartRepository;
use App\Modules\Cart\Services\CartService;
use App\Modules\Order\Repositories\OrderRepository;
use App\Modules\Order\Services\OrderService;
use App\Modules\Site\Repositories\SiteRepository;
use App\Modules\Site\Services\SiteService;
use App\Modules\Article\Repositories\ArticleRepository;
use App\Modules\Article\Services\ArticleService;
use App\Modules\Comment\Repositories\CommentRepository;
use App\Modules\Comment\Services\CommentService;
use App\Modules\Contact\Repositories\ContactRepository;
use App\Modules\Contact\Services\ContactService;
use App\Modules\Faq\Repositories\FaqRepository;
use App\Modules\Faq\Services\FaqService;

/** Explicit composition root. All Sales/Catalog operations share this PDO. */
final readonly class Application
{
    public UserService $users;
    public CatalogService $catalog;
    public CartService $cart;
    public OrderService $orders;
    public SiteService $site;
    public ArticleService $articles;
    public CommentService $comments;
    public ContactService $contacts;
    public FaqService $faqs;

    public function __construct(PDO $pdo)
    {
        $this->users = new UserService($pdo, new UserRepository($pdo));
        $this->catalog = new CatalogService($pdo, new CatalogRepository($pdo));
        $this->site = new SiteService(new SiteRepository($pdo));
        $this->cart = new CartService($pdo, new CartRepository($pdo), $this->catalog, $this->users);
        $this->orders = new OrderService($pdo, new OrderRepository($pdo), $this->cart, $this->catalog, $this->site, $this->users);
        $this->articles = new ArticleService(new ArticleRepository($pdo));
        $this->comments = new CommentService(new CommentRepository($pdo), $this->users, $this->articles);
        $this->contacts = new ContactService(new ContactRepository($pdo));
        $this->faqs = new FaqService(new FaqRepository($pdo));
    }
}
