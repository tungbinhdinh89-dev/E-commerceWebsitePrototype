import { createContext, useContext, type Context } from "react"
import type { Shop } from "./useShopState"

const cachedContext = import.meta.hot?.data[
  "techzone.shop-context"
] as Context<Shop | null> | undefined

// Fast Refresh can leave an older provider mounted while consumers update.
export const ShopContext = cachedContext ?? createContext<Shop | null>(null)
if (import.meta.hot) {
  import.meta.hot.data["techzone.shop-context"] = ShopContext
}

export function useShop() {
  const context = useContext(ShopContext)
  if (!context) throw new Error("ShopProvider is missing.")
  return context
}
