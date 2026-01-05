"use client"

import { Wishlist, WishlistItem } from "types/wishlist"
import { useWishlist } from "@lib/context/wishlist-context"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { Trash } from "@medusajs/icons"

type WishlistItemCardProps = {
  item: WishlistItem
  region?: HttpTypes.StoreRegion
}

function WishlistItemCard({ item, region }: WishlistItemCardProps) {
  const { removeItem, isPending } = useWishlist()
  const variant = item.product_variant
  const product = variant?.product

  const handleRemove = async () => {
    await removeItem(item.id)
  }

  if (!product) {
    return null
  }

  return (
    <div className="flex gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="flex-shrink-0"
      >
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="small"
        />
      </LocalizedClientLink>

      <div className="flex-1 min-w-0">
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate hover:text-gray-700 dark:hover:text-gray-300">
            {product.title}
          </h3>
        </LocalizedClientLink>

        {variant && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {variant.title !== "Default" && variant.title}
          </p>
        )}

        {variant?.calculated_price &&
          variant.calculated_price.calculated_amount != null && (
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: variant.calculated_price.currency_code || "USD",
              }).format(variant.calculated_price.calculated_amount / 100)}
            </p>
          )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
          aria-label="Remove from wishlist"
        >
          <Trash />
        </button>
      </div>
    </div>
  )
}

type WishlistTemplateProps = {
  wishlist: Wishlist | null
  region?: HttpTypes.StoreRegion
}

export default function WishlistTemplate({
  wishlist,
  region,
}: WishlistTemplateProps) {
  const items = wishlist?.items || []

  if (!wishlist || items.length === 0) {
    return (
      <div className="w-full flex flex-col items-center gap-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Save your favorite items to your wishlist by clicking the heart icon
            on any product.
          </p>
        </div>
        <LocalizedClientLink href="/store">
          <Button variant="secondary" size="large">
            Continue Shopping
          </Button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          My Wishlist
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <WishlistItemCard key={item.id} item={item} region={region} />
        ))}
      </div>
    </div>
  )
}
