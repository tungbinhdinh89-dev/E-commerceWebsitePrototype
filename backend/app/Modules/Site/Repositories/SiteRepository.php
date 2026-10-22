<?php
declare(strict_types=1);
namespace App\Modules\Site\Repositories;
use App\Support\Page;
use App\Support\Input;
use PDO;

final readonly class SiteRepository
{
    public function __construct(private PDO $pdo) {}
    public function settings(): array { return $this->pdo->query("SELECT * FROM site_settings WHERE status='published' ORDER BY id")->fetchAll(); }
    public function values(): array { return $this->pdo->query("SELECT setting_key,setting_value FROM site_settings WHERE status='published'")->fetchAll(PDO::FETCH_KEY_PAIR); }
    public function listing(string $group, array $query, bool $admin): array
    {
        [$table,$title,$visible] = match($group) {
            'company'=>['pages','title',"status='published'"],
            'services','pricing'=>['services','name',"status='active'"],
            'settings'=>['site_settings','title',"status='published'"],
            'media'=>['site_media','title',"status='published'"],
        };
        $where = $admin ? '1=1' : $visible;
        $q = Input::text($query,'q',100);
        $params=[];
        if ($q!=='') { $where.=" AND $title LIKE ? ESCAPE '!'"; $params[]=Page::pattern($q); }
        if(($query['status']??'')!==''){
            $where.=' AND status=?';$status=Input::text($query,'status',20);
            $params[]=in_array($group,['services','pricing'],true)?($status==='published'?'active':'hidden'):($group==='company'&&$status==='pending'?'draft':$status);
        }
        return Page::query($this->pdo,"SELECT * FROM $table WHERE $where ORDER BY id DESC","SELECT COUNT(*) FROM $table WHERE $where",$params,$query);
    }
    public function find(string $group, string $id): ?array
    {
        [$table,$column]=match($group){'company'=>['pages','id'],'services','pricing'=>['services','id'],'settings'=>['site_settings','setting_key'],'media'=>['site_media','id']};
        $stmt=$this->pdo->prepare("SELECT * FROM $table WHERE $column=?");$stmt->execute([$id]);return $stmt->fetch()?:null;
    }
    public function savePage(?int $id,array $v): void
    {
        if($id) $this->pdo->prepare('UPDATE pages SET title=?,content=?,extra=?,image_path=?,status=? WHERE id=?')->execute([...$v,$id]);
        else $this->pdo->prepare('INSERT INTO pages(title,content,extra,image_path,status,slug) VALUES(?,?,?,?,?,?)')->execute([...$v,Input::slug($v[0]).'-'.bin2hex(random_bytes(4))]);
    }
    public function saveService(?int $id,array $v): void
    {
        if($id) $this->pdo->prepare('UPDATE services SET name=?,description=?,price=?,price_label=?,status=? WHERE id=?')->execute([...$v,$id]);
        else $this->pdo->prepare('INSERT INTO services(name,description,price,price_label,status,slug) VALUES(?,?,?,?,?,?)')->execute([...$v,Input::slug($v[0]).'-'.bin2hex(random_bytes(4))]);
    }
    public function saveSetting(string $key,string $title,string $value,string $status): void
    {
        $this->pdo->prepare('INSERT INTO site_settings(setting_key,title,setting_value,status) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE title=?,setting_value=?,status=?')->execute([$key,$title,$value,$status,$title,$value,$status]);
    }
    public function saveMedia(?int $id,array $v): int
    {
        if($id){$this->pdo->prepare('UPDATE site_media SET title=?,description=?,file_path=?,status=? WHERE id=?')->execute([...array_slice($v,0,4),$id]);return $id;}
        $this->pdo->prepare('INSERT INTO site_media(title,description,file_path,status,uploaded_by,mime_type,size_bytes) VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id),title=?,description=?,status=?')->execute([...$v,$v[0],$v[1],$v[3]]);
        return (int)$this->pdo->lastInsertId();
    }
    public function delete(string $group,string $id): void
    {
        [$table,$column]=match($group){'company'=>['pages','id'],'services','pricing'=>['services','id'],'settings'=>['site_settings','setting_key'],'media'=>['site_media','id']};
        $this->pdo->prepare("DELETE FROM $table WHERE $column=?")->execute([$id]);
    }
}
