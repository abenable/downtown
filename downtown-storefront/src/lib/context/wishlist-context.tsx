"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from "react"
import { Wishlist } from "types/wishlist"
import {
  getWishlist,
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  createWishlist,
} from "@lib/data/wishlist"

type WishlistContextType = {
  wishlist: Wishlist | null
  isLoading: boolean
  isPending: boolean
  addItem: (variantId: string) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  isInWishlist: (variantId: string) => boolean
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({
  children,
  initialWishlist,
}: {
  children: React.ReactNode
  initialWishlist?: Wishlist | null
}) {
  const [wishlist, setWishlist] = useState<Wishlist | null>(
    initialWishlist ?? null
  )
  const [isLoading, setIsLoading] = useState(!initialWishlist)
  const [isPending, startTransition] = useTransition()

  const refreshWishlist = useCallback(async () => {
    try {
      const data = await getWishlist()
      setWishlist(data)
    } catch (error) {
      console.error("Failed to fetch wishlist:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialWishlist) {
      refreshWishlist()
    }
  }, [initialWishlist, refreshWishlist])

  const addItem = useCallback(async (variantId: string) => {
    startTransition(async () => {
      try {
        const updatedWishlist = await addToWishlistAction(variantId)
        setWishlist(updatedWishlist)
      } catch (error) {
        console.error("Failed to add item to wishlist:", error)
        throw error
      }
    })
  }, [])

  const removeItem = useCallback(async (itemId: string) => {
    startTransition(async () => {
      try {
        const updatedWishlist = await removeFromWishlistAction(itemId)
        setWishlist(updatedWishlist)
      } catch (error) {
        console.error("Failed to remove item from wishlist:", error)
        throw error
      }
    })
  }, [])

  const isInWishlist = useCallback(
    (variantId: string): boolean => {
      if (!wishlist) return false
      return wishlist.items.some(
        (item) => item.product_variant_id === variantId
      )
    },
    [wishlist]
  )

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        isPending,
        addItem,
        removeItem,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
