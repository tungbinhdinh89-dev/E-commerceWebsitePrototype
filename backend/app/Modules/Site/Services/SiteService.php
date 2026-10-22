<?php
declare(strict_types=1);
namespace App\Modules\Site\Services;
use App\Core\ApiException;
use App\Modules\Site\Repositories\SiteRepository;
use App\Support\Input;
use App\Support\Money;

final readonly class SiteService
{
    public function __construct(private SiteRepository $site) {}
    public function shipping(): array
    {
        $values=$this->site->values();
        if(!isset($values['shipping_fee'],$values['shipping_free_from'])) throw new ApiException('Cấu hình giao hàng chưa sẵn sàng.',503);
        return ['fee'=>$values['shipping_fee'],'freeFrom'=>$values['shipping_free_from']];
    }
    public function saveShipping(array $data): void
    {
        $fee=Money::decimal(Money::minor($data['fee']??''));$free=Money::decimal(Money::minor($data['freeFrom']??''));
        $this->site->saveSetting('shipping_fee','Phí giao hàng',$fee,'published');
        $this->site->saveSetting('shipping_free_from','Ngưỡng miễn phí giao hàng',$free,'published');
    }
    public function listing(string $group,array $query=[],bool $admin=false): array
    {
        $result=$this->site->listing($group,$query,$admin);
        $result['items']=array_map(fn($row)=>$this->present($group,$row),$result['items']);return $result;
    }
    public function get(string $group,string $id,bool $admin=false): array
    {
        $row=$this->site->find($group,$id)??throw new ApiException('Không tìm thấy nội dung.',404);
        $record=$this->present($group,$row);
        if(!$admin&&$record['status']!=='published')throw new ApiException('Không tìm thấy nội dung.',404);
        return $record;
    }
    public function save(string $group,array $data,int $actor): void
    {
        $id=Input::text($data,'id',100);$existing=$id!==''?$this->site->find($group,$id):null;
        if($id!==''&&!$existing)throw new ApiException('Không tìm thấy nội dung.',404);
        $title=Input::text($data,'title',200,1);$body=Input::text($data,'body',50000,1);$extra=Input::text($data,'extra',2000);
        if(($group==='settings'&&mb_strlen($title)>150)||($group==='services'&&mb_strlen($extra)>150))throw new ApiException('Nội dung vượt độ dài cho phép.');
        $status=Input::text($data,'status',20);
        if(!in_array($status,['published','pending','hidden'],true))throw new ApiException('Trạng thái không hợp lệ.');
        $image=Input::image($data['image']??'');
        if($group==='company')$this->site->savePage($id!==''?Input::id($id):null,[$title,$body,$extra,$image,match($status){'pending'=>'draft',default=>$status}]);
        elseif(in_array($group,['services','pricing'],true)){
            $price=$group==='pricing'?Money::decimal(Money::minor($extra)):($existing['price']??'0.00');
            $label=$group==='services'?$extra:($existing['price_label']??'');
            $this->site->saveService($id!==''?Input::id($id):null,[$title,$body,$price,$label,$status==='published'?'active':'hidden']);
        }elseif($group==='settings'){
            if(in_array($id,['shipping_fee','shipping_free_from'],true))$body=Money::decimal(Money::minor($body));
            $this->site->saveSetting($id?:'setting-'.bin2hex(random_bytes(5)),$title,$body,$status==='published'?'published':'hidden');
        }else{
            if($image==='')throw new ApiException('Vui lòng tải ảnh lên.');
            $this->site->saveMedia($id!==''?Input::id($id):null,[$title,$body,$image,$status==='published'?'published':'hidden',$actor,'',0]);
        }
    }
    public function media(string $path,string $title,string $mime,int $bytes,int $actor): int
    {
        return $this->site->saveMedia(null,[$title,'Ảnh tải lên',$path,'published',$actor,$mime,$bytes]);
    }
    public function delete(string $group,string $id): void
    {
        if($group==='settings'&&in_array($id,['shipping_fee','shipping_free_from'],true))throw new ApiException('Không thể xóa cấu hình giao hàng.',409);
        $this->get($group,$id,true);$this->site->delete($group,$id);
    }
    private function present(string $group,array $r): array
    {
        $status=match($r['status']){'active','published'=>'published','draft'=>'pending',default=>'hidden'};
        return ['id'=>(string)($group==='settings'?$r['setting_key']:$r['id']),
            'title'=>$r['title']??$r['name'],'body'=>$r['content']??$r['description']??$r['setting_value'],
            'extra'=>$group==='pricing'?(string)$r['price']:($r['extra']??$r['price_label']??''),
            'image'=>$r['image_path']??$r['file_path']??'','status'=>$status,'createdAt'=>str_replace(' ','T',$r['created_at']).'Z'];
    }
}
