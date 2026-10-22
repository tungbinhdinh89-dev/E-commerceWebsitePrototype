<?php

declare(strict_types=1);

namespace App\Modules\Product\Services;

use App\Core\ApiException;
use App\Modules\Product\Repositories\CatalogRepository;
use App\Support\Input;
use App\Support\Money;
use PDO;

final readonly class CatalogService
{
    public function __construct(private PDO $pdo, private CatalogRepository $products) {}

    public function categories(): array
    {
        return array_map(static fn (array $r) => ['id'=>$r['slug'],'name'=>$r['name'], 'short'=>$r['short_name'] ?: $r['name'],'detail'=>$r['detail']], $this->products->categories());
    }
    public function listing(array $query = [], bool $admin = false): array
    {
        $result = $this->products->listing($query, $admin);
        $result['items'] = array_map($this->present(...), $result['items']);
        return $result;
    }
    public function get(int $id, bool $admin = false): array
    {
        $row = $this->products->byIds([$id])[0] ?? null;
        if (!$row || (!$admin && ($row['status'] !== 'active' || $row['category_status'] !== 'active'))) throw new ApiException('Không tìm thấy sản phẩm.', 404);
        return $this->present($row);
    }
    public function related(array $ids): array { return array_map($this->present(...), $this->products->byIds($ids)); }
    public function save(array $data): void
    {
        $id = empty($data['id']) ? null : Input::id($data['id']);
        if ($id) $this->get($id, true);
        $name = Input::text($data, 'name', 200, 2);
        $category = $this->products->category(Input::text($data, 'category', 180, 1)) ?? throw new ApiException('Danh mục không tồn tại.');
        $specs = $data['specs'] ?? [];
        if (!is_array($specs) || count($specs) > 50) throw new ApiException('Thông số không hợp lệ.');
        foreach ($specs as $spec) if (!is_string($spec) || mb_strlen($spec) > 300) throw new ApiException('Thông số không hợp lệ.');
        if (!is_bool($data['featured'] ?? null)) throw new ApiException('Trạng thái nổi bật không hợp lệ.');
        $image = Input::image($data['image'] ?? '');
        $values = [$category,$name,Input::text($data,'brand',100,1),Money::decimal(Money::minor($data['price'] ?? '')),
            Money::decimal(Money::minor($data['oldPrice'] ?? '0')),Input::integer($data['stock'] ?? null,0,100000000),implode("\n",$specs),(int)$data['featured']];
        $this->pdo->beginTransaction();
        try { $id = $this->products->save($id,$values); $this->products->image($id,$image,$name); $this->pdo->commit(); }
        catch (\Throwable $error) { $this->pdo->rollBack(); throw $error; }
    }
    public function delete(int $id): void { $this->get($id,true); $this->products->discontinue($id); }
    public function lock(array $ids): array
    {
        if (!$this->pdo->inTransaction()) throw new \LogicException('Inventory operations require the Sales transaction.');
        $result = [];
        foreach ($this->products->byIds($ids,true) as $row) $result[(int)$row['id']]=$row;
        return $result;
    }
    public function reserve(array $items): array
    {
        $rows = $this->lock(array_map(static fn($i)=>(int)$i['productId'],$items));
        $result = [];
        foreach ($items as $item) {
            $row = $rows[(int)$item['productId']] ?? null;
            $quantity = Input::integer($item['quantity'],1,10000);
            if (!$row || $row['status'] !== 'active' || $row['category_status'] !== 'active' || (int)$row['stock'] < $quantity) throw new ApiException('Sản phẩm không còn đủ tồn kho.',409);
            $this->products->decrement((int)$row['id'],$quantity);
            $result[] = ['productId'=>(int)$row['id'],'name'=>$row['name'],'sku'=>$row['sku'],'price'=>(string)$row['price'],'image'=>$row['image'],'quantity'=>$quantity];
        }
        return $result;
    }
    public function restore(array $items): void
    {
        $this->lock(array_map(static fn($i)=>(int)$i['productId'],$items));
        foreach ($items as $item) $this->products->restore((int)$item['productId'],(int)$item['quantity']);
    }
    public function stats(): array { return $this->products->stats(); }
    public function brands(): array { return $this->products->brands(); }
    private function present(array $row): array
    {
        return ['id'=>(string)$row['id'],'name'=>$row['name'],'brand'=>$row['brand'],'category'=>$row['category_slug'],
            'price'=>(string)$row['price'],'oldPrice'=>(string)$row['old_price'],'stock'=>(int)$row['stock'],
            'image'=>$row['image'] ?? '', 'specs'=>preg_split('/\r?\n/', $row['specifications'] ?? '',-1,PREG_SPLIT_NO_EMPTY),
            'featured'=>(bool)$row['featured'], 'status'=>$row['status']];
    }
}
