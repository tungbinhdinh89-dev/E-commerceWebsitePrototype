<?php
declare(strict_types=1);
namespace App\Modules\Cart\Repositories;
use PDO;
final readonly class CartRepository
{
    public function __construct(private PDO $pdo) {}
    public function items(int $user):array
    {
        $s=$this->pdo->prepare('SELECT i.product_id,i.quantity FROM cart_items i JOIN carts c ON c.id=i.cart_id WHERE c.user_id=? ORDER BY i.product_id');$s->execute([$user]);
        return array_map(static fn($r)=>['productId'=>(string)$r['product_id'],'quantity'=>(int)$r['quantity']],$s->fetchAll());
    }
    public function lock(int $user):int
    {
        $this->pdo->prepare('INSERT INTO carts(user_id) VALUES(?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)')->execute([$user]);
        $s=$this->pdo->prepare('SELECT id FROM carts WHERE user_id=? FOR UPDATE');$s->execute([$user]);return(int)$s->fetchColumn();
    }
    public function set(int $cart,int $product,int $quantity):void
    {
        if($quantity===0)$this->pdo->prepare('DELETE FROM cart_items WHERE cart_id=? AND product_id=?')->execute([$cart,$product]);
        else $this->pdo->prepare('INSERT INTO cart_items(cart_id,product_id,quantity) VALUES(?,?,?) ON DUPLICATE KEY UPDATE quantity=?')->execute([$cart,$product,$quantity,$quantity]);
    }
    public function clear(int $user):void
    {
        $this->pdo->prepare('DELETE i FROM cart_items i JOIN carts c ON c.id=i.cart_id WHERE c.user_id=?')->execute([$user]);
    }
}
