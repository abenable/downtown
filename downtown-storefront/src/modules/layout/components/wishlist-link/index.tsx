"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Heart from "@modules/common/icons/heart"
import { useWishlist } from "@lib/context/wishlist-context"

export default function WishlistLink() {
  const { wishlist } = useWishlist()
  const itemCount = wishlist?.items?.length ?? 0

  return (
    <LocalizedClientLink
      className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      href="/account/wishlist"
      data-testid="nav-wishlist-link"
    >
      <Heart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </LocalizedClientLink>
  )
}
