<?php
declare(strict_types=1);
use App\Core\Database;
use App\Core\Environment;
use App\Core\Session;
use App\Core\ApiException;
use App\Application;
require __DIR__.'/bootstrap.php';
Environment::load(dirname(__DIR__).'/.env');
$config=require dirname(__DIR__).'/config/database.php';
if(!str_ends_with($config['database'],'_test'))throw new RuntimeException('Workers require a test database.');
$pdo=Database::connect($config);Session::start();Session::signIn((int)$argv[2]);$app=new Application($pdo);
try{
    if($argv[1]==='checkout')$id=$app->orders->checkout(['name'=>'Integration buyer','phone'=>'0900000000','address'=>'Integration test address 123','note'=>'Concurrency test','coupon'=>'']);
    else{$app->orders->status(['id'=>$argv[3],'status'=>'cancelled']);$id=$argv[3];}
    echo json_encode(['ok'=>true,'id'=>$id]);
}catch(ApiException $e){echo json_encode(['ok'=>false,'status'=>$e->status]);}
