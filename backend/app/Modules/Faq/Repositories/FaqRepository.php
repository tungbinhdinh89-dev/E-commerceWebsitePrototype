<?php
declare(strict_types=1);
namespace App\Modules\Faq\Repositories;
use App\Support\Page;
use App\Support\Input;
use PDO;
final readonly class FaqRepository
{
    public function __construct(private PDO $pdo){}
    public function listing(array $q,bool $admin):array
    {
        $w=$admin?'1=1':"status='active'";$p=Page::pattern(Input::text($q,'q',100));$w.=" AND (question LIKE ? ESCAPE '!' OR answer LIKE ? ESCAPE '!')";
        $params=[$p,$p];if(($q['status']??'')!==''){$w.=' AND status=?';$params[]=$q['status']==='published'?'active':'hidden';}
        return Page::query($this->pdo,"SELECT * FROM faqs WHERE $w ORDER BY sort_order,id","SELECT COUNT(*) FROM faqs WHERE $w",$params,$q);
    }
    public function save(?int $id,string $title,string $body,string $status):void
    {
        if($id)$this->pdo->prepare('UPDATE faqs SET question=?,answer=?,status=? WHERE id=?')->execute([$title,$body,$status,$id]);
        else $this->pdo->prepare('INSERT INTO faqs(question,answer,status) VALUES(?,?,?)')->execute([$title,$body,$status]);
    }
    public function delete(int $id):void{$this->pdo->prepare('DELETE FROM faqs WHERE id=?')->execute([$id]);}
}
