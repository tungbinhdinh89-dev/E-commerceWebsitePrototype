import type { ReactNode } from "react"
import { Button, IconButton } from "@figma/astraui"
import {
  Cpu,
  CircuitBoard,
  Monitor,
  MemoryStick,
  HardDrive,
  Power,
  PcCase,
  Fan,
  Keyboard,
  Gamepad2,
  ShoppingCart,
  Heart,
  ChevronRight,
  Minus,
  Plus,
  PackageSearch,
} from "lucide-react"
import { categories, money, type Product } from "./data"

export const categoryIcons = {
  cpu: Cpu,
  mainboard: CircuitBoard,
  gpu: Monitor,
  ram: MemoryStick,
  ssd: HardDrive,
  psu: Power,
  case: PcCase,
  cooling: Fan,
  monitor: Monitor,
  accessories: Keyboard,
  pc: Gamepad2,
}
export function go(path: string) {
  window.location.hash = path
  window.scrollTo({ top: 0, behavior: "smooth" })
}
export function Title({
  children,
  sub,
  action,
}: {
  children: ReactNode
  sub?: string
  action?: ReactNode
}) {
  return (
    <div className="section-title">
      <div>
        <div role="heading" aria-level={2} className="text-title">
          {children}
        </div>
        {sub && <p className="text-label-sm muted mt-xs">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
export function NavLink({
  to,
  children,
  className = "",
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Button
      variant="subtle"
      className={`text-link ${className}`}
      onClick={() => go(to)}
    >
      {children}
    </Button>
  )
}
export function ProductImage({
  product,
  className = "",
}: {
  product: Pick<Product, "image" | "name" | "category">
  className?: string
}) {
  const Fallback =
    categoryIcons[(product.category as keyof typeof categoryIcons)] ?? Monitor
  return (
    <div className={`product-visual ${className}`}>
      <Fallback className="product-fallback" strokeWidth={1} />
      <img
        src={product.image.replace(
          /^\/images\/([a-z-]+)\.png$/,
          "/images/$1.webp",
        )}
        alt={product.name}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.hidden = true
        }}
      />
    </div>
  )
}
export function ProductCard({
  product,
  add,
  favorite,
  liked,
}: {
  product: Product
  add: () => void
  favorite: () => void
  liked: boolean
}) {
  const discount =
    product.oldPrice > product.price
      ? Math.round((1 - product.price / product.oldPrice) * 100)
      : 0
  return (
    <article className="product-card">
      <div className="product-top">
        <span className="discount">{discount ? `-${discount}%` : "Mới"}</span>
        <IconButton
          variant="subtle"
          size="small"
          aria-label={liked ? "Bỏ yêu thích" : "Yêu thích"}
          className={liked ? "favorite is-liked" : "favorite"}
          icon={<Heart size={16} fill={liked ? "currentColor" : "none"} />}
          onClick={favorite}
        />
      </div>
      <Button
        variant="subtle"
        className="product-image-button"
        onClick={() => go(`/product/${product.id}`)}
      >
        <ProductImage product={product} />
      </Button>
      <div className="product-brand">{product.brand}</div>
      <Button
        variant="subtle"
        className="product-name"
        onClick={() => go(`/product/${product.id}`)}
      >
        {product.name}
      </Button>
      <div className="product-specs">
        {product.specs.slice(0, 2).map((spec) => (
          <span key={spec}>{spec}</span>
        ))}
      </div>
      <div className="price-old">
        {product.oldPrice > product.price ? (
          money(product.oldPrice)
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
      <div className="product-bottom">
        <div>
          <div className="price">{money(product.price)}</div>
          <div className={`stock ${product.stock ? "" : "out"}`}>
            <span className="status-dot" />
            {product.stock ? "Còn hàng" : "Hết hàng"}
          </div>
        </div>
        <IconButton
          aria-label={`Thêm ${product.name} vào giỏ`}
          variant="neutral"
          className="add-cart"
          icon={<ShoppingCart size={18} />}
          onClick={add}
          disabled={!product.stock}
        />
      </div>
    </article>
  )
}
export function Quantity({
  value,
  change,
  max,
}: {
  value: number
  change: (n: number) => void
  max: number
}) {
  return (
    <div className="quantity">
      <IconButton
        size="small"
        variant="subtle"
        aria-label="Giảm số lượng"
        disabled={value <= 1}
        onClick={() => change(value - 1)}
        icon={<Minus size={14} />}
      />
      <span>{value}</span>
      <IconButton
        size="small"
        variant="subtle"
        aria-label="Tăng số lượng"
        disabled={value >= max}
        onClick={() => change(value + 1)}
        icon={<Plus size={14} />}
      />
    </div>
  )
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <PackageSearch size={48} strokeWidth={1} />
      <div role="heading" aria-level={2} className="text-heading">
        {title}
      </div>
      <p className="muted">{body}</p>
      {action}
    </div>
  )
}
export function Breadcrumb({ name }: { name: string }) {
  return (
    <div className="breadcrumb">
      <NavLink to="/">Trang chủ</NavLink>
      <ChevronRight size={14} />
      <span>{name}</span>
    </div>
  )
}
export function categoryName(id: string) {
  return categories.find((c) => c.id === id)?.short ?? id
}
