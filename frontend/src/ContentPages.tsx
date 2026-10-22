import { useState } from "react"
import { useRemoteList, useRemoteItem } from "./useRemoteData"
import RemotePager from "./RemotePager"
import { Button, Badge } from "@figma/astraui"
import { InputField, TextareaField } from "./fields"
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Plus,
  Minus,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Settings,
  Headphones,
  CheckCircle,
  MessageCircle,
  Search,
} from "lucide-react"
import { useShop } from "./shop-context"
import { api } from "./service"
import { money, type Content } from "./data"
import { Breadcrumb, Empty, go, NavLink, Title } from "./ui"

function PageIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string
  title: string
  text: string
}) {
  return (
    <div className="content-intro">
      <span className="eyebrow">{eyebrow}</span>
      <div role="heading" aria-level={1}>
        {title}
        <span className="heading-dot">.</span>
      </div>
      <p>{text}</p>
    </div>
  )
}
function News({ id }: { id?: string }) {
  const { db, user, setAuth, act, busy } = useShop()
  const [filter, setFilter] = useState("Tất cả")
  const [query, setQuery] = useState("")
  const [comment, setComment] = useState("")
  const [page, setPage] = useState(1)
  const [commentPage, setCommentPage] = useState(1)
  const remote = useRemoteList<Content>(
    "articles",
    { page, q: query, section: filter === "Tất cả" ? "" : filter },
    !id,
  )
  const articles = remote.items
  const detail = useRemoteItem<Content>("articles", id)
  const article = detail.item
  const comments = useRemoteList<Content>(
    "comments",
    { articleId: id, page: commentPage },
    Boolean(id),
  )
  if (id && !article)
    return (
      <Empty
        title={detail.error || "Đang tải bài viết…"}
        body="Bài viết chưa được xuất bản hoặc đã bị gỡ."
        action={<NavLink to="/news">Quay lại tin công nghệ</NavLink>}
      />
    )
  if (article)
    return (
      <>
        <Breadcrumb name="Tin công nghệ" />
        <article className="article-detail">
          <Badge label={article.extra || "Tin công nghệ"} variant="brand" />
          <div role="heading" aria-level={1}>
            {article.title}
          </div>
          <p className="muted">
            TechZone Editorial ·{" "}
            {new Date(article.createdAt).toLocaleDateString("vi-VN")} ·{" "}
            {Math.max(1, Math.ceil(article.body.split(/\s+/).length / 200))}{" "}
            phút đọc
          </p>
          {article.image && (
            <img
              className="article-cover"
              src={article.image}
              alt={article.title}
            />
          )}
          <div className="prose article-body">{article.body}</div>
          <div className="article-signoff">
            <ShieldCheck size={24} />
            <div>
              <strong>Đội ngũ TechZone</strong>
              <p className="muted">
                Chia sẻ kiến thức. Đồng hành cùng đam mê công nghệ.
              </p>
            </div>
          </div>
          <section className="comments-section">
            <Title>Bình luận & trao đổi</Title>
            {comments.items.map((c) => (
              <div className="comment" key={c.id}>
                <div>
                  <strong>{c.title}</strong>
                  <span className="muted">
                    {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  {c.status === "pending" && (
                    <Badge label="Chờ kiểm duyệt" variant="warning" />
                  )}
                </div>
                <p>{c.body}</p>
              </div>
            ))}
            <RemotePager
              pagination={comments.pagination}
              onPage={setCommentPage}
              loading={comments.loading}
              error={comments.error}
            />
            {user ? (
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault()
                  void act(async () => {
                    await api.comment(article.id, comment)
                    setComment("")
                  }, "Bình luận đã gửi và đang chờ quản trị viên duyệt.")
                }}
              >
                <TextareaField
                  label="Chia sẻ ý kiến của bạn"
                  required
                  value={comment}
                  onChange={setComment}
                  placeholder="Cùng thảo luận văn minh và hữu ích..."
                />
                <Button
                  type="submit"
                  disabled={busy}
                  iconStart={<MessageCircle size={16} />}
                >
                  Gửi bình luận
                </Button>
                <p className="fine">
                  Bình luận sẽ hiển thị công khai sau khi được kiểm duyệt.
                </p>
              </form>
            ) : (
              <div className="comment-login">
                <p>Đăng nhập để tham gia thảo luận cùng cộng đồng TechZone.</p>
                <Button onClick={() => setAuth(true)}>
                  Đăng nhập để bình luận
                </Button>
              </div>
            )}
          </section>
        </article>
      </>
    )
  const shown = articles
  return (
    <>
      <Breadcrumb name="Tin công nghệ" />
      <PageIntro
        eyebrow="TECHZONE JOURNAL"
        title="Hiểu công nghệ. Chọn thông minh"
        text="Kiến thức, xu hướng và cảm hứng cho góc máy của bạn."
      />
      <div className="news-toolbar">
        <div className="tab-bar">
          {["Tất cả", ...db.articleSections].map((f) => (
            <Button
              variant="subtle"
              key={f}
              className={f === filter ? "selected" : ""}
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
            >
              {f}
            </Button>
          ))}
        </div>
        <InputField
          aria-label="Tìm bài viết"
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          prefix={<Search size={16} />}
          placeholder="Tìm bài viết..."
        />
      </div>
      <div className="news-grid">
        {shown.map((a) => (
          <article key={a.id} className="news-card">
            <Button
              variant="subtle"
              className="news-image-button"
              onClick={() => go(`/news/${a.id}`)}
            >
              <img src={a.image} alt={a.title} loading="lazy" />
            </Button>
            <div className="news-meta">
              <span>{a.extra}</span>
              <span>{new Date(a.createdAt).toLocaleDateString("vi-VN")}</span>
            </div>
            <Button
              variant="subtle"
              className="news-title"
              onClick={() => go(`/news/${a.id}`)}
            >
              {a.title}
            </Button>
            <p className="news-excerpt">{a.body.slice(0, 130)}...</p>
            <NavLink to={`/news/${a.id}`}>
              Đọc bài viết <ArrowUpRight size={14} />
            </NavLink>
          </article>
        ))}
      </div>
      <RemotePager
        pagination={remote.pagination}
        onPage={setPage}
        loading={remote.loading}
        error={remote.error}
      />
      {!shown.length && (
        <Empty
          title="Chưa có bài viết phù hợp"
          body="Hãy thử từ khóa khác hoặc quay lại sau."
        />
      )}
    </>
  )
}
function About() {
  const { db } = useShop()
  const published = db.content.company.filter((c) => c.status === "published")
  return (
    <>
      <Breadcrumb name="Về TechZone" />
      <PageIntro
        eyebrow="KHÔNG CHỈ LÀ LINH KIỆN"
        title="Công nghệ cho mọi đam mê"
        text="Chúng tôi tin rằng mỗi cấu hình đều bắt đầu từ một câu chuyện."
      />
      <div className="about-layout">
        <div className="about-image">
          <img
            src="/images/pc-gaming.webp"
            alt="Cấu hình PC được tuyển chọn tại TechZone"
          />
          <span>BUILT FOR YOUR NEXT CHAPTER.</span>
        </div>
        <div className="form-stack">
          {published.map((c) => (
            <section className="surface prose" key={c.id}>
              <div role="heading" aria-level={2} className="text-title">
                {c.title}
              </div>
              <p>{c.body}</p>
              <p className="muted flex items-center gap-md">
                <MapPin size={18} />
                {c.extra}
              </p>
            </section>
          ))}
        </div>
      </div>
      <div className="values-grid">
        {[
          {
            icon: ShieldCheck,
            title: "Chính hãng & minh bạch",
            text: "Nguồn gốc rõ ràng, giá bán công khai và bảo hành đúng cam kết.",
          },
          {
            icon: Headphones,
            title: "Tư vấn từ đam mê",
            text: "Lắng nghe nhu cầu, đề xuất giải pháp phù hợp thay vì bán thứ đắt nhất.",
          },
          {
            icon: Settings,
            title: "Chăm chút từng chi tiết",
            text: "Từ chọn linh kiện, lắp ráp, kiểm thử đến hỗ trợ sau bán hàng.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div className="surface value-card" key={title}>
            <Icon size={30} strokeWidth={1.4} />
            <div role="heading" aria-level={2} className="text-heading">
              {title}
            </div>
            <p className="muted">{text}</p>
          </div>
        ))}
      </div>
      <div className="content-cta">
        <div role="heading" aria-level={2}>
          Cấu hình tiếp theo của bạn bắt đầu tại đây.
        </div>
        <Button
          onClick={() => go("/products")}
          iconEnd={<ArrowRight size={16} />}
        >
          Khám phá TechZone
        </Button>
      </div>
    </>
  )
}
function Services({ pricing = false }: { pricing?: boolean }) {
  const { db } = useShop()
  return (
    <>
      <Breadcrumb name={pricing ? "Bảng giá dịch vụ" : "Dịch vụ"} />
      <PageIntro
        eyebrow="TECHZONE CARE"
        title={
          pricing
            ? "Giá rõ ràng. An tâm lựa chọn"
            : "Chăm máy tận tâm. An tâm sử dụng"
        }
        text={
          pricing
            ? "Minh bạch chi phí từ đầu. Chỉ thực hiện khi bạn đồng ý."
            : "Từ tư vấn cấu hình đến chăm sóc góc máy, luôn có TechZone đồng hành."
        }
      />
      {pricing ? (
        <div className="surface price-list">
          <div className="pricing-row pricing-head">
            <strong>Dịch vụ</strong>
            <strong>Chi phí tham khảo</strong>
          </div>
          {db.content.pricing
            .filter((p) => p.status === "published")
            .map((p) => (
              <div className="pricing-row" key={p.id}>
                <div>
                  <strong>{p.title}</strong>
                  <p className="muted">{p.body}</p>
                </div>
                <strong>
                  {Number(p.extra) === 0
                    ? "Miễn phí"
                    : money(Number(p.extra) || 0)}
                </strong>
              </div>
            ))}
          <p className="fine">
            Giá dịch vụ chưa bao gồm linh kiện và bản quyền phần mềm (nếu có).
            Chi phí cuối cùng được xác nhận sau khi kiểm tra thực tế.
          </p>
        </div>
      ) : (
        <div className="services-grid">
          {db.content.services
            .filter((s) => s.status === "published")
            .map((s, i) => (
              <article className="surface service-card" key={s.id}>
                <span className="service-number">0{i + 1}</span>
                <Settings size={34} strokeWidth={1.2} />
                <div role="heading" aria-level={2} className="text-title">
                  {s.title}
                </div>
                <p className="muted">{s.body}</p>
                <strong>{s.extra}</strong>
                <NavLink to="/contact">
                  Đặt lịch tư vấn <ArrowUpRight size={16} />
                </NavLink>
              </article>
            ))}
        </div>
      )}
      <div className="content-cta">
        <div>
          <div role="heading" aria-level={2}>
            Máy của bạn cần được chăm sóc?
          </div>
          <p className="muted">
            Gửi yêu cầu, chúng tôi sẽ liên hệ để tư vấn và hẹn lịch phù hợp.
          </p>
        </div>
        <Button onClick={() => go("/contact")}>
          Liên hệ đặt lịch <ArrowRight size={16} />
        </Button>
      </div>
      {!pricing && (
        <NavLink to="/pricing">
          Xem bảng giá dịch vụ chi tiết <ArrowRight size={16} />
        </NavLink>
      )}
    </>
  )
}
function FAQ() {
  const [open, setOpen] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const remote = useRemoteList<Content>("faqs", { q: query, page })
  const faqs = remote.items
  return (
    <>
      <Breadcrumb name="Câu hỏi thường gặp" />
      <PageIntro
        eyebrow="CHÚNG TÔI CÓ THỂ GIÚP GÌ?"
        title="Một câu hỏi. Một lời giải đáp"
        text="Những điều bạn cần biết trước, trong và sau khi mua hàng tại TechZone."
      />
      <div className="faq-wrap">
        <InputField
          aria-label="Tìm câu hỏi"
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(1)
          }}
          prefix={<Search size={17} />}
          placeholder="Tìm câu trả lời của bạn..."
        />
        {faqs.map((f) => (
          <section
            className={`faq-item ${open === f.id ? "open" : ""}`}
            key={f.id}
          >
            <Button
              variant="subtle"
              aria-expanded={open === f.id}
              onClick={() => setOpen(open === f.id ? null : f.id)}
              iconEnd={open === f.id ? <Minus size={19} /> : <Plus size={19} />}
            >
              {f.title}
            </Button>
            {open === f.id && <p>{f.body}</p>}
          </section>
        ))}
        <RemotePager
          pagination={remote.pagination}
          onPage={setPage}
          loading={remote.loading}
          error={remote.error}
        />
        {!faqs.length && (
          <Empty
            title="Chưa tìm thấy câu trả lời"
            body="Hãy thử từ khóa khác hoặc liên hệ để được hỗ trợ."
          />
        )}
        <div className="content-cta">
          <p>Chưa tìm thấy câu trả lời bạn cần?</p>
          <Button onClick={() => go("/contact")}>
            Liên hệ hỗ trợ <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </>
  )
}
function Contact() {
  const { db, user, act, busy } = useShop()
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [body, setBody] = useState("")
  const [sent, setSent] = useState(false)
  const setting = (id: string, fallback: string) =>
    db.content.settings.find((s) => s.id === id && s.status === "published")
      ?.body ?? fallback
  return (
    <>
      <Breadcrumb name="Liên hệ" />
      <PageIntro
        eyebrow="CHÚNG TÔI LUÔN LẮNG NGHE"
        title="Cùng bắt đầu một cuộc trò chuyện"
        text="Cần tư vấn cấu hình, hỗ trợ đơn hàng hay chia sẻ góp ý? TechZone luôn ở đây."
      />
      <div className="contact-layout">
        <section className="contact-info">
          <div role="heading" aria-level={2} className="text-title">
            Kết nối với TechZone
          </div>
          {[
            {
              icon: MapPin,
              title: "Ghé thăm cửa hàng",
              text:
                db.content.company.find((c) => c.status === "published")
                  ?.extra || "Địa chỉ đang được cập nhật",
            },
            {
              icon: Phone,
              title: "Gọi cho chúng tôi",
              text: setting("setting-phone", "Chưa cập nhật"),
            },
            {
              icon: Mail,
              title: "Email hỗ trợ",
              text: setting("setting-email", "Chưa cập nhật"),
            },
            {
              icon: Clock,
              title: "Thời gian làm việc",
              text: setting("setting-hours", "Chưa cập nhật"),
            },
          ].map(({ icon: Icon, title, text }) => (
            <div className="contact-info-item" key={title}>
              <span>
                <Icon size={22} strokeWidth={1.5} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
          <div className="contact-note">
            <ShieldCheck size={22} />
            <p>
              Thông tin được gửi tới cửa hàng và lưu trên máy chủ để xử lý yêu
              cầu. Không có email thực tế được gửi.
            </p>
          </div>
        </section>
        <section className="surface">
          {sent ? (
            <div className="empty">
              <CheckCircle size={48} />
              <div role="heading" aria-level={2} className="text-title">
                Đã tiếp nhận lời nhắn của bạn
              </div>
              <p className="muted">
                Yêu cầu đã có trong mục Liên hệ của trang quản trị.
              </p>
              <Button
                variant="neutral"
                onClick={() => {
                  setSent(false)
                  setBody("")
                }}
              >
                Gửi lời nhắn khác
              </Button>
            </div>
          ) : (
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault()
                void act(async () => {
                  await api.contact(name, email, body)
                  setSent(true)
                }, "Đã gửi yêu cầu liên hệ.")
              }}
            >
              <div role="heading" aria-level={2} className="text-heading">
                Gửi lời nhắn cho chúng tôi
              </div>
              <InputField
                label="Họ và tên"
                required
                value={name}
                onChange={setName}
                placeholder="Nhập họ tên của bạn"
              />
              <InputField
                label="Email liên hệ"
                required
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="ban@example.com"
              />
              <TextareaField
                label="TechZone có thể giúp gì cho bạn?"
                required
                minLength={10}
                rows={5}
                value={body}
                onChange={setBody}
                placeholder="Mô tả nhu cầu tư vấn, yêu cầu hỗ trợ hoặc góp ý của bạn..."
              />
              <Button
                type="submit"
                disabled={busy}
                iconEnd={<ArrowRight size={16} />}
              >
                {busy ? "Đang gửi..." : "Gửi lời nhắn"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </>
  )
}
function Policies() {
  const { db } = useShop()
  return (
    <>
      <Breadcrumb name="Chính sách & điều khoản" />
      <PageIntro
        eyebrow="MINH BẠCH TỪ ĐẦU"
        title="An tâm trong từng lựa chọn"
        text="Các thông tin cần biết khi trải nghiệm TechZone."
      />
      <div className="surface prose policy-content">
        <div role="heading" aria-level={2} className="text-title">
          Giao hàng & thanh toán
        </div>
        <p>
          TechZone hỗ trợ giao hàng toàn quốc và thanh toán COD. Phí giao hàng
          mặc định {money(db.shipping.fee)}, miễn phí cho giá trị sau giảm giá
          từ {money(db.shipping.freeFrom)}. Phí chính xác hiển thị tại bước
          thanh toán.
        </p>
        <div role="heading" aria-level={2} className="text-title">
          Bảo hành & đổi trả
        </div>
        <p>
          Sản phẩm được bảo hành theo chính sách của hãng. Hỗ trợ đổi sản phẩm
          lỗi kỹ thuật trong 7 ngày sau khi kiểm tra. Vui lòng giữ hóa đơn, tem
          và số serial. Không áp dụng cho sản phẩm hư hỏng do tác động vật lý,
          vào nước hoặc sửa chữa trái phép.
        </p>
        <div role="heading" aria-level={2} className="text-title">
          Hủy đơn hàng
        </div>
        <p>
          Vui lòng liên hệ cửa hàng khi cần hủy đơn. Quản trị viên xác nhận hủy
          trước khi giao hàng. Đơn đã giao cho vận chuyển cần liên hệ hỗ trợ.
          Hủy đơn hợp lệ hoàn lại tồn kho đúng một lần.
        </p>
        <div role="heading" aria-level={2} className="text-title">
          Quyền riêng tư
        </div>
        <p>
          Thông tin tài khoản, đơn hàng và liên hệ được lưu để cung cấp dịch vụ.
          Mật khẩu được băm; phiên đăng nhập được bảo vệ bằng cookie. Liên hệ
          cửa hàng để được hỗ trợ về dữ liệu cá nhân.
        </p>
      </div>
    </>
  )
}
export default function ContentPages({ route }: { route: string }) {
  const path = route.split("?")[0]
  let content
  if (path === "/news" || path.startsWith("/news/"))
    content = (
      <News
        key={path}
        id={path.startsWith("/news/") ? path.slice(6) : undefined}
      />
    )
  else if (path === "/about") content = <About />
  else if (path === "/services") content = <Services />
  else if (path === "/pricing") content = <Services pricing />
  else if (path === "/faq") content = <FAQ />
  else if (path === "/contact") content = <Contact />
  else if (path === "/policies") content = <Policies />
  else
    content = (
      <Empty
        title="Trang không tồn tại"
        body="Hãy quay về trang chủ để tiếp tục khám phá TechZone."
        action={<Button onClick={() => go("/")}>Về trang chủ</Button>}
      />
    )
  return <main className="container page content-page">{content}</main>
}
