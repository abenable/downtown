"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export type VendorStatus = "pending" | "approved" | "rejected"

export interface VendorData {
  vendor_admin: {
    id: string
    first_name: string
    last_name: string
    email: string
    customer_id?: string
  }
  vendor: {
    id: string
    name: string
    handle: string
    description: string
    status: VendorStatus
    rejection_reason?: string | null
  }
  is_vendor: boolean
}

/**
 * Check if current customer is a vendor
 */
export async function getVendorMe(): Promise<VendorData | null> {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return null
  }

  try {
    const response = await fetch(`${BACKEND_URL}/vendors/me`, {
      method: "GET",
      headers: {
        ...headers,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching vendor:", error)
    return null
  }
}

/**
 * Create vendor profile for current customer
 */
export async function createVendor(data: {
  vendor: {
    name: string
    handle: string
    description?: string
    phone?: string
    email?: string
  }
  admin: {
    first_name?: string
    last_name?: string
    email: string
    phone?: string
  }
}) {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { success: false, error: "Please log in to your account first" }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/vendors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Failed to create vendor",
      }
    }

    return { success: true, vendor: result.vendor }
  } catch (error) {
    console.error("Error creating vendor:", error)
    return { success: false, error: "Something went wrong" }
  }
}

/**
 * Get vendor products
 */
export async function getVendorProducts() {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { products: [], count: 0 }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/vendors/products`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      return { products: [], count: 0 }
    }

    return await response.json()
  } catch (error) {
    return { products: [], count: 0 }
  }
}

/**
 * Get vendor orders
 */
export async function getVendorOrders() {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { orders: [], count: 0 }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/vendors/orders`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      return { orders: [], count: 0 }
    }

    return await response.json()
  } catch (error) {
    return { orders: [], count: 0 }
  }
}

/**
 * Create vendor product
 */
export async function createVendorProduct(data: {
  title: string
  subtitle?: string
  description?: string
  thumbnail?: string
  material?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  options?: Array<{
    title: string
    values: string[]
  }>
  variants: Array<{
    title: string
    inventory_quantity?: number
    manage_inventory?: boolean
    options?: Record<string, string>
    prices: Array<{
      amount: number
      currency_code: string
    }>
  }>
}) {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const response = await fetch(`${BACKEND_URL}/vendors/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Failed to create product",
      }
    }

    return { success: true, product: result.product }
  } catch (error) {
    return { success: false, error: "Something went wrong" }
  }
}

/**
 * Upload a file to R2/S3 storage
 */
export async function uploadVendorFile(formData: FormData) {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Forward the file to the backend
    const response = await fetch(`${BACKEND_URL}/vendors/uploads`, {
      method: "POST",
      headers: {
        ...headers,
        // Don't set Content-Type - let fetch set it with boundary for multipart
      },
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to upload file",
      }
    }

    return { success: true, url: result.url, filename: result.filename }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: "Failed to upload file" }
  }
}

/**
 * Get a single vendor product
 */
export async function getVendorProduct(productId: string) {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { product: null, error: "Not authenticated" }
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/vendors/products/${productId}`,
      {
        method: "GET",
        headers: {
          ...headers,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return { product: null, error: "Product not found" }
    }

    const data = await response.json()
    return { product: data.product, error: null }
  } catch (error) {
    return { product: null, error: "Failed to fetch product" }
  }
}

/**
 * Update a vendor product
 */
export async function updateVendorProduct(
  productId: string,
  data: {
    title?: string
    description?: string
    status?: "draft" | "published"
  }
) {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/vendors/products/${productId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(data),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Failed to update product",
      }
    }

    return { success: true, product: result.product }
  } catch (error) {
    return { success: false, error: "Something went wrong" }
  }
}

/**
 * Delete a vendor product
 */
export async function deleteVendorProduct(productId: string) {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/vendors/products/${productId}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
        },
      }
    )

    if (!response.ok) {
      const result = await response.json()
      return {
        success: false,
        error: result.message || "Failed to delete product",
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Something went wrong" }
  }
}

export type ProductCategory = {
  id: string
  name: string
  handle: string
  description?: string
  parent_category?: {
    id: string
    name: string
  }
  children?: ProductCategory[]
}

/**
 * Get available product categories for vendors
 */
export async function getVendorCategories(): Promise<{
  categories: ProductCategory[]
  flat_categories: ProductCategory[]
  count: number
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/vendors/categories`, {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      return { categories: [], flat_categories: [], count: 0 }
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching categories:", error)
    return { categories: [], flat_categories: [], count: 0 }
  }
}
