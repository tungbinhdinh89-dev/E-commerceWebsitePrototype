<?php
declare(strict_types=1);
namespace App\Modules\Order\Services;
use App\Core\ApiException;
use App\Modules\Order\Repositories\OrderRepository;
use App\Modules\Order\Entities\OrderStatus;
use App\Modules\Cart\Services\CartService;
use App\Modules\Product\Services\CatalogService;
use App\Modules\Site\Services\SiteService;
use App\Modules\User\Services\UserService;
use App\Support\Input;
use App\Support\Money;
use PDO;
final readonly class OrderService
{
    public function __construct(private PDO $pdo,private OrderRepository $orders,private CartService $cart,private CatalogService $catalog,private SiteService $site,private UserService $users){}
    public function coupons():array{return array_map(static fn($c)=>['code'=>$c['code'],'basisPoints'=>(int)$c['basis_points'],'maxDiscount'=>$c['max_discount']],$this->orders->coupons());}
    public function checkout(array $data):string
    {
        $user=$this->users->requireUser();$name=Input::text($data,'name',150,2);$phone=preg_replace('/\s+/','',Input::text($data,'phone',30,10));
        if(!preg_match('/^(0|\+84)[0-9]{9,10}$/D',$phone))throw new ApiException('Số điện thoại không hợp lệ.');
        $address=Input::text($data,'address',2000,10);$note=Input::text($data,'note',2000);$coupon=strtoupper(Input::text($data,'coupon',40));
        $this->pdo->beginTransaction();
        try{
            $cart=$this->cart->lockedItems((int)$user['id']);if($cart===[])throw new ApiException('Giỏ hàng đang trống.',409);
            $items=$this->catalog->reserve($cart);$subtotal=0;
            foreach($items as$item){$subtotal+=Money::multiply(Money::minor($item['price']),$item['quantity']);Money::decimal($subtotal);}
            $discount=0;$matched=$coupon==='';
            foreach($this->orders->coupons()as$c)if($c['code']===$coupon){$discount=min(Money::discount($subtotal,(int)$c['basis_points']),Money::minor($c['max_discount']));$matched=true;}
            if(!$matched)throw new ApiException('Mã ưu đãi không hợp lệ.');
            $settings=$this->site->shipping();$shipping=$subtotal-$discount>=Money::minor($settings['freeFrom'])?0:Money::minor($settings['fee']);
            $total=$subtotal-$discount+$shipping;Money::decimal($total);
            if(isset($data['expectedTotal'])&&Money::minor($data['expectedTotal'])!==$total)throw new ApiException('Giá hoặc phí giao hàng đã thay đổi. Vui lòng kiểm tra lại giỏ hàng.',409);
            $number='TZ-'.gmdate('Ymd').'-'.strtoupper(bin2hex(random_bytes(5)));
            $id=$this->orders->create([(int)$user['id'],$number,$name,$phone,$address,$note,Money::decimal($total),Money::decimal($subtotal),Money::decimal($discount),Money::decimal($shipping),$coupon?:null],$items);
            $this->cart->clear((int)$user['id']);$this->users->profile(['name'=>$name,'phone'=>$phone,'address'=>$address]);
            $this->pdo->commit();return(string)$id;
        }catch(\Throwable $e){$this->pdo->rollBack();throw $e;}
    }
    public function listing(array $q=[],bool $admin=false):array
    {
        $user=$admin?$this->users->requireAdmin():$this->users->requireUser();
        $p=$this->orders->listing($q,$admin?null:(int)$user['id']);$p['items']=array_map($this->present(...),$p['items']);return $p;
    }
    public function get(int $id,bool $admin=false):array
    {
        $user=$this->users->requireUser();$r=$this->orders->find($id)??throw new ApiException('Không tìm thấy đơn hàng.',404);
        if($user['role']!=='ADMIN'&&(int)$r['user_id']!==(int)$user['id'])throw new ApiException('Không tìm thấy đơn hàng.',404);
        return $this->present($r);
    }
    public function status(array $data):void
    {
        $this->users->requireAdmin();$id=Input::id($data['id']??null);
        $next=OrderStatus::tryFrom(Input::text($data,'status',20))??throw new ApiException('Trạng thái không hợp lệ.');
        $this->pdo->beginTransaction();
        try{
            $row=$this->orders->find($id,true)??throw new ApiException('Không tìm thấy đơn hàng.',404);
            $current=OrderStatus::from($row['status']);if(!$current->canTransitionTo($next))throw new ApiException('Không thể chuyển trạng thái đơn hàng.',409);
            if($next===OrderStatus::Cancelled){if($row['inventory_restored_at']!==null)throw new ApiException('Đơn hàng đã hoàn kho.',409);$this->catalog->restore($this->orders->items($id));}
            $this->orders->status($id,$next->value);$this->pdo->commit();
        }catch(\Throwable $e){$this->pdo->rollBack();throw $e;}
    }
    public function stats():array{$this->users->requireAdmin();return $this->orders->stats();}
    public function counts(array $ids):array{$this->users->requireAdmin();return $this->orders->counts($ids);}
    private function present(array $r):array
    {
        return ['id'=>(string)$r['id'],'number'=>$r['order_number'],'userId'=>(string)$r['user_id'],'name'=>$r['recipient_name'],'phone'=>$r['phone'],'address'=>$r['shipping_address'],'note'=>$r['note']??'',
            'items'=>$this->orders->items((int)$r['id']),'subtotal'=>$r['subtotal'],'discount'=>$r['discount'],'shipping'=>$r['shipping_fee'],'total'=>$r['total_amount'],'status'=>$r['status'],'createdAt'=>str_replace(' ','T',$r['created_at']).'Z'];
    }
}
