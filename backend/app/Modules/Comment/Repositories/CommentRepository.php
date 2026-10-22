<?php
declare(strict_types=1);
namespace App\Modules\Comment\Repositories;
use App\Support\Page;
use PDO;
final readonly class CommentRepository
{
    public function __construct(private PDO $pdo){}
    public function listing(array $q,bool $admin):array
    {
        $where=$admin?'1=1':"status='approved'";$p=[];
        if(($q['q']??'')!==''){$where.=" AND content LIKE ? ESCAPE '!'";$p[]=Page::pattern(\App\Support\Input::text($q,'q',100));}
        if(($q['status']??'')!==''){$where.=' AND status=?';$p[]=match($q['status']){'published'=>'approved',default=>\App\Support\Input::text($q,'status',20)};}
        if(!empty($q['articleId'])){$where.=' AND article_id=?';$p[]=\App\Support\Input::id($q['articleId']);}
        return Page::query($this->pdo,"SELECT * FROM comments WHERE $where ORDER BY id DESC","SELECT COUNT(*) FROM comments WHERE $where",$p,$q);
    }
    public function create(int $article,int $user,string $body):void{$this->pdo->prepare('INSERT INTO comments(article_id,user_id,content) VALUES(?,?,?)')->execute([$article,$user,$body]);}
    public function save(int $id,string $body,string $status):void{$this->pdo->prepare('UPDATE comments SET content=?,status=? WHERE id=?')->execute([$body,$status,$id]);}
    public function delete(int $id):void{$this->pdo->prepare('DELETE FROM comments WHERE id=?')->execute([$id]);}
    public function pending():int{return(int)$this->pdo->query("SELECT COUNT(*) FROM comments WHERE status='pending'")->fetchColumn();}
}
