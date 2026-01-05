import { getWishlist } from "@lib/data/wishlist"
import { getRegion } from "@lib/data/regions"
import WishlistTemplate from "@modules/wishlist/templates/wishlist-template"
import { WishlistProvider } from "@lib/context/wishlist-context"

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function WishlistPage({ params }: Props) {
  const { countryCode } = await params
  const [wishlist, region] = await Promise.all([
    getWishlist(),
    getRegion(countryCode),
  ])

  if (!region) {
    return null
  }

  return (
    <WishlistProvider initialWishlist={wishlist}>
      <div className="w-full" data-testid="wishlist-page">
        <WishlistTemplate wishlist={wishlist} region={region} />
      </div>
    </WishlistProvider>
  )
}
