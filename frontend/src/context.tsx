import { type ReactNode } from "react"
import { Button, Modal, Toast } from "@figma/astraui"
import { InputField } from "./fields"
import { Lock, LogIn, ShieldCheck } from "lucide-react"
import { api } from "./service"
import { ShopContext } from "./shop-context"
import useShopState from "./useShopState"

export default function ShopProvider({ children }: { children: ReactNode }) {
  const shop = useShopState()
  const {
    auth,
    setAuth,
    register,
    setRegister,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    busy,
    act,
    authError,
    setAuthError,
  } = shop
  async function submit() {
    setAuthError("")
    const ok = await act(
      async () => {
        try {
          if (register) await api.register(name, email, password)
          else await api.login(email, password)
        } catch (error) {
          setAuthError((error as Error).message)
          throw error
        }
      },
      register
        ? "Tạo tài khoản thành công. Chào mừng đến TechZone!"
        : "Đăng nhập thành công.",
    )
    if (ok) {
      setAuth(false)
      setPassword("")
    }
  }
  return (
    <ShopContext.Provider value={shop}>
      {children}
      <Modal
        isOpen={auth}
        onClose={() => setAuth(false)}
        title={register ? "Tạo tài khoản TechZone" : "Chào mừng trở lại!"}
        className="tz-modal"
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <p className="muted">
            Đăng nhập để mua sắm, theo dõi đơn hàng và nhận ưu đãi dành riêng
            cho bạn.
          </p>
          {register && (
            <InputField
              label="Họ và tên"
              required
              value={name}
              onChange={setName}
              placeholder="Nguyễn Minh Anh"
              autoComplete="name"
            />
          )}
          <InputField
            label="Email"
            type="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="ban@example.com"
            autoComplete="email"
          />
          <InputField
            label="Mật khẩu"
            type="password"
            minLength={register ? 8 : undefined}
            required
            value={password}
            onChange={setPassword}
            placeholder="Ít nhất 8 ký tự"
            prefix={<Lock size={16} />}
            autoComplete={register ? "new-password" : "current-password"}
          />
          {authError && (
            <p className="form-error" role="alert">
              {authError}
            </p>
          )}
          <Button type="submit" disabled={busy} iconStart={<LogIn size={16} />}>
            {busy ? "Đang xử lý..." : register ? "Tạo tài khoản" : "Đăng nhập"}
          </Button>
          <Button
            type="button"
            variant="subtle"
            onClick={() => {
              setRegister(!register)
              setAuthError("")
            }}
          >
            {register
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký ngay"}
          </Button>
          <div className="demo-box">
            <div className="flex items-center gap-md">
              <ShieldCheck size={16} />
              <strong>Tài khoản demo</strong>
            </div>
            <p>
              Mật khẩu chung: <strong>Techzone123</strong>
            </p>
            <div className="flex flex-wrap gap-md">
              <Button
                type="button"
                variant="neutral"
                size="small"
                onClick={() => {
                  setRegister(false)
                  setEmail("member@techzone.vn")
                  setPassword("Techzone123")
                }}
              >
                Khách hàng
              </Button>
              <Button
                type="button"
                variant="neutral"
                size="small"
                onClick={() => {
                  setRegister(false)
                  setEmail("admin@techzone.vn")
                  setPassword("Techzone123")
                }}
              >
                Quản trị viên
              </Button>
            </div>
            <p className="fine">
              Bản mô phỏng frontend. Không nhập mật khẩu thật.
            </p>
          </div>
        </form>
      </Modal>
      {shop.notice && (
        <div className="toast-wrap" role="status">
          <Toast
            message={shop.notice.text}
            variant={shop.notice.error ? "error" : "success"}
            progress={100}
            showCancel={false}
            onDismiss={() => shop.setNotice(null)}
          />
        </div>
      )}
      {busy && <div className="loading-bar" aria-label="Đang xử lý" />}
    </ShopContext.Provider>
  )
}
