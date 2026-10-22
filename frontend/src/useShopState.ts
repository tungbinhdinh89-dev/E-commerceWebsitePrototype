import { useEffect, useState, useSyncExternalStore } from "react"

import { api } from "./service"

export default function useShopState() {
  const db = useSyncExternalStore(api.subscribe, api.snapshot)

  const [busy, setBusy] = useState(false)

  const [notice, setNotice] = useState<{
    text: string

    error: boolean
  } | null>(null)

  const [auth, setAuth] = useState(false)

  const [register, setRegister] = useState(false)

  const [name, setName] = useState("")

  const [email, setEmail] = useState("")

  const [password, setPassword] = useState("")

  const [passwordConfirmation, setPasswordConfirmation] = useState("")

  const [authError, setAuthError] = useState("")

  const notify = (text: string, error = false) => setNotice({ text, error })

  useEffect(() => {
    const reload = () => {
      void api.refresh().catch(() => {})
    }

    reload()

    window.addEventListener("focus", reload)

    return () => window.removeEventListener("focus", reload)
  }, [])

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4500)

      return () => clearTimeout(timer)
    }
  }, [notice])

  async function act(work: () => unknown | Promise<unknown>, success?: string) {
    if (busy) return false

    setBusy(true)

    try {
      await work()

      if (success) notify(success)

      return true
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi, vui lòng thử lại.",

        true,
      )

      return false
    } finally {
      setBusy(false)
    }
  }

  function sync(work: () => unknown | Promise<unknown>) {
    void act(work)
  }

  const user = api.user(db)

  return {
    db,

    user,

    busy,

    act,

    sync,

    notify,

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

    authError,

    setAuthError,

    notice,

    setNotice,
  }
}

export type Shop = ReturnType<typeof useShopState>
