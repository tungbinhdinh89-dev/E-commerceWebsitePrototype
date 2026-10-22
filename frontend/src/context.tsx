import { type ReactNode } from "react"
import { Button, Modal, Toast } from "@figma/astraui"
import { InputField } from "./fields"
import { Lock, LogIn } from "lucide-react"
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
    passwordConfirmation,
    setPasswordConfirmation,
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
          if (register)
            await api.register(name, email, password, passwordConfirmation)
          else await api.login(email, password)
        } catch (error) {
          setAuthError((error as Error).message)
          throw error
        }
      },
      register
        ? "Tạo tài khoản thành công. Vui lòng đăng nhập."
        : "Đăng nhập thành công.",
    )
    if (ok) {
      setAuth(register)
      setRegister(false)
      setPassword("")
      setPasswordConfirmation("")
    }
  }
  return (
    <ShopContext.Provider value={shop}>
      {!shop.db.ready ? (
        <main className="container page" role="status">
          <h1>
            {shop.db.error
              ? "Chưa thể tải dữ liệu cửa hàng"
              : "Đang tải cửa hàng…"}
          </h1>
          {shop.db.error && (
            <>
              <p role="alert">{shop.db.error}</p>
              <Button
                onClick={() => {
                  void api.refresh().catch(() => {})
                }}
              >
                Thử lại
              </Button>
            </>
          )}
        </main>
      ) : (
        <>
          {shop.db.error && (
            <div className="container form-error" role="alert">
              {shop.db.error}{" "}
              <Button
                variant="subtle"
                onClick={() => {
                  void api.refresh().catch(() => {})
                }}
              >
                Thử lại
              </Button>
            </div>
          )}
          {children}
        </>
      )}
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
          {register && (
            <InputField
              label="Xác nhận mật khẩu"
              type="password"
              required
              minLength={8}
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
              autoComplete="new-password"
            />
          )}
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
