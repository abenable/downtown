import { HttpTypes } from "@medusajs/types"

export type WishlistItem = {
  id: string
  product_variant_id: string
  wishlist_id: string
  product_variant?: HttpTypes.StoreProductVariant & {
    product?: HttpTypes.StoreProduct
  }
  created_at?: string
  updated_at?: string
}

export type Wishlist = {
  id: string
  customer_id: string
  sales_channel_id: string
  items: WishlistItem[]
  created_at?: string
  updated_at?: string
}

export type WishlistResponse = {
  wishlist: Wishlist
}

export type WishlistShareResponse = {
  token: string
}
