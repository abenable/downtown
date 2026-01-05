"use client"

import WishlistButton from "@modules/wishlist/components/wishlist-button"

type ProductPreviewWishlistProps = {
  variantId: string
}

export default function ProductPreviewWishlist({
  variantId,
}: ProductPreviewWishlistProps) {
  return (
    <div
      className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <WishlistButton
        variantId={variantId}
        className="bg-white/90 dark:bg-gray-800/90 shadow-sm"
      />
    </div>
  )
}
