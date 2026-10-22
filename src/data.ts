export type Role = "MEMBER" | "ADMIN"
export type Product = {
  id: string
  name: string
  brand: string
  category: string
  price: number
  oldPrice: number
  stock: number
  image: string
  specs: string[]
  featured: boolean
}
export type User = {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  phone: string
  address: string
  active: boolean
}
export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled"
export type Order = {
  id: string
  userId: string
  name: string
  phone: string
  address: string
  note: string
  items: {
    productId: string
    name: string
    price: number
    quantity: number
    image: string
  }[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: OrderStatus
  createdAt: string
}
export const cmsGroups = {
  articles: "Bài viết",
  comments: "Bình luận",
  contacts: "Liên hệ",
  faqs: "Câu hỏi thường gặp",
  company: "Thông tin công ty",
  services: "Dịch vụ",
  pricing: "Bảng giá dịch vụ",
  settings: "Cài đặt website",
  media: "Thư viện media",
} as const
export type CmsGroup = keyof typeof cmsGroups
export type Content = {
  id: string
  title: string
  body: string
  extra: string
  image: string
  status: "published" | "pending" | "hidden" | "new" | "resolved"
  createdAt: string
  userId?: string
}
export type Database = {
  version: number
  products: Product[]
  users: User[]
  orders: Order[]
  carts: Record<string, {
    productId: string
    quantity: number
  }[]>
  favorites: Record<string, string[]>
  content: Record<CmsGroup, Content[]>
  shipping: {
    fee: number
    freeFrom: number
  }
  subscribers: string[]
  session: string | null
}
export const categories = [
  { id: "cpu", name: "CPU - Bộ vi xử lý", short: "CPU", detail: "Intel, AMD" },
  {
    id: "mainboard",
    name: "Mainboard - Bo mạch chủ",
    short: "Mainboard",
    detail: "ASUS, MSI, Gigabyte",
  },
  {
    id: "gpu",
    name: "VGA - Card màn hình",
    short: "Card màn hình",
    detail: "NVIDIA, AMD Radeon",
  },
  { id: "ram", name: "RAM - Bộ nhớ trong", short: "RAM", detail: "DDR4, DDR5" },
  {
    id: "ssd",
    name: "SSD / HDD - Ổ cứng",
    short: "SSD / HDD",
    detail: "Nhanh hơn, lưu nhiều hơn",
  },
  {
    id: "psu",
    name: "Nguồn máy tính",
    short: "Nguồn / PSU",
    detail: "Ổn định & bền bỉ",
  },
  {
    id: "case",
    name: "Case - Vỏ máy tính",
    short: "Case PC",
    detail: "Dấu ấn riêng của bạn",
  },
  {
    id: "cooling",
    name: "Tản nhiệt máy tính",
    short: "Tản nhiệt",
    detail: "Mát mẻ, hiệu năng cao",
  },
  {
    id: "monitor",
    name: "Màn hình máy tính",
    short: "Màn hình",
    detail: "Mọi chi tiết đều sắc nét",
  },
  {
    id: "accessories",
    name: "Bàn phím, chuột & phụ kiện",
    short: "Phụ kiện",
    detail: "Hoàn thiện góc máy",
  },
  {
    id: "pc",
    name: "PC Gaming & Workstation",
    short: "PC Gaming",
    detail: "Sẵn sàng chiến game",
  },
]
export const money = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "₫"
export const orderLabels: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
}
export const newsImages = [
  "/images/news-1.jpg",
  "/images/news-2.jpg",
  "/images/news-3.jpg",
]
const product = (
  id: string,
  name: string,
  brand: string,
  category: string,
  price: number,
  oldPrice: number,
  specs: string[],
  featured = true,
): Product => ({
  id,
  name,
  brand,
  category,
  price,
  oldPrice,
  specs,
  featured,
  stock: 15,
  image: `/images/${id}.webp`,
})
const record = (
  id: string,
  title: string,
  body: string,
  extra = "",
  image = "",
): Content => ({
  id,
  title,
  body,
  extra,
  image,
  status: "published",
  createdAt: "2026-05-18T09:00:00.000Z",
})
export function createSeed(): Database {
  return {
    version: 1,
    products: [
      product(
        "gpu-asus",
        "Card màn hình ASUS Dual GeForce RTX 4060 OC 8GB",
        "ASUS",
        "gpu",
        7490000,
        8990000,
        ["8GB GDDR6", "PCIe 4.0", "Bảo hành 36 tháng"],
      ),
      product(
        "cpu-intel",
        "CPU Intel Core i5-14400F (10 nhân / 16 luồng)",
        "Intel",
        "cpu",
        4290000,
        4990000,
        ["Socket LGA 1700", "Up to 4.7GHz", "Bảo hành 36 tháng"],
      ),
      product(
        "main-msi",
        "Mainboard MSI PRO B760M-A WIFI DDR4",
        "MSI",
        "mainboard",
        3190000,
        3790000,
        ["Intel B760", "DDR4", "Wi-Fi 6E"],
      ),
      product(
        "ram-corsair",
        "RAM Corsair Vengeance RGB 32GB DDR5 6000MHz",
        "Corsair",
        "ram",
        2790000,
        3290000,
        ["32GB (2 x 16GB)", "DDR5 6000MHz", "RGB"],
      ),
      product(
        "ssd-samsung",
        "Ổ cứng SSD Samsung 990 PRO 1TB NVMe M.2",
        "Samsung",
        "ssd",
        2290000,
        2890000,
        ["1TB", "PCIe Gen 4.0", "7.450 MB/s"],
      ),
      product(
        "monitor-asus",
        "Màn hình ASUS TUF Gaming VG249Q3A 24 inch",
        "ASUS",
        "monitor",
        2990000,
        3590000,
        ["Full HD IPS", "180Hz", "1ms"],
      ),
      product(
        "pc-gaming",
        "PC TechZone Nova – i5 14400F / RTX 4060 / 16GB",
        "TechZone",
        "pc",
        18990000,
        21990000,
        ["Intel Core i5", "RTX 4060 8GB", "SSD 512GB"],
      ),
      product(
        "keyboard",
        "Bàn phím cơ Logitech G PRO X RGB",
        "Logitech",
        "accessories",
        2190000,
        2690000,
        ["GX Blue Switch", "Tenkeyless", "LIGHTSYNC RGB"],
      ),
      product(
        "mouse",
        "Chuột gaming Logitech G502 HERO",
        "Logitech",
        "accessories",
        890000,
        1190000,
        ["25.600 DPI", "11 nút lập trình", "RGB"],
      ),
      product(
        "cooler",
        "Tản nhiệt nước Cooler Master ML240L V2 ARGB",
        "Cooler Master",
        "cooling",
        1790000,
        2190000,
        ["240mm", "ARGB", "Intel / AMD"],
      ),
      product(
        "psu",
        "Nguồn Corsair RM750e 750W 80 Plus Gold",
        "Corsair",
        "psu",
        2390000,
        2790000,
        ["750W", "80 Plus Gold", "Full Modular"],
      ),
      product(
        "case",
        "Vỏ case NZXT H5 Flow Black",
        "NZXT",
        "case",
        1890000,
        2290000,
        ["Mid Tower", "Kính cường lực", "Airflow"],
      ),
    ],
    users: [
      {
        id: "member-demo",
        name: "Nguyễn Minh Anh",
        email: "member@techzone.vn",
        passwordHash: "",
        role: "MEMBER",
        phone: "0901234567",
        address: "123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
        active: true,
      },
      {
        id: "admin-demo",
        name: "Quản trị TechZone",
        email: "admin@techzone.vn",
        passwordHash: "",
        role: "ADMIN",
        phone: "18006868",
        address: "",
        active: true,
      },
    ],
    orders: [],
    carts: {},
    favorites: {},
    session: null,
    shipping: { fee: 30000, freeFrom: 2000000 },
    subscribers: [],
    content: {
      articles: [
        record(
          "news-1",
          "Build PC 20 triệu: Cấu hình nào đáng mua nhất 2026?",
          "Một bộ PC tốt không chỉ nằm ở thông số. Đó là sự cân bằng giữa CPU, GPU và nhu cầu sử dụng thực tế.\n\nVới ngân sách 20 triệu, Intel Core i5-14400F kết hợp GeForce RTX 4060 mang lại trải nghiệm Full HD mượt mà. RAM 16GB là mức khởi đầu hợp lý; nâng lên 32GB nếu bạn làm đồ họa hoặc đa nhiệm.\n\nĐừng tiết kiệm quá mức cho bộ nguồn. Nguồn 650W đạt chuẩn 80 Plus từ thương hiệu uy tín giúp hệ thống vận hành ổn định. SSD NVMe 1TB và case thông thoáng sẽ hoàn thiện cấu hình.\n\nLiên hệ TechZone để được tư vấn cấu hình phù hợp và lắp ráp miễn phí.",
          "Tư vấn cấu hình",
          newsImages[0],
        ),
        record(
          "news-2",
          "DDR4 hay DDR5: Đâu là lựa chọn phù hợp cho bạn?",
          "DDR5 cung cấp băng thông cao hơn, phù hợp các nền tảng mới. DDR4 vẫn là lựa chọn tiết kiệm và đủ tốt cho chơi game Full HD.\n\nHãy kiểm tra loại RAM mà mainboard hỗ trợ trước khi mua. DDR4 và DDR5 không thể lắp thay thế cho nhau. Với máy mới, 32GB DDR5 là lựa chọn dài hạn đáng cân nhắc.",
          "Kiến thức công nghệ",
          newsImages[1],
        ),
        record(
          "news-3",
          "5 mẹo nâng cấp góc gaming mà không tốn quá nhiều",
          "Bắt đầu bằng cách sắp xếp dây cáp, vệ sinh bàn và đặt màn hình ngang tầm mắt.\n\nMột con chuột vừa tay, bàn phím phù hợp và ánh sáng dịu sẽ tạo khác biệt lớn. Hãy ưu tiên trải nghiệm sử dụng thay vì chỉ chạy theo RGB.",
          "Góc gaming",
          newsImages[2],
        ),
      ],
      comments: [],
      contacts: [],
      faqs: [
        record(
          "faq-1",
          "TechZone có hỗ trợ lắp ráp PC miễn phí không?",
          "Có. TechZone lắp ráp, đi dây và kiểm tra độ ổn định miễn phí khi bạn mua trọn bộ linh kiện tại cửa hàng.",
        ),
        record(
          "faq-2",
          "Tôi có thể thanh toán bằng hình thức nào?",
          "Trong bản prototype, TechZone hỗ trợ thanh toán khi nhận hàng (COD). Bạn cần đăng nhập trước khi đặt hàng.",
        ),
        record(
          "faq-3",
          "Phí vận chuyển được tính như thế nào?",
          "Phí giao hàng mặc định 30.000₫. Miễn phí cho đơn từ 2.000.000₫ sau giảm giá. Phí chính xác được hiển thị trước khi xác nhận.",
        ),
        record(
          "faq-4",
          "Chính sách bảo hành và đổi trả ra sao?",
          "Sản phẩm được bảo hành chính hãng theo thời hạn ghi trên từng sản phẩm. Hỗ trợ đổi sản phẩm lỗi kỹ thuật trong 7 ngày sau khi kiểm tra.",
        ),
        record(
          "faq-5",
          "Làm thế nào để hủy đơn hàng?",
          "Đăng nhập, vào Tài khoản → Đơn hàng và chọn Hủy đơn khi đơn đang chờ xác nhận. Sau thời điểm này, vui lòng liên hệ TechZone.",
        ),
      ],
      company: [
        record(
          "company-1",
          "Công nghệ cho mọi đam mê.",
          "TechZone là điểm đến của những người yêu công nghệ. Chúng tôi mang đến linh kiện chính hãng, những cấu hình được tuyển chọn kỹ lưỡng và dịch vụ tận tâm.\n\nTừ góc học tập đầu tiên đến cỗ máy sáng tạo chuyên nghiệp, TechZone luôn đồng hành cùng bạn. Minh bạch về giá, rõ ràng về bảo hành và tư vấn đúng nhu cầu là những điều chúng tôi cam kết.",
          "123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
        ),
      ],
      services: [
        record(
          "service-1",
          "Tư vấn & lắp ráp PC",
          "Lựa chọn linh kiện tương thích, tối ưu theo ngân sách. Lắp ráp, đi dây gọn gàng và kiểm thử trước khi bàn giao.",
          "Miễn phí khi mua trọn bộ",
        ),
        record(
          "service-2",
          "Vệ sinh & bảo dưỡng",
          "Vệ sinh chuyên sâu, thay keo tản nhiệt và kiểm tra nhiệt độ giúp máy hoạt động mát và ổn định.",
          "Từ 150.000₫",
        ),
        record(
          "service-3",
          "Nâng cấp & sửa chữa",
          "Kiểm tra, chẩn đoán và nâng cấp RAM, SSD, card đồ họa theo đúng nhu cầu sử dụng.",
          "Báo giá trước khi thực hiện",
        ),
      ],
      pricing: [
        record(
          "price-1",
          "Lắp ráp PC trọn bộ",
          "Miễn phí khi mua linh kiện tại TechZone",
          "0",
        ),
        record(
          "price-2",
          "Vệ sinh PC cơ bản",
          "Vệ sinh bụi, kiểm tra quạt và nhiệt độ",
          "150000",
        ),
        record(
          "price-3",
          "Vệ sinh chuyên sâu & thay keo",
          "Vệ sinh toàn bộ, thay keo CPU chất lượng cao",
          "300000",
        ),
        record(
          "price-4",
          "Cài đặt hệ điều hành",
          "Cài đặt driver; bản quyền phần mềm tính riêng",
          "200000",
        ),
        record(
          "price-5",
          "Lắp đặt linh kiện nâng cấp",
          "Kiểm tra tương thích và kiểm thử hệ thống",
          "100000",
        ),
      ],
      settings: [
        record("setting-phone", "Hotline", "1800 6868"),
        record("setting-email", "Email hỗ trợ", "hello@techzone.vn"),
        record(
          "setting-hours",
          "Giờ làm việc",
          "08:30 – 21:00, Thứ 2 – Chủ nhật",
        ),
      ],
      media: newsImages.map((image, index) =>
        record(
          `media-${index}`,
          `Góc công nghệ ${index + 1}`,
          "Ảnh biên tập · Unsplash",
          "",
          image,
        ),
      ),
    },
  }
}
