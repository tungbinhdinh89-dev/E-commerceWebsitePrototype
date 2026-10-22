<?php
declare(strict_types=1);
namespace App\Modules\Contact\Repositories;
use App\Support\Page;
use App\Support\Input;
use PDO;
final readonly class ContactRepository
{
    public function __construct(private PDO $pdo){}
    public function listing(array $q):array
    {
        $p=Page::pattern(Input::text($q,'q',100));$w="(name LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!' OR message LIKE ? ESCAPE '!')";$params=[$p,$p,$p];
        if(($q['status']??'')!==''){$w.=' AND status=?';$params[]=match($q['status']){'new'=>'unread','resolved'=>'replied',default=>Input::text($q,'status',20)};}
        return Page::query($this->pdo,"SELECT * FROM contacts WHERE $w ORDER BY id DESC","SELECT COUNT(*) FROM contacts WHERE $w",$params,$q);
    }
    public function create(string $name,string $email,string $body):void{$this->pdo->prepare("INSERT INTO contacts(name,email,subject,message) VALUES(?,?,'Liên hệ từ website',?)")->execute([$name,$email,$body]);}
    public function save(int $id,string $name,string $email,string $body,string $status):void{$this->pdo->prepare('UPDATE contacts SET name=?,email=?,message=?,status=? WHERE id=?')->execute([$name,$email,$body,$status,$id]);}
    public function delete(int $id):void{$this->pdo->prepare('DELETE FROM contacts WHERE id=?')->execute([$id]);}
    public function subscribe(string $email):void{$this->pdo->prepare('INSERT INTO newsletter_subscribers(email) VALUES(?)')->execute([$email]);}
    public function subscriberCount():int{return(int)$this->pdo->query('SELECT COUNT(*) FROM newsletter_subscribers')->fetchColumn();}
    public function unread():int{return(int)$this->pdo->query("SELECT COUNT(*) FROM contacts WHERE status='unread'")->fetchColumn();}
}
