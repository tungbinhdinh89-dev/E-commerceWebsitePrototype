import { useState } from "react"
import { Button } from "@figma/astraui"
import { InputField } from "./fields"
import { useShop } from "./shop-context"
import { api } from "./service"

export default function PasswordForm({ memberId }: { memberId?: string }) {
  const { act, busy } = useShop()
  const [current, setCurrent] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  return <form className="surface form-stack" onSubmit={async (event) => {
    event.preventDefault()
    const bytes = new TextEncoder().encode(password).length
    if (bytes < 8 || bytes > 72 || password !== confirmation) {
      setError("Mật khẩu cần 8–72 byte và xác nhận phải trùng khớp.")
      return
    }
    setError("")
    const saved = await act(
      () => memberId ? api.resetPassword(memberId, password, confirmation) : api.changePassword(current, password, confirmation),
      "Đã cập nhật mật khẩu và vô hiệu hóa các phiên đăng nhập cũ.",
    )
    if (saved) { setCurrent(""); setPassword(""); setConfirmation("") }
  }}>
    <h3>{memberId ? "Đặt lại mật khẩu thành viên" : "Đổi mật khẩu"}</h3>
    {!memberId && <InputField label="Mật khẩu hiện tại" type="password" required value={current} onChange={setCurrent} />}
    <InputField label="Mật khẩu mới" type="password" required value={password} onChange={setPassword} />
    <InputField label="Xác nhận mật khẩu mới" type="password" required value={confirmation} onChange={setConfirmation} />
    {error && <p role="alert">{error}</p>}
    <Button type="submit" disabled={busy}>Lưu mật khẩu</Button>
  </form>
}
