<?php
declare(strict_types=1);
namespace App\Modules\Contact\Services;
use App\Modules\Contact\Repositories\ContactRepository;
use App\Core\ApiException;
use App\Support\Input;
final readonly class ContactService
{
    public function __construct(private ContactRepository $contacts){}
    public function listing(array $q=[]):array
    {
        $p=$this->contacts->listing($q);$p['items']=array_map(static fn($r)=>['id'=>(string)$r['id'],'title'=>$r['name'],'body'=>$r['message'],'extra'=>$r['email'],'image'=>'','status'=>match($r['status']){'unread'=>'new','read'=>'read','replied'=>'resolved'},'createdAt'=>str_replace(' ','T',$r['created_at']).'Z'],$p['items']);return $p;
    }
    public function create(array $d):void{$this->contacts->create(Input::text($d,'name',150,2),Input::email($d),Input::text($d,'body',20000,10));}
    public function save(array $d):void
    {
        $status=match(Input::text($d,'status',20)){'new'=>'unread','read'=>'read','resolved'=>'replied',default=>throw new ApiException('Trạng thái không hợp lệ.')};
        $this->contacts->save(Input::id($d['id']??null),Input::text($d,'title',150,1),Input::email($d,'extra'),Input::text($d,'body',20000,1),$status);
    }
    public function delete(int $id):void{$this->contacts->delete($id);}
    public function subscribe(array $d):void
    {
        try{$this->contacts->subscribe(Input::email($d));}
        catch(\PDOException $e){if(($e->errorInfo[1]??null)===1062)throw new ApiException('Email của bạn đã được đăng ký.',409);throw $e;}
    }
    public function stats():array{return ['subscribers'=>$this->contacts->subscriberCount(),'unreadContacts'=>$this->contacts->unread()];}
}
