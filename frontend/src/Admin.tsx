import { useState, type CSSProperties } from "react"
import {
  Button,
  IconButton,
  SelectField,
  Modal,
  Badge,
  Checkbox,
} from "@figma/astraui"
import { InputField, TextareaField } from "./fields"
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Users,
  FileText,
  MessageCircle,
  Mail,
  HelpCircle,
  Settings,
  Image,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Plus,
  Search,
  Pencil,
  Trash2,
  Zap,
  BarChart3,
  ShieldCheck,
  Menu,
  DollarSign,
  Globe,
  Wrench,
} from "lucide-react"
import { useShop } from "./shop-context"
import { api } from "./service"
import {
  categories,
  cmsGroups,
  money,
  orderLabels,
  type CmsGroup,
  type Content,
  type Product,
} from "./data"
import { Empty, go, ProductImage, Title, categoryName } from "./ui"
import { OrderCard } from "./StorePages"

type Section = "dashboard" | "products" | "orders" | "users" | CmsGroup
const contentIcons = {
  articles: FileText,
  comments: MessageCircle,
  contacts: Mail,
  faqs: HelpCircle,
  company: Globe,
  services: Wrench,
  pricing: DollarSign,
  settings: Settings,
  media: Image,
}
const contentStatusLabels = {
  published: "Đã xuất bản",
  pending: "Chờ duyệt",
  hidden: "Ẩn / Bản nháp",
  new: "Mới tiếp nhận",
  resolved: "Đã xử lý",
}
const emptyContent: Content = {
  id: "",
  title: "",
  body: "",
  extra: "",
  image: "",
  status: "published",
  createdAt: "",
}
const blankProduct: Product = {
  id: "",
  name: "",
  brand: "",
  category: "cpu",
  price: 0,
  oldPrice: 0,
  stock: 0,
  image: "",
  specs: [],
  featured: true,
}

