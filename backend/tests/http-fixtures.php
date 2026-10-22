<?php
declare(strict_types=1);
use App\Core\Database;
use App\Core\Environment;
use App\Core\Migrator;
use App\Application;
use App\Modules\User\Repositories\UserRepository;
require __DIR__.'/bootstrap.php';
Environment::load(dirname(__DIR__).'/.env');
$config=require dirname(__DIR__).'/config/database.php';
if(!str_ends_with($config['database'],'_test'))throw new RuntimeException('HTTP fixtures require a test database.');
$token=$argv[2]??'';
if(!preg_match('/^[a-f0-9]{16}$/D',$token))throw new RuntimeException('Invalid fixture token.');
$pdo=Database::connect($config);$app=new Application($pdo);
$prefix='it-'.$token.'-';
if(($argv[1]??'')==='setup'){
    (new Migrator($pdo,dirname(__DIR__).'/database/migrations'))->run();
    $users=new UserRepository($pdo);
    $seedUser=$users->byEmail('seed-owner@example.invalid');
    $seedOwner=$seedUser?(int)$seedUser['id']:$users->create('Test seed owner','seed-owner@example.invalid',password_hash(bin2hex(random_bytes(24)),PASSWORD_DEFAULT),'admin');
    $seed=require dirname(__DIR__).'/database/seeders/store.php';$seed($pdo,$seedOwner);
    $password=bin2hex(random_bytes(16)).'Aa9!';$email=$prefix.'admin@example.invalid';
    $admin=$users->create('Integration administrator',$email,password_hash($password,PASSWORD_DEFAULT),'admin');
    $name=$prefix.'product';
    $app->catalog->save(['id'=>'','name'=>$name,'brand'=>'Integration','category'=>$app->catalog->categories()[0]['id'],'price'=>'100000.00','oldPrice'=>'120000.00','stock'=>5,'image'=>'/assets/images/cpu-intel.webp','specs'=>['Integration fixture'],'featured'=>true]);
    $product=$app->catalog->listing(['q'=>$name])['items'][0];
    echo json_encode(['email'=>$email,'password'=>$password,'adminId'=>$admin,'product'=>$product,'shipping'=>$app->site->shipping()],JSON_THROW_ON_ERROR);
}elseif(($argv[1]??'')==='cleanup'){
    $q=$pdo->prepare('SELECT id FROM users WHERE email LIKE ?');$q->execute([$prefix.'%@example.invalid']);$ids=$q->fetchAll(PDO::FETCH_COLUMN);
    if($ids!==[]){
        $marks=implode(',',array_fill(0,count($ids),'?'));
        $pdo->prepare('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN ('.$marks.'))')->execute($ids);
        $pdo->prepare('DELETE FROM orders WHERE user_id IN ('.$marks.')')->execute($ids);
        $pdo->prepare('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id IN ('.$marks.'))')->execute($ids);
        $pdo->prepare('DELETE FROM carts WHERE user_id IN ('.$marks.')')->execute($ids);
        $pdo->prepare('DELETE FROM comments WHERE user_id IN ('.$marks.')')->execute($ids);
        $pdo->prepare('DELETE FROM articles WHERE author_id IN ('.$marks.')')->execute($ids);
        $files=$pdo->prepare('SELECT file_path FROM site_media WHERE uploaded_by IN ('.$marks.')');$files->execute($ids);
        foreach($files->fetchAll(PDO::FETCH_COLUMN)as$path){
            if(preg_match('~^/uploads/site/[a-f0-9]{32}\.(jpg|png|webp)$~D',$path)){
                $file=dirname(__DIR__).'/public'.$path;if(is_file($file))unlink($file);
            }
        }
        $pdo->prepare('DELETE FROM site_media WHERE uploaded_by IN ('.$marks.')')->execute($ids);
        $pdo->prepare('DELETE FROM users WHERE id IN ('.$marks.')')->execute($ids);
    }
    $pdo->prepare('DELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE name LIKE ?)')->execute([$prefix.'%']);
    $pdo->prepare('DELETE FROM products WHERE name LIKE ?')->execute([$prefix.'%']);
    $pdo->prepare('DELETE FROM contacts WHERE email LIKE ?')->execute([$prefix.'%@example.invalid']);
    $pdo->prepare('DELETE FROM newsletter_subscribers WHERE email LIKE ?')->execute([$prefix.'%@example.invalid']);
    $pdo->prepare('DELETE FROM pages WHERE title LIKE ?')->execute([$prefix.'%']);
    $pdo->prepare('DELETE FROM services WHERE name LIKE ?')->execute([$prefix.'%']);
    $pdo->prepare('DELETE FROM site_settings WHERE title LIKE ?')->execute([$prefix.'%']);
    echo 'Test fixtures cleaned.';
}
