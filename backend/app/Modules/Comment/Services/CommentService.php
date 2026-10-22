<?php
declare(strict_types=1);
namespace App\Modules\Comment\Services;
use App\Modules\Comment\Repositories\CommentRepository;
use App\Modules\User\Services\UserService;
use App\Modules\Article\Services\ArticleService;
use App\Support\Input;
use App\Core\ApiException;
final readonly class CommentService
{
    public function __construct(private CommentRepository $comments,private UserService $users,private ArticleService $articles){}
    public function listing(array $q=[],bool $admin=false):array
    {
        $p=$this->comments->listing($q,$admin);$names=$this->users->names(array_column($p['items'],'user_id'));
        $p['items']=array_map(static fn($r)=>['id'=>(string)$r['id'],'title'=>$names[$r['user_id']]??'Thành viên','body'=>$r['content'],'extra'=>(string)$r['article_id'],'image'=>'','status'=>$r['status']==='approved'?'published':$r['status'],'userId'=>(string)$r['user_id'],'createdAt'=>str_replace(' ','T',$r['created_at']).'Z'],$p['items']);return $p;
    }
    public function create(array $d):void{$u=$this->users->requireUser();$id=Input::id($d['articleId']??null);$this->articles->get($id);$this->comments->create($id,(int)$u['id'],Input::text($d,'body',10000,1));}
    public function save(array $d):void
    {
        $this->users->requireAdmin();$status=match(Input::text($d,'status',20)){'published'=>'approved','pending'=>'pending','hidden'=>'hidden',default=>throw new ApiException('Trạng thái không hợp lệ.')};
        $this->comments->save(Input::id($d['id']??null),Input::text($d,'body',10000,1),$status);
    }
    public function delete(int $id):void{$this->users->requireAdmin();$this->comments->delete($id);}
    public function pending():int{return $this->comments->pending();}
}
