"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import { revalidateTag } from "next/cache"
import {
  Wishlist,
  WishlistResponse,
  WishlistShareResponse,
} from "types/wishlist"

/**
 * Get the current customer's wishlist
 */
export async function getWishlist(): Promise<Wishlist | null> {
  const headers = await getAuthHeaders()

  if (!("authorization" in headers)) {
    return null
  }

  const next = {
    ...(await getCacheOptions("wishlist")),
  }

  try {
    const { wishlist } = await sdk.client.fetch<WishlistResponse>(
      "/store/customers/me/wishlists",
      {
        method: "GET",
        headers,
        next,
        cache: "force-cache",
      }
    )
    return wishlist
  } catch (error) {
    // Customer might not have a wishlist yet
    return null
  }
}

/**
 * Create a new wishlist for the current customer
 */
export async function createWishlist(): Promise<Wishlist> {
  const headers = await getAuthHeaders()

  try {
    const { wishlist } = await sdk.client.fetch<WishlistResponse>(
      "/store/customers/me/wishlists",
      {
        method: "POST",
        headers,
      }
    )

    const cacheTag = await getCacheTag("wishlist")
    if (cacheTag) {
      revalidateTag(cacheTag)
    }

    return wishlist
  } catch (error: any) {
    // If a wishlist already exists (e.g. concurrent create or bad GET), fall back to fetching it.
    const message = error?.message || ""
    const status = error?.status || error?.statusCode
    if (status === 422 || message.includes("already has a wishlist")) {
      const existing = await getWishlist()
      if (existing) {
        return existing
      }
    }

    throw error
  }
}

/**
 * Add an item to the wishlist
 */
export async function addToWishlist(variantId: string): Promise<Wishlist> {
  const headers = await getAuthHeaders()

  // First try to get existing wishlist, create one if it doesn't exist
  let existingWishlist = await getWishlist()
  if (!existingWishlist) {
    existingWishlist = await createWishlist()
  }

  const { wishlist } = await sdk.client.fetch<WishlistResponse>(
    "/store/customers/me/wishlists/items",
    {
      method: "POST",
      headers,
      body: {
        variant_id: variantId,
      },
    }
  )

  const cacheTag = await getCacheTag("wishlist")
  if (cacheTag) {
    revalidateTag(cacheTag)
  }

  return wishlist
}

/**
 * Remove an item from the wishlist
 */
export async function removeFromWishlist(itemId: string): Promise<Wishlist> {
  const headers = await getAuthHeaders()

  const { wishlist } = await sdk.client.fetch<WishlistResponse>(
    `/store/customers/me/wishlists/items/${itemId}`,
    {
      method: "DELETE",
      headers,
    }
  )

  const cacheTag = await getCacheTag("wishlist")
  if (cacheTag) {
    revalidateTag(cacheTag)
  }

  return wishlist
}

/**
 * Generate a share token for the wishlist
 */
export async function shareWishlist(): Promise<string> {
  const headers = await getAuthHeaders()

  const { token } = await sdk.client.fetch<WishlistShareResponse>(
    "/store/customers/me/wishlists/share",
    {
      method: "POST",
      headers,
    }
  )

  return token
}

/**
 * Get a shared wishlist by token
 */
export async function getSharedWishlist(
  token: string
): Promise<Wishlist | null> {
  try {
    const { wishlist } = await sdk.client.fetch<WishlistResponse>(
      `/store/wishlists/${token}`,
      {
        method: "GET",
      }
    )
    return wishlist
  } catch (error) {
    return null
  }
}

/**
 * Check if a variant is in the wishlist
 */
export async function isInWishlist(variantId: string): Promise<boolean> {
  const wishlist = await getWishlist()
  if (!wishlist) return false

  return wishlist.items.some((item) => item.product_variant_id === variantId)
}
