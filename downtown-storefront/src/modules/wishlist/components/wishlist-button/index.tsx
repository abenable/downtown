"use client"

import { useState } from "react"
import { useWishlist } from "@lib/context/wishlist-context"
import Heart from "@modules/common/icons/heart"
import HeartFilled from "@modules/common/icons/heart-filled"
import { clx } from "@medusajs/ui"

type WishlistButtonProps = {
  variantId: string
  className?: string
  showText?: boolean
}

export default function WishlistButton({
  variantId,
  className,
  showText = false,
}: WishlistButtonProps) {
  const { isInWishlist, addItem, removeItem, wishlist, isPending } =
    useWishlist()
  const [isUpdating, setIsUpdating] = useState(false)

  const inWishlist = isInWishlist(variantId)

  // Find the wishlist item ID if it exists
  const wishlistItem = wishlist?.items.find(
    (item) => item.product_variant_id === variantId
  )

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isUpdating || isPending) return

    setIsUpdating(true)
    try {
      if (inWishlist && wishlistItem) {
        await removeItem(wishlistItem.id)
      } else {
        await addItem(variantId)
      }
    } catch (error) {
      console.error("Wishlist action failed:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUpdating || isPending}
      className={clx(
        "flex items-center justify-center gap-2 p-2 rounded-full transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      data-testid="wishlist-button"
    >
      {inWishlist ? (
        <HeartFilled
          size="20"
          color="#ef4444"
          className="transition-transform hover:scale-110"
        />
      ) : (
        <Heart
          size="20"
          className="text-gray-500 dark:text-gray-400 transition-transform hover:scale-110"
        />
      )}
      {showText && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {inWishlist ? "Saved" : "Save"}
        </span>
      )}
    </button>
  )
}
