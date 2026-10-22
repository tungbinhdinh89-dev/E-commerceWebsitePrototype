<?php
declare(strict_types=1);
namespace App\Modules\Article\Services;
use App\Core\ApiException;
use App\Modules\Article\Repositories\ArticleRepository;
use App\Support\Input;
final readonly class ArticleService
{
    public function __construct(private ArticleRepository $articles){}
    public function sections(): array { return $this->articles->sections(); }
    public function listing(array $q=[],bool $admin=false):array{$p=$this->articles->listing($q,$admin);$p['items']=array_map($this->present(...),$p['items']);return $p;}
    public function get(int $id,bool $admin=false):array
    {
        $r=$this->articles->find($id)??throw new ApiException('Không tìm thấy bài viết.',404);
        if(!$admin&&($r['status']!=='published'||$r['published_at']>gmdate('Y-m-d H:i:s')))throw new ApiException('Không tìm thấy bài viết.',404);
        return $this->present($r);
    }
    public function save(array $d,int $actor):void
    {
        $id=empty($d['id'])?null:Input::id($d['id']);if($id)$this->get($id,true);
        $status=match(Input::text($d,'status',20)){'published'=>'published','pending'=>'draft','hidden'=>'hidden',default=>throw new ApiException('Trạng thái không hợp lệ.')};
        $this->articles->save($id,[Input::text($d,'title',200,1),Input::text($d,'body',100000,1),Input::text($d,'extra',150),Input::image($d['image']??''),$status,$actor]);
    }
    public function delete(int $id):void{$this->get($id,true);$this->articles->delete($id);}
    private function present(array $r):array{return ['id'=>(string)$r['id'],'title'=>$r['title'],'body'=>$r['content'],'extra'=>$r['section'],'image'=>$r['thumbnail_path']??'','status'=>$r['status']==='draft'?'pending':$r['status'],'createdAt'=>str_replace(' ','T',$r['created_at']).'Z','userId'=>(string)$r['author_id']];}
}
