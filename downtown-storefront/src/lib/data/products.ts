"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+metadata,+tags,",
          ...queryParams,
        },
        headers,
        next,
        cache: "no-store",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
}> => {
  const limit = queryParams?.limit || 12

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      limit: 100,
    },
    countryCode,
  })

  const sortedProducts = sortProducts(products, sortBy)

  const pageParam = (page - 1) * limit

  const nextPage = count > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count,
    },
    nextPage,
    queryParams,
  }
}

/**
 * Get reviews for a product
 */
export const getProductReviews = async (
  productId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  reviews: Array<{
    id: string
    title: string
    content: string
    rating: number
    first_name: string
    last_name: string
    status: string
    product_id: string
    customer_id: string | null
    created_at: string
    updated_at: string
  }>
  count: number
  average_rating: number | null
}> => {
  const next = {
    ...(await getCacheOptions("reviews")),
  }

  return sdk.client.fetch<{
    reviews: Array<{
      id: string
      title: string
      content: string
      rating: number
      first_name: string
      last_name: string
      status: string
      product_id: string
      customer_id: string | null
      created_at: string
      updated_at: string
    }>
    count: number
    average_rating: number | null
  }>(`/store/products/${productId}/reviews`, {
    method: "GET",
    query: { limit, offset },
    next,
    cache: "no-store",
  })
}

/**
 * Submit a review for a product
 */
export const addProductReview = async (data: {
  product_id: string
  content: string
  rating: number
}): Promise<{
  review: {
    id: string
    title: string | null
    content: string
    rating: number
    first_name: string
    last_name: string
    status: string
    product_id: string
    customer_id: string | null
    created_at: string
    updated_at: string
  }
}> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client.fetch<{
    review: {
      id: string
      title: string | null
      content: string
      rating: number
      first_name: string
      last_name: string
      status: string
      product_id: string
      customer_id: string | null
      created_at: string
      updated_at: string
    }
  }>(`/store/reviews`, {
    method: "POST",
    body: data,
    headers,
  })
}
