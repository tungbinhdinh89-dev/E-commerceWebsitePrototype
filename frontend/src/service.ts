import {
  createSeed,
  type Database,
  type Product,
  type Content,
  type CmsGroup,
  type OrderStatus,
  type User,
  type Order,
} from "./data"

const KEY = "techzone.database.v1"
let memory: Database | null = null
const listeners = new Set<() => void>()
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 320))
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`
async function hash(password: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`techzone-demo:${password}`),
  )
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("")
}
function load(): Database {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        parsed.version === 1 &&
        Array.isArray(parsed.products) &&
        parsed.content
      )
        return (memory = parsed)
    }
  } catch {
    /* An unavailable browser store falls back to the demo in memory. */
  }
  return (memory = createSeed())
}
function commit(next: Database) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    throw new Error(
      "Không thể lưu dữ liệu. Vui lòng cho phép localStorage hoặc giải phóng bộ nhớ trình duyệt.",
    )
  }
  memory = next
  listeners.forEach((listener) => listener())
}
function transaction(change: (next: Database) => void) {
  const next = structuredClone(load())
  change(next)
  commit(next)
}
function current(db = load()) {
  return db.users.find((u) => u.id === db.session && u.active)
}
function requireUser(db = load()) {
  const user = current(db)
  if (!user) throw new Error("Vui lòng đăng nhập để tiếp tục.")
  return user
}
function admin(db = load()) {
  if (requireUser(db).role !== "ADMIN")
    throw new Error("Bạn không có quyền quản trị.")
}
function cartKey(db = load()) {
  return current(db)?.id ?? "guest"
}
function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const api = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  snapshot: load,
  user: current,
  cart(db = load()) {
    return db.carts[cartKey(db)] ?? []
  },
  favorites(db = load()) {
    return db.favorites[cartKey(db)] ?? []
  },
  async login(email: string, password: string) {
    await delay()
    const passwordHash = await hash(password)
    transaction((db) => {
      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.active,
      )
      const seeded =
        user &&
        ["member-demo", "admin-demo"].includes(user.id) &&
        !user.passwordHash
      if (
        !user ||
        (seeded
          ? password !== "Techzone123"
          : user.passwordHash !== passwordHash)
      )
        throw new Error("Email hoặc mật khẩu không chính xác.")
      if (seeded) user.passwordHash = passwordHash
      const combined = [...(db.carts[user.id] ?? []), ...(db.carts.guest ?? [])]
      db.carts[user.id] = [...new Set(combined.map((i) => i.productId))]
        .map((productId) => ({
          productId,
          quantity: combined
            .filter((i) => i.productId === productId)
            .reduce((s, i) => s + i.quantity, 0),
        }))
        .filter(
          (i) =>
            i.quantity > 0 && db.products.some((p) => p.id === i.productId),
        )
      db.carts.guest = []
      db.session = user.id
    })
  },
  async register(name: string, email: string, password: string) {
    await delay()
    if (name.trim().length < 2 || !validEmail(email))
      throw new Error("Vui lòng nhập họ tên và email hợp lệ.")
    if (password.length < 8) throw new Error("Mật khẩu cần ít nhất 8 ký tự.")
    const passwordHash = await hash(password)
    transaction((db) => {
      if (
        db.users.some(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        )
      )
        throw new Error("Email này đã được đăng ký.")
      const id = uid("user")
      db.users.push({
        id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "MEMBER",
        phone: "",
        address: "",
        active: true,
      })
      db.carts[id] = db.carts.guest ?? []
      db.carts.guest = []
      db.session = id
    })
  },
  logout() {
    transaction((db) => {
      db.session = null
    })
  },
  async profile(values: Pick<User, "name" | "phone" | "address">) {
    await delay()
    if (!values.name.trim()) throw new Error("Vui lòng nhập họ tên.")
    transaction((db) => Object.assign(requireUser(db), values))
  },
  async addToCart(productId: string, quantity = 1) {
    await delay()
    transaction((db) => {
      const product = db.products.find((p) => p.id === productId)
      if (!product) throw new Error("Sản phẩm không còn tồn tại.")
      const key = cartKey(db)
      const items = db.carts[key] ?? (db.carts[key] = [])
      const item = items.find((i) => i.productId === productId)
      if ((item?.quantity ?? 0) + quantity > product.stock || quantity < 1)
        throw new Error("Số lượng vượt quá tồn kho.")
      if (item) item.quantity += quantity
      else items.push({ productId, quantity })
    })
  },
  setQuantity(productId: string, quantity: number) {
    transaction((db) => {
      if (!Number.isInteger(quantity) || quantity < 0)
        throw new Error("Số lượng không hợp lệ.")
      const stock = db.products.find((p) => p.id === productId)?.stock ?? 0
      if (quantity > stock)
        throw new Error(`Chỉ còn ${stock} sản phẩm trong kho.`)
      const key = cartKey(db)
      db.carts[key] = (db.carts[key] ?? [])
        .map((i) => (i.productId === productId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    })
  },
  favorite(productId: string) {
    transaction((db) => {
      const key = cartKey(db),
        ids = db.favorites[key] ?? []
      db.favorites[key] = ids.includes(productId)
        ? ids.filter((id) => id !== productId)
        : [...ids, productId]
    })
  },
  quote(coupon = "", db = load()) {
    const subtotal = api
      .cart(db)
      .reduce(
        (sum, i) =>
          sum +
          (db.products.find((p) => p.id === i.productId)?.price ?? 0) *
            i.quantity,
        0,
      )
    const discount =
      coupon.trim().toUpperCase() === "TECHZONE5"
        ? Math.min(Math.round(subtotal * 0.05), 500000)
        : 0
    const shipping =
      subtotal === 0 || subtotal - discount >= db.shipping.freeFrom
        ? 0
        : db.shipping.fee
    return {
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
    }
  },
  async checkout(values: {
    name: string
    phone: string
    address: string
    note: string
    coupon: string
  }) {
    await delay()
    let orderId = ""
    transaction((db) => {
      const user = requireUser(db)
      if (
        !values.name.trim() ||
        !/^(0|\+84)\d{9,10}$/.test(values.phone.replace(/\s/g, "")) ||
        values.address.trim().length < 10
      )
        throw new Error(
          "Vui lòng nhập họ tên, số điện thoại Việt Nam và địa chỉ đầy đủ (ít nhất 10 ký tự).",
        )
      const cart = api.cart(db)
      if (!cart.length) throw new Error("Giỏ hàng đang trống.")
      const items = cart.map((item) => {
        const product = db.products.find((p) => p.id === item.productId)
        if (!product || item.quantity > product.stock)
          throw new Error(
            `Sản phẩm ${product?.name ?? ""} không đủ tồn kho. Vui lòng cập nhật giỏ hàng.`,
          )
        product.stock -= item.quantity
        return {
          productId: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity: item.quantity,
        }
      })
      orderId = uid("TZ").toUpperCase()
      db.orders.unshift({
        ...values,
        ...api.quote(values.coupon, db),
        id: orderId,
        userId: user.id,
        items,
        status: "pending",
        createdAt: new Date().toISOString(),
      })
      db.carts[user.id] = []
      Object.assign(user, {
        name: values.name,
        phone: values.phone,
        address: values.address,
      })
    })
    return orderId
  },
  async orderStatus(id: string, status: OrderStatus) {
    await delay()
    transaction((db) => {
      const user = requireUser(db),
        order = db.orders.find((o) => o.id === id)
      if (!order || (user.role !== "ADMIN" && order.userId !== user.id))
        throw new Error("Không tìm thấy đơn hàng.")
      if (order.status === "cancelled" || order.status === "delivered")
        throw new Error("Đơn hàng đã kết thúc, không thể thay đổi.")
      const next: Partial<Record<OrderStatus, OrderStatus>> = {
        pending: "confirmed",
        confirmed: "shipping",
        shipping: "delivered",
      }
      if (status === "cancelled") {
        if (
          user.role === "MEMBER"
            ? order.status !== "pending"
            : !["pending", "confirmed"].includes(order.status)
        )
          throw new Error("Đơn hàng không còn được phép hủy.")
        // Restock and status change are saved in the same transaction, only once.
        order.items.forEach((item) => {
          const p = db.products.find((p) => p.id === item.productId)
          if (p) p.stock += item.quantity
        })
      } else if (user.role !== "ADMIN" || next[order.status] !== status)
        throw new Error("Chuyển trạng thái không hợp lệ.")
      order.status = status
    })
  },
  async saveProduct(product: Product) {
    await delay()
    transaction((db) => {
      admin(db)
      if (
        !product.name.trim() ||
        !Number.isFinite(product.price) ||
        product.price <= 0 ||
        !Number.isInteger(product.stock) ||
        product.stock < 0 ||
        !Number.isFinite(product.oldPrice) ||
        product.oldPrice < 0
      )
        throw new Error("Tên, giá và tồn kho không hợp lệ.")
      const existing = db.products.find((p) => p.id === product.id)
      if (existing) Object.assign(existing, product)
      else db.products.push({ ...product, id: uid("product") })
    })
  },
  async deleteProduct(id: string) {
    await delay()
    transaction((db) => {
      admin(db)
      if (
        db.orders.some(
          (o) =>
            !["cancelled", "delivered"].includes(o.status) &&
            o.items.some((i) => i.productId === id),
        )
      )
        throw new Error("Không thể xóa sản phẩm thuộc đơn đang xử lý.")
      db.products = db.products.filter((p) => p.id !== id)
      Object.keys(db.carts).forEach((key) => {
        db.carts[key] = db.carts[key].filter((i) => i.productId !== id)
      })
    })
  },
  async toggleUser(id: string) {
    await delay()
    transaction((db) => {
      admin(db)
      if (id === db.session)
        throw new Error("Không thể khóa tài khoản đang đăng nhập.")
      const user = db.users.find((u) => u.id === id)
      if (user) user.active = !user.active
    })
  },
  async saveContent(group: CmsGroup, content: Content) {
    await delay()
    transaction((db) => {
      admin(db)
      if (!content.title.trim() || !content.body.trim())
        throw new Error("Vui lòng nhập tiêu đề và nội dung.")
      if (
        group === "pricing" &&
        (!Number.isFinite(Number(content.extra)) || Number(content.extra) < 0)
      )
        throw new Error("Giá dịch vụ không hợp lệ.")
      const existing = db.content[group].find((c) => c.id === content.id)
      if (existing) Object.assign(existing, content)
      else
        db.content[group].unshift({
          ...content,
          id: uid(group),
          createdAt: new Date().toISOString(),
        })
    })
  },
  async deleteContent(group: CmsGroup, id: string) {
    await delay()
    transaction((db) => {
      admin(db)
      db.content[group] = db.content[group].filter((c) => c.id !== id)
    })
  },
  async shipping(fee: number, freeFrom: number) {
    await delay()
    transaction((db) => {
      admin(db)
      if (![fee, freeFrom].every((v) => Number.isFinite(v) && v >= 0))
        throw new Error("Phí giao hàng không hợp lệ.")
      db.shipping = { fee, freeFrom }
    })
  },
  async comment(articleId: string, body: string) {
    await delay()
    transaction((db) => {
      const user = requireUser(db)
      if (!body.trim()) throw new Error("Vui lòng nhập bình luận.")
      db.content.comments.unshift({
        id: uid("comment"),
        title: user.name,
        body: body.trim(),
        extra: articleId,
        image: "",
        userId: user.id,
        status: "pending",
        createdAt: new Date().toISOString(),
      })
    })
  },
  async contact(name: string, email: string, body: string) {
    await delay()
    if (!name.trim() || !validEmail(email) || body.trim().length < 10)
      throw new Error(
        "Vui lòng nhập tên, email hợp lệ và nội dung ít nhất 10 ký tự.",
      )
    transaction((db) => {
      db.content.contacts.unshift({
        id: uid("contact"),
        title: name.trim(),
        body,
        extra: email.trim(),
        image: "",
        status: "new",
        createdAt: new Date().toISOString(),
      })
    })
  },
  async newsletter(email: string) {
    await delay()
    if (!validEmail(email)) throw new Error("Vui lòng nhập email hợp lệ.")
    transaction((db) => {
      if (db.subscribers.includes(email.toLowerCase()))
        throw new Error("Email của bạn đã được đăng ký.")
      db.subscribers.push(email.toLowerCase())
    })
  },
}

// This is a frontend-only simulation; authorization must be reimplemented on PHP.
export type { Order }
