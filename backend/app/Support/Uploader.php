<?php
declare(strict_types=1);
namespace App\Support;
use App\Core\ApiException;
final class Uploader
{
    public static function image(array $file):array
    {
        if(($file['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK||!is_uploaded_file($file['tmp_name']??''))throw new ApiException('Không thể tải ảnh. Giới hạn 5 MB.');
        if((int)$file['size']<1||(int)$file['size']>5*1024*1024)throw new ApiException('Ảnh phải nhỏ hơn hoặc bằng 5 MB.');
        $mime=(new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $extension=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime]??null;
        $dimensions=@getimagesize($file['tmp_name']);
        if(!$extension||!$dimensions||$dimensions[0]*$dimensions[1]>40000000)throw new ApiException('Chỉ nhận ảnh JPG, PNG hoặc WebP hợp lệ.');
        $directory=dirname(__DIR__,2).'/public/uploads/site';
        if(!is_dir($directory))mkdir($directory,0755,true);
        $name=bin2hex(random_bytes(16)).'.'.$extension;
        if(!move_uploaded_file($file['tmp_name'],$directory.'/'.$name))throw new ApiException('Không thể lưu ảnh.',503);
        return ['path'=>'/uploads/site/'.$name,'mime'=>$mime,'size'=>(int)$file['size']];
    }
}
