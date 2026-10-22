# Kế hoạch sửa lỗi `ShopProvider is missing`

## Mục tiêu và phạm vi

Sửa lỗi context làm `Header` và các trang sử dụng `useShop()` bị crash, đặc biệt sau hot reload trong Figma Make. Giữ nguyên giao diện, design-system tokens, font, chức năng mua hàng và dữ liệu hiện có.

Đây là kế hoạch sửa lỗi kỹ thuật, không phải một đợt thiết kế lại. Không cần thêm quyết định sản phẩm hoặc câu hỏi xác nhận phạm vi.

## Những gì đã xác minh

- `src/main.tsx` render `App` trong `React.StrictMode`.
- `src/App.tsx` đã bọc toàn bộ `Shell` bằng `ThemeProvider → ShopProvider`. `Header` nằm bên trong cây này; không có bằng chứng cho thấy thiếu provider trong cấu trúc JSX.
- `src/context.tsx` hiện đồng thời tạo `ShopContext`, định nghĩa state hook, xuất `useShop()` và xuất component `ShopProvider`.
- `App`, `Admin`, `StorePages` và `ContentPages` đều lấy hook từ module này.
- Các stack trace được cung cấp có nhiều timestamp HMR khác nhau. Việc khởi tạo lại context trong module trộn component/hook là giả thuyết nguyên nhân chính: consumer mới có thể đọc một context khác context của provider còn đang mount.
- Một lần mở mới ứng dụng trên dev server đang chạy tại cổng `3000` hiển thị được header và không ghi nhận `pageerror`. Vì vậy, chỉ kiểm tra cold load là chưa đủ; phải có kiểm tra HMR.
- React và React DOM ở cấp ứng dụng cùng phiên bản `19.2.4`. Không có lý do hiện tại để thay dependency.
- CSS entrypoint tìm thấy là `src/index.css`; chưa có `/styles/global.css` trong workspace. Không tự tạo file đó, thay font, thay token hoặc thêm CSS mới.
- `package.json` đang có thay đổi có sẵn của người dùng; phải giữ nguyên.

## Phương án được chọn

Tách module chứa component khỏi module chứa context/hook, đồng thời giữ nguyên identity của context trong một chu kỳ HMR bằng `import.meta.hot.data`.

Không bỏ kiểm tra lỗi của `useShop`, không cung cấp fallback store, không thêm provider thứ hai và không dùng error boundary để che lỗi. Không tắt StrictMode hoặc Fast Refresh.

### 1. Tách state hook: `src/useShopState.ts` — file mới

- Chuyển nguyên trạng `useShopState()` từ `src/context.tsx` sang file này.
- Giữ nguyên `useSyncExternalStore`, subscription của `api`, `act`, `sync`, notification timer, state đăng nhập và tất cả tên trường trả về.
- Xuất state hook và kiểu `Shop = ReturnType<typeof useShopState>`.
- Không đổi logic nghiệp vụ, cấu trúc dữ liệu, thời gian thông báo hoặc hành vi lưu trữ.
- Module này chỉ chứa hook và type, không xuất React component.

### 2. Tạo module context dùng chung: `src/shop-context.ts` — file mới

- Import `Shop` bằng `import type` từ `useShopState.ts`; không tạo vòng phụ thuộc runtime.
- Xuất `ShopContext` và `useShop()`, không xuất component.
- Context có kiểu `Context<Shop | null>`, default value vẫn là `null`.
- Dùng khóa HMR riêng `techzone.shop-context`:
  1. Nếu `import.meta.hot.data` đã lưu context ở khóa này, sử dụng lại chính object đó.
  2. Nếu chưa có, gọi `createContext<Shop | null>(null)`.
  3. Khi có HMR, lưu object vào cùng khóa để lần đánh giá module tiếp theo dùng lại.
- Không thêm `hot.accept()` hoặc cưỡng bức reload; để Vite tiếp tục lan truyền cập nhật bình thường.
- Không dùng singleton trên `window`/`globalThis` trong mã ứng dụng và không lưu context vào localStorage.
- Khi production không có `import.meta.hot`, module chỉ tạo context ESM thông thường.
- Giữ nguyên thông báo `ShopProvider is missing.` khi hook thực sự được gọi bên ngoài provider.

### 3. Giữ `src/context.tsx` là module chỉ xuất component

- Giữ nguyên default export `ShopProvider`, tránh đổi API import của provider không cần thiết.
- Import state hook từ `useShopState.ts` và context từ `shop-context.ts`.
- Loại bỏ việc tạo context và export `useShop()` khỏi file này.
- Giữ nguyên JSX của provider, auth modal, thông báo, loading bar và các component Astra đang dùng.
- Không thêm barrel re-export hook từ file component, vì sẽ tái tạo mixed refresh boundary.

### 4. Cập nhật consumer

- `src/App.tsx`: import mặc định `ShopProvider` từ `./context`; import `useShop` riêng từ `./shop-context`.
- `src/Admin.tsx`, `src/StorePages.tsx`, `src/ContentPages.tsx`: chuyển import `useShop` sang `./shop-context`.
- Tìm toàn bộ `useShop`, `ShopContext` và `ShopProvider` để bảo đảm mọi consumer dùng cùng module context chuẩn.
- Giữ nguyên cây `ThemeProvider → ShopProvider → Shell`, lazy routes và các guard MEMBER/ADMIN.

