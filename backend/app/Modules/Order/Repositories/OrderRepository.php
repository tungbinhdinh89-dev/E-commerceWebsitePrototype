<?php
declare(strict_types=1);
namespace App\Modules\Order\Repositories;
use App\Support\Page;
use App\Support\Input;
use PDO;
final readonly class OrderRepository
{
    public function __construct(private PDO $pdo){}
    public function coupons():array{return $this->pdo->query('SELECT code,basis_points,max_discount FROM coupons WHERE active=1 ORDER BY id')->fetchAll();}
    public function listing(array $q,?int $user):array
    {
        $w='1=1';$p=[];if($user!==null){$w.=' AND user_id=?';$p[]=$user;}
        if(($q['status']??'')!==''){$w.=' AND status=?';$p[]=Input::text($q,'status',20);}
        $pattern=Page::pattern(Input::text($q,'q',100));$w.=" AND (order_number LIKE ? ESCAPE '!' OR recipient_name LIKE ? ESCAPE '!' OR phone LIKE ? ESCAPE '!')";
        return Page::query($this->pdo,"SELECT * FROM orders WHERE $w ORDER BY id DESC","SELECT COUNT(*) FROM orders WHERE $w",[...$p,$pattern,$pattern,$pattern],$q);
    }
    public function find(int $id,bool $lock=false):?array
    {
        $s=$this->pdo->prepare('SELECT * FROM orders WHERE id=?'.($lock?' FOR UPDATE':''));$s->execute([$id]);return $s->fetch()?:null;
    }
    public function items(int $id):array
    {
        $s=$this->pdo->prepare('SELECT * FROM order_items WHERE order_id=? ORDER BY product_id');$s->execute([$id]);
        return array_map(static fn($r)=>['productId'=>(string)$r['product_id'],'name'=>$r['product_name'],'sku'=>$r['sku'],'price'=>(string)$r['unit_price'],'quantity'=>(int)$r['quantity'],'image'=>$r['image_path']??''],$s->fetchAll());
    }
    public function create(array $values,array $items):int
    {
        $sql='INSERT INTO orders(user_id,order_number,recipient_name,phone,shipping_address,note,total_amount,subtotal,discount,shipping_fee,coupon_code) VALUES(?,?,?,?,?,?,?,?,?,?,?)';
        $this->pdo->prepare($sql)->execute($values);$id=(int)$this->pdo->lastInsertId();
        $s=$this->pdo->prepare('INSERT INTO order_items(order_id,product_id,product_name,sku,quantity,unit_price,image_path) VALUES(?,?,?,?,?,?,?)');
        foreach($items as$i)$s->execute([$id,$i['productId'],$i['name'],$i['sku'],$i['quantity'],$i['price'],$i['image']]);
        return $id;
    }
    public function status(int $id,string $status):void
    {
        if($status==='cancelled')$this->pdo->prepare("UPDATE orders SET status='cancelled',cancelled_at=UTC_TIMESTAMP(),inventory_restored_at=UTC_TIMESTAMP() WHERE id=?")->execute([$id]);
        else $this->pdo->prepare('UPDATE orders SET status=? WHERE id=?')->execute([$status,$id]);
    }
    public function stats():array
    {
        $r=$this->pdo->query("SELECT COUNT(*) AS orders, COALESCE(SUM(status='pending'),0) AS pendingOrders,COALESCE(SUM(IF(status='completed',total_amount,0)),0) AS revenue FROM orders")->fetch();
        $r['days']=$this->pdo->query('SELECT DATE(created_at) AS date,COUNT(*) AS count FROM orders WHERE created_at >= UTC_DATE()-INTERVAL 6 DAY GROUP BY DATE(created_at)')->fetchAll();return $r;
    }
    public function counts(array $ids):array
    {
        if($ids===[])return [];
        $s=$this->pdo->prepare('SELECT user_id,COUNT(*) FROM orders WHERE user_id IN ('.implode(',',array_fill(0,count($ids),'?')).') GROUP BY user_id');
        $s->execute($ids);return $s->fetchAll(PDO::FETCH_KEY_PAIR);
    }
}
