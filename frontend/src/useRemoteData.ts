import { useEffect, useState } from "react"
import { api } from "./service"
import { useShop } from "./shop-context"
import type { PageResult } from "./data"

export function useRemoteList<T>(
  resource: string,
  parameters: Record<string, string | number | undefined> = {},
  enabled = true,
) {
  const { db } = useShop()
  const signature = JSON.stringify(parameters)
  const [result, setResult] = useState<PageResult<T>>({
    items: [],
    pagination: { page: 1, perPage: 12, total: 0, totalPages: 1 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    const controller = new AbortController()
    if (!enabled) {
      setResult({
        items: [],
        pagination: { page: 1, perPage: 12, total: 0, totalPages: 1 },
      })
      setLoading(false)
      return () => controller.abort()
    }
    setLoading(true)
    setError("")
    api
      .list<T>(resource, JSON.parse(signature), controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data)
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [resource, signature, db.revision, enabled])
  return { ...result, loading, error }
}
export function useRemoteItem<T>(resource: string, id: string | undefined) {
  const { db } = useShop()
  const [item, setItem] = useState<T | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    const controller = new AbortController()
    setItem(null)
    setError("")
    if (id)
      api
        .item<T>(resource, id, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setItem(data)
        })
        .catch((failure: Error) => {
          if (!controller.signal.aborted) setError(failure.message)
        })
    return () => controller.abort()
  }, [resource, id, db.revision])
  return { item, error }
}
