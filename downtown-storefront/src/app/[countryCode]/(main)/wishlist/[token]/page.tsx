import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSharedWishlist } from "@lib/data/wishlist"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

export const metadata: Metadata = {
  title: "Shared Wishlist",
  description: "View a shared wishlist",
}

type Props = {
  params: Promise<{
    countryCode: string
    token: string
  }>
}

export default async function SharedWishlistPage({ params }: Props) {
  const { token, countryCode } = await params
  const wishlist = await getSharedWishlist(token)

  if (!wishlist) {
    notFound()
  }

  return (
    <div className="content-container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shared Wishlist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {wishlist.items?.length || 0} items
          </p>
        </div>

        {!wishlist.items || wishlist.items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              This wishlist is empty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4">
            {wishlist.items.map((item) => (
              <LocalizedClientLink
                key={item.id}
                href={`/products/${item.product_variant?.product?.handle}`}
                className="group"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Thumbnail
                    thumbnail={item.product_variant?.product?.thumbnail}
                    images={item.product_variant?.product?.images}
                    size="full"
                  />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    {item.product_variant?.product?.title}
                  </h3>
                  {item.product_variant?.title &&
                    item.product_variant.title !== "Default" && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.product_variant.title}
                      </p>
                    )}
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <LocalizedClientLink
            href="/store"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Browse our store →
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
