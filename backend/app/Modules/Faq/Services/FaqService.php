<?php
declare(strict_types=1);
namespace App\Modules\Faq\Services;
use App\Modules\Faq\Repositories\FaqRepository;
use App\Support\Input;
final readonly class FaqService
{
    public function __construct(private FaqRepository $faqs){}
    public function listing(array $q=[],bool $admin=false):array
    {
        $p=$this->faqs->listing($q,$admin);$p['items']=array_map(static fn($r)=>['id'=>(string)$r['id'],'title'=>$r['question'],'body'=>$r['answer'],'extra'=>'','image'=>'','status'=>$r['status']==='active'?'published':'hidden','createdAt'=>str_replace(' ','T',$r['created_at']).'Z'],$p['items']);return $p;
    }
    public function save(array $d):void{$this->faqs->save(empty($d['id'])?null:Input::id($d['id']),Input::text($d,'title',255,1),Input::text($d,'body',50000,1),Input::text($d,'status',20)==='published'?'active':'hidden');}
    public function delete(int $id):void{$this->faqs->delete($id);}
}