## Luồng dữ liệu sau sửa

`api` → `useShopState()` → `ShopProvider` → một `ShopContext` dùng chung → `useShop()` → các consumer.

HMR thay implementation của component/hook nhưng tái sử dụng object context cũ. Một lần tải trang mới hoặc production load tạo lại context theo cơ chế module thông thường. Phiên đăng nhập, giỏ hàng và dữ liệu localStorage không thay đổi schema hay storage key.

## Các ràng buộc và tình huống biên

- Giữ nguyên mọi thay đổi có sẵn của người dùng, đặc biệt `package.json` và các file styling.
- Không chỉnh `src/index.css`, Tailwind setup, font imports, `/styles/global.css` hoặc package Astra. Không tạo phần tử giao diện, màu, kích thước hay font mới.
- Không sửa Vite config hoặc các script `.figma/make/` để xử lý lỗi ở tầng ứng dụng.
- Consumer ngoài provider vẫn phải báo lỗi rõ ràng; không âm thầm tạo store riêng.
- Context cache chỉ tồn tại trong HMR data của module, không làm chia sẻ state giữa browser session hoặc request server.
- Không yêu cầu người dùng xóa localStorage, tạo lại tài khoản hoặc mất giỏ hàng để khôi phục ứng dụng.
- Hook state phải tiếp tục cleanup subscription/timer bình thường dưới StrictMode.
- Nếu quá trình điều tra HMR tìm thấy import context khác ngoài các file nêu trên, chuẩn hóa import đó vào cùng module trong cùng bản sửa; không mở rộng sang tính năng không liên quan.

## Kiểm thử hồi quy

### Kiểm thử tự động mới: `tests/shop-context.test.mjs`

Dùng Node test runner và TypeScript đã có, theo mẫu transpile-in-memory của `tests/service.test.mjs`; không thêm dependency.

1. Consumer render bên trong provider nhận đúng object giá trị đã truyền, không phải fallback.
2. Consumer render ngoài provider ném đúng lỗi hiện có.
3. Đánh giá hai phiên bản module với cùng HMR data giả lập trả về cùng object `ShopContext`.
4. Provider từ phiên bản trước và hook từ phiên bản sau vẫn đọc được cùng giá trị.
5. Module không có HMR vẫn khởi tạo được context với default `null`.

Để chạy trong Node, resolve import React sang file URL, transpile source bằng TypeScript và chỉ thay biểu thức `import.meta.hot` bằng test harness riêng. Không đưa test harness hoặc trạng thái global giả lập vào mã ứng dụng.

### Kiểm tra trình duyệt với HMR thực tế

- Dùng dev server đang được host quản lý; không khởi động server thứ hai.
- Dùng browser context kiểm thử riêng, không xóa dữ liệu preview của người dùng.
- Kiểm tra cold load trang chủ, sản phẩm, tài khoản, checkout và trang quản trị.
- Kiểm tra mở/đóng modal đăng nhập, đăng nhập demo, thêm giỏ hàng và chuyển giữa các route lazy-loaded.
- Ghi nhận `pageerror` và lỗi console trong toàn bộ phiên.
- Sau khi đăng nhập và có giỏ hàng, kích hoạt cập nhật HMR lần lượt cho provider, state-hook module, context module và `App.tsx` bằng thay đổi comment tạm thời có lưu bản gốc và khôi phục trong `finally`.
- Các file chỉ được thay đổi tạm thời là mã nguồn thuộc bản sửa; không dùng CSS hoặc cấu hình của người dùng làm tín hiệu HMR.
- Với cập nhật được React Fast Refresh chấp nhận, modal và state UI hiện có phải tiếp tục hoạt động. Nếu host quyết định full reload, dữ liệu đã lưu vẫn phải nguyên vẹn và ứng dụng không được rơi vào lỗi context.
- Không chấp nhận giải pháp chỉ hoạt động sau khi người dùng tự refresh trang hoặc xóa dữ liệu.
- Xác nhận sau nhiều vòng HMR: header vẫn render, modal mở được, số lượng giỏ đúng, route quản trị vẫn nhận đúng quyền và không xuất hiện `ShopProvider is missing`.

### Lệnh xác minh

1. Format đúng các file TypeScript/TSX đã thay đổi và test mới bằng script `pnpm format`.
2. `node --test tests/shop-context.test.mjs`
3. `node --test tests/service.test.mjs`
4. `pnpm exec tsc --noEmit`
5. `pnpm build`
6. Kiểm tra trình duyệt/HMR như trên, rồi `git diff --check` và rà soát diff để bảo đảm không còn comment kiểm thử, thay đổi CSS, package hoặc cấu hình ngoài phạm vi.

## Điều kiện hoàn thành

- Tải mới và hot reload đều không gây lỗi context trong các luồng đã kiểm tra.
- Giữ nguyên guard ngoài provider và hành vi nghiệp vụ hiện có.
- Kiểm thử context mới, kiểm thử dịch vụ hiện có, TypeScript và production build đều thành công.
- Không mất dữ liệu trình duyệt; không thay đổi giao diện, font hoặc design-system variables.
- Báo cáo kết quả kiểm tra thực sự đã chạy và mọi giới hạn môi trường còn lại; không coi cold-load thành công là bằng chứng đã sửa HMR.
