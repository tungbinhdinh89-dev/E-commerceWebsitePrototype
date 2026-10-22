<?php
declare(strict_types=1);
namespace App\Modules\Cart\Services;
use App\Core\ApiException;
use App\Modules\Cart\Repositories\CartRepository;
use App\Modules\Product\Services\CatalogService;
use App\Modules\User\Services\UserService;
use App\Support\Input;
use PDO;
final readonly class CartService
{
    public function __construct(private PDO $pdo,private CartRepository $carts,private CatalogService $catalog,private UserService $users){}
    public function items():array
    {
        $user=$this->users->current();return $user?$this->carts->items((int)$user['id']):($_SESSION['cart']??[]);
    }
    public function change(array $data,bool $add=false):void
    {
        $id=Input::id($data['productId']??null);$quantity=Input::integer($data['quantity']??1,$add?1:0,10000);
        $user=$this->users->current();
        if(!$user){
            $items=$this->items();$old=0;foreach($items as $i)if((int)$i['productId']===$id)$old=$i['quantity'];
            $quantity=$add?$old+$quantity:$quantity;
            if($quantity>0){$p=$this->catalog->get($id);if($quantity>$p['stock'])throw new ApiException('Số lượng vượt quá tồn kho.',409);}
            $items=array_values(array_filter($items,static fn($i)=>(int)$i['productId']!==$id));
            if($quantity>0)$items[]=['productId'=>(string)$id,'quantity'=>$quantity];
            if(count($items)>100)throw new ApiException('Giỏ hàng tối đa 100 sản phẩm.');
            $_SESSION['cart']=$items;return;
        }
        $this->pdo->beginTransaction();
        try{
            $cart=$this->carts->lock((int)$user['id']);$items=$this->carts->items((int)$user['id']);$old=0;
            foreach($items as $i)if((int)$i['productId']===$id)$old=$i['quantity'];
            $quantity=$add?$old+$quantity:$quantity;
            if($quantity>0){$p=$this->catalog->get($id);if($quantity>10000||$quantity>$p['stock'])throw new ApiException('Số lượng vượt quá tồn kho.',409);}
            if($old===0&&$quantity>0&&count($items)>=100)throw new ApiException('Giỏ hàng tối đa 100 sản phẩm.');
            $this->carts->set($cart,$id,$quantity);$this->pdo->commit();
        }catch(\Throwable $e){$this->pdo->rollBack();throw $e;}
    }
    public function mergeGuest(int $user):void
    {
        $guest=$_SESSION['cart']??[];if($guest===[])return;
        $this->pdo->beginTransaction();
        try{
            $cart=$this->carts->lock($user);$items=$this->carts->items($user);$map=[];
            foreach([...$items,...$guest]as$i)$map[(int)$i['productId']]=($map[(int)$i['productId']]??0)+(int)$i['quantity'];
            foreach(array_slice($map,0,100,true)as$id=>$qty){
                try{$p=$this->catalog->get($id);$this->carts->set($cart,$id,min($qty,$p['stock'],10000));}
                catch(ApiException $e){if($e->status!==404)throw $e;}
            }
            $this->pdo->commit();$_SESSION['cart']=[];
        }catch(\Throwable $e){$this->pdo->rollBack();throw $e;}
    }
    public function lockedItems(int $user):array
    {
        if(!$this->pdo->inTransaction())throw new \LogicException('Cart locking requires a Sales transaction.');
        $this->carts->lock($user);return $this->carts->items($user);
    }
    public function clear(int $user):void
    {
        if(!$this->pdo->inTransaction())throw new \LogicException('Cart clearing requires a Sales transaction.');
        $this->carts->clear($user);
    }
}
