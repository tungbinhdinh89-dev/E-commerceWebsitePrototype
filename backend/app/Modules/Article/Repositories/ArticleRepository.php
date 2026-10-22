<?php
declare(strict_types=1);
namespace App\Modules\Article\Repositories;
use App\Support\Page;
use App\Support\Input;
use PDO;
final readonly class ArticleRepository
{
    public function __construct(private PDO $pdo){}
    public function sections(): array
    {
        return $this->pdo->query("SELECT DISTINCT section FROM articles WHERE status='published' AND published_at <= UTC_TIMESTAMP() AND section <> '' ORDER BY section")->fetchAll(PDO::FETCH_COLUMN);
    }
    public function listing(array $query,bool $admin):array
    {
        $where=$admin?'1=1':"status='published' AND published_at <= UTC_TIMESTAMP()";
        $pattern=Page::pattern(Input::text($query,'q',100));
        $where.=" AND (title LIKE ? ESCAPE '!' OR content LIKE ? ESCAPE '!')";$params=[$pattern,$pattern];
        if(($query['section']??'')!==''){$where.=' AND section=?';$params[]=Input::text($query,'section',150);}
        if(($query['status']??'')!==''){$where.=' AND status=?';$params[]=match($query['status']){'pending'=>'draft',default=>Input::text($query,'status',20)};}
        return Page::query($this->pdo,"SELECT * FROM articles WHERE $where ORDER BY created_at DESC,id DESC","SELECT COUNT(*) FROM articles WHERE $where",$params,$query);
    }
    public function find(int $id):?array{$s=$this->pdo->prepare('SELECT * FROM articles WHERE id=?');$s->execute([$id]);return $s->fetch()?:null;}
    public function save(?int $id,array $v):void
    {
        if($id)$this->pdo->prepare('UPDATE articles SET title=?,content=?,section=?,thumbnail_path=?,status=?,published_at=IF(?=\'published\',COALESCE(published_at,UTC_TIMESTAMP()),published_at) WHERE id=?')->execute([...array_slice($v,0,5),$v[4],$id]);
        else $this->pdo->prepare("INSERT INTO articles(title,content,section,thumbnail_path,status,author_id,slug,summary,published_at) VALUES(?,?,?,?,?,?,?,'',IF(?='published',UTC_TIMESTAMP(),NULL))")->execute([...array_slice($v,0,5),$v[5],Input::slug($v[0]).'-'.bin2hex(random_bytes(4)),$v[4]]);
    }
    public function delete(int $id):void{$this->pdo->prepare('DELETE FROM articles WHERE id=?')->execute([$id]);}
}
