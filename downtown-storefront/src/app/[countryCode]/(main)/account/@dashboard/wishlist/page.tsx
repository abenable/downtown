import { getWishlist } from "@lib/data/wishlist"
import { getRegion } from "@lib/data/regions"
import WishlistTemplate from "@modules/wishlist/templates/wishlist-template"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { toSerializable } from "@lib/util/to-serializable"

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function WishlistPage({ params }: Props) {
  const { countryCode } = await params
  const [wishlist, region] = await Promise.all([
    getWishlist(),
    getRegion(countryCode),
  ])

  const safeWishlist = wishlist ? toSerializable(wishlist) : null

  if (!region) {
    return null
  }

  return (
    <WishlistProvider initialWishlist={safeWishlist}>
      <div className="w-full" data-testid="wishlist-page">
        <WishlistTemplate wishlist={safeWishlist} region={region} />
      </div>
    </WishlistProvider>
  )
}