function Dashboard({ navigate }: { navigate: (s: Section) => void }) {
  const { db } = useShop()
  const revenue = db.orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total, 0)
  const pending = db.orders.filter((o) => o.status === "pending").length
  const metrics = [
    {
      icon: DollarSign,
      title: "Doanh thu đã hoàn thành",
      value: money(revenue),
      note: "Chỉ tính đơn giao thành công",
      section: "orders",
    },
    {
      icon: ShoppingCart,
      title: "Tổng đơn hàng",
      value: db.orders.length,
      note: `${pending} đơn đang chờ xác nhận`,
      section: "orders",
    },
    {
      icon: Package,
      title: "Sản phẩm đang bán",
      value: db.products.length,
      note: `${db.products.filter((p) => p.stock < 5).length} sản phẩm sắp hết hàng`,
      section: "products",
    },
    {
      icon: Users,
      title: "Thành viên",
      value: db.users.filter((u) => u.role === "MEMBER").length,
      note: `${db.subscribers.length} email đăng ký nhận tin`,
      section: "users",
    },
  ]
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })
  const counts = dates.map(
    (d) =>
      db.orders.filter(
        (o) => new Date(o.createdAt).toDateString() === d.toDateString(),
      ).length,
  )
  return (
    <>
      <div className="admin-welcome">
        <div>
          <span className="eyebrow">TỔNG QUAN HOẠT ĐỘNG</span>
          <div role="heading" aria-level={1}>
            Chào ngày mới, TechZone.
          </div>
          <p className="muted">
            Mọi điều bạn cần để vận hành cửa hàng, ở ngay đây.
          </p>
        </div>
        <Button
          iconStart={<Plus size={16} />}
          onClick={() => navigate("products")}
        >
          Quản lý sản phẩm
        </Button>
      </div>
      <div className="metric-grid">
        {metrics.map(({ icon: Icon, title, value, note, section }) => (
          <Button
            key={title}
            variant="subtle"
            className="metric-card"
            onClick={() => navigate(section as Section)}
          >
            <span className="metric-top">
              {title}
              <Icon size={21} />
            </span>
            <strong>{value}</strong>
            <span className="muted">{note}</span>
          </Button>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="surface">
          <Title sub="Số đơn hàng phát sinh trong 7 ngày gần nhất">
            Hoạt động bán hàng
          </Title>
          <div className="bar-chart">
            {dates.map((date, i) => (
              <div className="chart-column" key={i}>
                <span>{counts[i]}</span>
                <div className="chart-bar-track">
                  <div
                    className="chart-bar"
                    style={
                      {
                        "--bar-height": `${(counts[i] / Math.max(1, ...counts)) * 100}%`,
                      } as CSSProperties
                    }
                  />
                </div>
                <span>
                  {date.getDate()}/{date.getMonth() + 1}
                </span>
              </div>
            ))}
          </div>
          {!db.orders.length && (
            <p className="chart-caption">
              Chưa có đơn hàng. Đặt thử một đơn tại cửa hàng để xem dữ liệu thực
              tế.
            </p>
          )}
        </section>
        <section className="surface">
          <Title>Việc cần xử lý</Title>
          {[
            {
              title: "Đơn hàng chờ xác nhận",
              count: pending,
              section: "orders",
            },
            {
              title: "Bình luận chờ kiểm duyệt",
              count: db.content.comments.filter((c) => c.status === "pending")
                .length,
              section: "comments",
            },
            {
              title: "Yêu cầu liên hệ mới",
              count: db.content.contacts.filter((c) => c.status === "new")
                .length,
              section: "contacts",
            },
            {
              title: "Sản phẩm sắp hết hàng",
              count: db.products.filter((p) => p.stock < 5).length,
              section: "products",
            },
          ].map((item) => (
            <Button
              key={item.title}
              className="task-row"
              variant="subtle"
              onClick={() => navigate(item.section as Section)}
            >
              <span>{item.title}</span>
              <Badge
                label={String(item.count)}
                variant={item.count ? "warning" : "secondary"}
              />
              <ArrowRight size={16} />
            </Button>
          ))}
          <div className="admin-demo-note">
            <ShieldCheck size={22} />
            <strong>Không có dữ liệu giả trong báo cáo</strong>
            <p>
              Thống kê được tính từ đơn hàng và dữ liệu hiện có trong trình
              duyệt.
            </p>
          </div>
        </section>
      </div>
      <section className="surface">
        <Title
          action={
            <Button variant="subtle" onClick={() => navigate("orders")}>
              Xem tất cả <ArrowRight size={16} />
            </Button>
          }
        >
          Đơn hàng gần đây
        </Title>
        {db.orders.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {db.orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.name}</td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>{money(order.total)}</td>
                    <td>
                      <Badge
                        label={orderLabels[order.status]}
                        variant={
                          order.status === "delivered" ? "success" : "warning"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Sẵn sàng cho đơn hàng đầu tiên"
            body="Đơn hàng mới sẽ xuất hiện tại đây."
            action={
              <Button variant="neutral" onClick={() => go("/products")}>
                Đến cửa hàng <ArrowUpRight size={16} />
              </Button>
            }
          />
        )}
      </section>
    </>
  )
}
function Products() {
  const { db, act, busy } = useShop()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const products = db.products.filter(
    (p) =>
      (!category || p.category === category) &&
      `${p.name} ${p.brand}`.toLowerCase().includes(query.toLowerCase()),
  )
  function field<K extends keyof Product>(key: K, value: Product[K]) {
    setEditing((p) => (p ? { ...p, [key]: value } : null))
  }
  return (
    <>
      <Title
        sub="Quản lý thông tin, giá bán và tồn kho."
        action={
          <Button
            iconStart={<Plus size={16} />}
            onClick={() => setEditing({ ...blankProduct })}
          >
            Thêm sản phẩm
          </Button>
        }
      >
        Sản phẩm <span className="muted">({db.products.length})</span>
      </Title>
      <div className="surface">
        <div className="admin-toolbar">
          <InputField
            aria-label="Tìm sản phẩm"
            placeholder="Tìm theo tên, thương hiệu..."
            value={query}
            onChange={setQuery}
            prefix={<Search size={16} />}
          />
          <SelectField
            value={category}
            onChange={setCategory}
            options={[
              { value: "", label: "Tất cả danh mục" },
              ...categories.map((c) => ({ value: c.id, label: c.short })),
            ]}
          />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Nổi bật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <ProductImage product={p} />
                      <div>
                        <strong>{p.name}</strong>
                        <small>
                          {p.brand} · {p.id}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{categoryName(p.category)}</td>
                  <td>
                    <strong>{money(p.price)}</strong>
                    <small>
                      <del>{money(p.oldPrice)}</del>
                    </small>
                  </td>
                  <td>
                    <Badge
                      label={String(p.stock)}
                      variant={
                        p.stock > 4 ? "success" : p.stock ? "warning" : "danger"
                      }
                    />
                  </td>
                  <td>{p.featured ? "Có" : "Không"}</td>
                  <td>
                    <div className="flex gap-md">
                      <IconButton
                        variant="subtle"
                        aria-label={`Sửa ${p.name}`}
                        icon={<Pencil size={16} />}
                        onClick={() => setEditing(structuredClone(p))}
                      />
                      <IconButton
                        variant="subtle"
                        aria-label={`Xóa ${p.name}`}
                        icon={<Trash2 size={16} />}
                        onClick={() => setDeleting(p)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && (
            <Empty
              title="Không tìm thấy sản phẩm"
              body="Hãy thay đổi từ khóa hoặc danh mục."
            />
          )}
        </div>
      </div>
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        size="large"
        className="tz-modal"
      >
        {editing && (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              void act(async () => {
                await api.saveProduct(editing)
                setEditing(null)
              }, "Đã lưu sản phẩm.")
            }}
          >
            <InputField
              label="Tên sản phẩm"
              required
              value={editing.name}
              onChange={(v) => field("name", v)}
            />
            <div className="form-two">
              <InputField
                label="Thương hiệu"
                required
                value={editing.brand}
                onChange={(v) => field("brand", v)}
              />
              <SelectField
                label="Danh mục"
                value={editing.category}
                onChange={(v) => field("category", v)}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.short,
                }))}
              />
            </div>
            <div className="form-two">
              <InputField
                label="Giá bán (₫)"
                type="number"
                min={1}
                required
                value={String(editing.price)}
                onChange={(v) => field("price", Number(v))}
              />
              <InputField
                label="Giá niêm yết (₫)"
                type="number"
                min={0}
                required
                value={String(editing.oldPrice)}
                onChange={(v) => field("oldPrice", Number(v))}
              />
            </div>
            <InputField
              label="Số lượng tồn kho"
              type="number"
              min={0}
              step={1}
              required
              value={String(editing.stock)}
              onChange={(v) => field("stock", Number(v))}
            />
            <InputField
              label="Đường dẫn hình ảnh"
              value={editing.image}
              onChange={(v) => field("image", v)}
              placeholder="/images/... hoặc https://..."
            />
            <TextareaField
              label="Thông số (mỗi dòng một thông số)"
              value={editing.specs.join("\n")}
              onChange={(v) => field("specs", v.split("\n"))}
            />
            <Checkbox
              key={editing.id}
              defaultChecked={editing.featured}
              label="Hiển thị ở sản phẩm nổi bật"
              onChange={(v) => field("featured", v)}
            />
            <div className="form-actions">
              <Button
                type="button"
                variant="neutral"
                onClick={() => setEditing(null)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={busy}>
                Lưu sản phẩm
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xóa sản phẩm?"
        className="tz-modal"
        footer={
          <>
            <Button variant="neutral" onClick={() => setDeleting(null)}>
              Giữ lại
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await api.deleteProduct(deleting!.id)
                  setDeleting(null)
                }, "Đã xóa sản phẩm.")
              }
            >
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p>{deleting?.name}</p>
        <p className="muted">
          Sản phẩm đang thuộc đơn xử lý sẽ không thể xóa. Lịch sử đơn hàng cũ
          được giữ nguyên.
        </p>
      </Modal>
    </>
  )
}
function Orders() {
  const { db } = useShop()
  const [status, setStatus] = useState("")
  const [query, setQuery] = useState("")
  const orders = db.orders.filter(
    (o) =>
      (!status || o.status === status) &&
      `${o.id} ${o.name} ${o.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  return (
    <>
      <Title sub="Xác nhận, giao hàng và theo dõi mọi đơn hàng.">
        Đơn hàng ({db.orders.length})
      </Title>
      <div className="surface admin-toolbar">
        <InputField
          aria-label="Tìm đơn hàng"
          value={query}
          onChange={setQuery}
          placeholder="Mã đơn, khách hàng, số điện thoại..."
          prefix={<Search size={16} />}
        />
        <SelectField
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "Tất cả trạng thái" },
            ...Object.entries(orderLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
      </div>
      <div className="form-stack">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} management />
        ))}
        {!orders.length && (
          <Empty
            title="Chưa có đơn hàng phù hợp"
            body="Đơn mới từ cửa hàng sẽ tự động xuất hiện tại đây."
          />
        )}
      </div>
    </>
  )
}
function UsersPage() {
  const { db, act, busy, user } = useShop()
  const [query, setQuery] = useState("")
  return (
    <>
      <Title sub="Theo dõi thành viên và quản lý quyền truy cập.">
        Tài khoản ({db.users.length})
      </Title>
      <div className="surface">
        <div className="admin-toolbar">
          <InputField
            aria-label="Tìm thành viên"
            value={query}
            onChange={setQuery}
            prefix={<Search size={16} />}
            placeholder="Tìm tên hoặc email..."
          />
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Vai trò</th>
                <th>Điện thoại</th>
                <th>Đơn hàng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {db.users
                .filter((u) =>
                  `${u.name} ${u.email}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <small>{u.email}</small>
                    </td>
                    <td>
                      <Badge
                        label={u.role}
                        variant={u.role === "ADMIN" ? "brand" : "secondary"}
                      />
                    </td>
                    <td>{u.phone || "—"}</td>
                    <td>{db.orders.filter((o) => o.userId === u.id).length}</td>
                    <td>
                      <Badge
                        label={u.active ? "Đang hoạt động" : "Đã khóa"}
                        variant={u.active ? "success" : "danger"}
                      />
                    </td>
                    <td>
                      <Button
                        variant="neutral"
                        size="small"
                        disabled={busy || u.id === user?.id}
                        onClick={() =>
                          void act(
                            () => api.toggleUser(u.id),
                            "Đã cập nhật trạng thái tài khoản.",
                          )
                        }
                      >
                        {u.id === user?.id
                          ? "Bạn"
                          : u.active
                            ? "Khóa tài khoản"
                            : "Mở khóa"}
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <p className="fine mt-xl">
          Chỉ có vai trò GUEST (chưa đăng nhập), MEMBER và ADMIN. Không có vai
          trò STAFF.
        </p>
      </div>
    </>
  )
}
function ShippingSettings() {
  const { db, act, busy } = useShop()
  const [fee, setFee] = useState(String(db.shipping.fee))
  const [free, setFree] = useState(String(db.shipping.freeFrom))
  return (
    <form
      className="surface form-stack shipping-settings"
      onSubmit={(e) => {
        e.preventDefault()
        void act(
          () => api.shipping(Number(fee), Number(free)),
          "Đã lưu cấu hình vận chuyển.",
        )
      }}
    >
      <Title sub="Ngưỡng miễn phí được tính sau khi trừ giảm giá.">
        Cấu hình vận chuyển
      </Title>
      <div className="form-two">
        <InputField
          label="Phí giao hàng mặc định (₫)"
          type="number"
          min={0}
          required
          value={fee}
          onChange={setFee}
        />
        <InputField
          label="Miễn phí từ giá trị đơn (₫)"
          type="number"
          min={0}
          required
          value={free}
          onChange={setFree}
        />
      </div>
      <Button type="submit" disabled={busy}>
        Lưu cấu hình giao hàng
      </Button>
    </form>
  )
}
function CMS({ group }: { group: CmsGroup }) {
  const { db, act, busy } = useShop()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("")
  const [editing, setEditing] = useState<Content | null>(null)
  const [deleting, setDeleting] = useState<Content | null>(null)
  const records = db.content[group].filter(
    (c) =>
      (!status || c.status === status) &&
      `${c.title} ${c.body} ${c.extra}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const isInbox = group === "contacts" || group === "comments"
  function field<K extends keyof Content>(key: K, value: Content[K]) {
    setEditing((c) => (c ? { ...c, [key]: value } : null))
  }
  const extraLabels: Partial<Record<CmsGroup, string>> = {
    articles: "Chuyên mục",
    comments: "Mã bài viết",
    contacts: "Email liên hệ",
    company: "Địa chỉ cửa hàng",
    services: "Thông tin chi phí",
    pricing: "Giá dịch vụ (số tiền ₫)",
  }
  return (
    <>
      <Title
        sub={
          isInbox
            ? "Xem nội dung và cập nhật trạng thái xử lý."
            : "Nội dung được đồng bộ trực tiếp với cửa hàng."
        }
        action={
          !isInbox && (
            <Button
              onClick={() => setEditing({ ...emptyContent })}
              iconStart={<Plus size={16} />}
            >
              Thêm {cmsGroups[group].toLowerCase()}
            </Button>
          )
        }
      >
        {cmsGroups[group]} ({db.content[group].length})
      </Title>
      {group === "settings" && <ShippingSettings />}
      <div className="surface">
        <div className="admin-toolbar">
          <InputField
            aria-label="Tìm nội dung"
            value={query}
            onChange={setQuery}
            prefix={<Search size={16} />}
            placeholder="Tìm trong nội dung..."
          />
          <SelectField
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              ...Object.entries(contentStatusLabels).map(([value, label]) => ({
                value,
                label,
              })),
            ]}
          />
        </div>
        {group === "media" ? (
          <div className="media-grid">
            {records.map((c) => (
              <article key={c.id}>
                <img src={c.image} alt={c.title} />
                <strong>{c.title}</strong>
                <p className="muted">{c.body}</p>
                <div className="flex gap-md">
                  <Button
                    variant="neutral"
                    size="small"
                    onClick={() => setEditing({ ...c })}
                  >
                    Chỉnh sửa
                  </Button>
                  <IconButton
                    variant="subtle"
                    aria-label="Xóa ảnh"
                    icon={<Trash2 size={16} />}
                    onClick={() => setDeleting(c)}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    {group === "contacts"
                      ? "Người gửi"
                      : group === "comments"
                        ? "Thành viên"
                        : "Tiêu đề"}
                  </th>
                  <th>Nội dung</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {records.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.title}</strong>
                      <small>
                        {group === "pricing"
                          ? money(Number(c.extra) || 0)
                          : c.extra}
                      </small>
                    </td>
                    <td>
                      <p className="cell-excerpt">{c.body}</p>
                    </td>
                    <td>
                      <Badge
                        label={contentStatusLabels[c.status]}
                        variant={
                          c.status === "published" || c.status === "resolved"
                            ? "success"
                            : c.status === "hidden"
                              ? "secondary"
                              : "warning"
                        }
                      />
                    </td>
                    <td>
                      <div className="flex gap-md">
                        <IconButton
                          variant="subtle"
                          aria-label={`Chỉnh sửa ${c.title}`}
                          icon={<Pencil size={16} />}
                          onClick={() => setEditing({ ...c })}
                        />
                        {group === "comments" && c.status === "pending" && (
                          <Button
                            size="small"
                            variant="neutral"
                            disabled={busy}
                            onClick={() =>
                              void act(
                                () =>
                                  api.saveContent(group, {
                                    ...c,
                                    status: "published",
                                  }),
                                "Đã duyệt bình luận.",
                              )
                            }
                          >
                            Duyệt
                          </Button>
                        )}
                        {group === "contacts" && c.status === "new" && (
                          <Button
                            size="small"
                            variant="neutral"
                            disabled={busy}
                            onClick={() =>
                              void act(
                                () =>
                                  api.saveContent(group, {
                                    ...c,
                                    status: "resolved",
                                  }),
                                "Đã đánh dấu xử lý.",
                              )
                            }
                          >
                            Đã xử lý
                          </Button>
                        )}
                        <IconButton
                          variant="subtle"
                          aria-label={`Xóa ${c.title}`}
                          icon={<Trash2 size={16} />}
                          onClick={() => setDeleting(c)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!records.length && (
          <Empty
            title={isInbox ? "Hộp thư đang trống" : "Chưa có nội dung phù hợp"}
            body={
              isInbox
                ? "Yêu cầu mới từ cửa hàng sẽ xuất hiện tại đây."
                : "Tạo nội dung mới hoặc thay đổi bộ lọc."
            }
          />
        )}
      </div>
      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={`${
          editing?.id ? "Cập nhật" : "Thêm"
        } ${cmsGroups[group].toLowerCase()}`}
        size="large"
        className="tz-modal"
      >
        {editing && (
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault()
              void act(async () => {
                await api.saveContent(group, editing)
                setEditing(null)
              }, "Đã lưu nội dung.")
            }}
          >
            <InputField
              label={
                isInbox ? "Người gửi" : group === "faqs" ? "Câu hỏi" : "Tiêu đề"
              }
              required
              value={editing.title}
              onChange={(v) => field("title", v)}
            />
            <TextareaField
              label={group === "faqs" ? "Câu trả lời" : "Nội dung"}
              required
              rows={7}
              value={editing.body}
              onChange={(v) => field("body", v)}
            />
            {extraLabels[group] && (
              <InputField
                label={extraLabels[group]}
                type={group === "pricing" ? "number" : "text"}
                min={group === "pricing" ? 0 : undefined}
                value={editing.extra}
                onChange={(v) => field("extra", v)}
              />
            )}
            {["articles", "media", "company", "services"].includes(group) && (
              <InputField
                label="URL hình ảnh"
                value={editing.image}
                onChange={(v) => field("image", v)}
                placeholder="https://..."
              />
            )}
            <SelectField
              label="Trạng thái"
              value={editing.status}
              onChange={(v) => field("status", v as Content["status"])}
              options={Object.entries(contentStatusLabels)
                .filter(([value]) =>
                  group === "contacts"
                    ? ["new", "resolved"].includes(value)
                    : ["published", "pending", "hidden"].includes(value),
                )
                .map(([value, label]) => ({ value, label }))}
            />
            <div className="form-actions">
              <Button
                type="button"
                variant="neutral"
                onClick={() => setEditing(null)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={busy}>
                Lưu nội dung
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xóa nội dung này?"
        className="tz-modal"
        footer={
          <>
            <Button variant="neutral" onClick={() => setDeleting(null)}>
              Giữ lại
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await api.deleteContent(group, deleting!.id)
                  setDeleting(null)
                }, "Đã xóa nội dung.")
              }
            >
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p>{deleting?.title}</p>
        <p className="muted">Thao tác xóa không thể hoàn tác.</p>
      </Modal>
    </>
  )
}
export default function Admin() {
  const { db, user, setAuth, sync } = useShop()
  const initial = window.location.hash.split("/")[2] as Section | undefined
  const [section, setSection] = useState<Section>(
    initial &&
      (initial in cmsGroups ||
        ["products", "orders", "users", "dashboard"].includes(initial))
      ? initial
      : "dashboard",
  )
  const [menu, setMenu] = useState(false)
  function navigate(next: Section) {
    setSection(next)
    window.location.hash = `/admin/${next}`
    setMenu(false)
    window.scrollTo(0, 0)
  }
  if (user?.role !== "ADMIN")
    return (
      <div className="admin-locked">
        <ShieldCheck size={56} strokeWidth={1.2} />
        <div role="heading" aria-level={1} className="text-title">
          Khu vực quản trị TechZone
        </div>
        <p className="muted">
          {user
            ? "Tài khoản của bạn không có quyền truy cập khu vực này."
            : "Vui lòng đăng nhập bằng tài khoản quản trị viên."}
        </p>
        {!user && (
          <Button onClick={() => setAuth(true)}>Đăng nhập quản trị</Button>
        )}
        <Button variant="neutral" onClick={() => go("/")}>
          <ArrowLeft size={16} /> Về cửa hàng
        </Button>
        <p className="fine">Demo: admin@techzone.vn / Techzone123</p>
      </div>
    )
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menu ? "is-open" : ""}`}>
        <Button
          variant="subtle"
          className="brand brand-light"
          onClick={() => navigate("dashboard")}
        >
          <span className="brand-mark">
            <Zap size={24} fill="currentColor" />
          </span>
          <span>
            tech<span className="brand-accent">zone</span>.
          </span>
        </Button>
        <span className="admin-workspace">WORKSPACE / QUẢN TRỊ</span>
        <div className="admin-nav-label">CỬA HÀNG</div>
        {[
          { id: "dashboard", label: "Tổng quan", icon: LayoutGrid },
          { id: "products", label: "Sản phẩm", icon: Package },
          { id: "orders", label: "Đơn hàng", icon: ShoppingCart },
          { id: "users", label: "Tài khoản", icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="subtle"
            className={`admin-nav-item ${section === id ? "selected" : ""}`}
            iconStart={<Icon size={18} strokeWidth={1.6} />}
            onClick={() => navigate(id as Section)}
          >
            {label}
            {id === "orders" &&
              db.orders.some((o) => o.status === "pending") && (
                <span className="admin-count">
                  {db.orders.filter((o) => o.status === "pending").length}
                </span>
              )}
          </Button>
        ))}
        <div className="admin-nav-label">QUẢN LÝ NỘI DUNG</div>
        {Object.entries(cmsGroups).map(([id, label]) => {
          const Icon = contentIcons[(id as CmsGroup)]
          return (
            <Button
              key={id}
              variant="subtle"
              className={`admin-nav-item ${section === id ? "selected" : ""}`}
              iconStart={<Icon size={18} strokeWidth={1.6} />}
              onClick={() => navigate(id as CmsGroup)}
            >
              {label}
            </Button>
          )
        })}
        <div className="admin-sidebar-bottom">
          <Button
            variant="subtle"
            iconStart={<ArrowUpRight size={18} />}
            onClick={() => go("/")}
          >
            Xem cửa hàng
          </Button>
          <Button
            variant="subtle"
            iconStart={<LogOut size={18} />}
            onClick={() =>
              sync(() => {
                api.logout()
                go("/")
              })
            }
          >
            Đăng xuất
          </Button>
          <span>TECHZONE ADMIN · FRONTEND DEMO</span>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="flex items-center gap-lg">
            <IconButton
              className="admin-mobile-toggle"
              variant="subtle"
              icon={<Menu size={21} />}
              aria-label="Menu quản trị"
              onClick={() => setMenu(!menu)}
            />
            <span className="muted">Workspace</span>
            <span>/</span>
            <strong>
              {section in cmsGroups
                ? cmsGroups[(section as CmsGroup)]
                : {
                    dashboard: "Tổng quan",
                    products: "Sản phẩm",
                    orders: "Đơn hàng",
                    users: "Tài khoản",
                  }[(section as "dashboard")]}
            </strong>
          </div>
          <div className="admin-user">
            <span className="admin-live">
              <span /> Local demo
            </span>
            <div className="avatar-small">TZ</div>
            <div>
              <strong>{user.name}</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>
        <main className="admin-content">
          {section === "dashboard" ? (
            <Dashboard navigate={navigate} />
          ) : section === "products" ? (
            <Products />
          ) : section === "orders" ? (
            <Orders />
          ) : section === "users" ? (
            <UsersPage />
          ) : (
            <CMS key={section} group={section} />
          )}
        </main>
        <div className="admin-bottom-note">
          TechZone Admin · Dữ liệu được lưu trên trình duyệt · Sẵn sàng kết nối
          API PHP / MySQL
        </div>
      </div>
    </div>
  )
}
