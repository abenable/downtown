"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateVendorProduct, deleteVendorProduct } from "@lib/data/vendor"

type Variant = {
  id: string
  title: string
  sku: string | null
  prices: Array<{
    amount: number
    currency_code: string
  }>
  options?: Array<{
    id: string
    value: string
    option_id: string
  }>
  inventory_quantity?: number
  manage_inventory?: boolean
}

type ProductOption = {
  id: string
  title: string
  values: Array<{
    id: string
    value: string
  }>
}

type ProductEditFormProps = {
  product: {
    id: string
    title: string
    description: string
    thumbnail: string
    status: string
    variants: Variant[]
    options: ProductOption[]
  }
}

export default function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description,
    status: product.status,
  })
  const [variants, setVariants] = useState<Variant[]>(product.variants || [])

  const handlePublish = async () => {
    setPublishing(true)
    setError("")
    setSuccess("")

    const result = await updateVendorProduct(product.id, {
      status: "published",
    })

    if (!result.success) {
      setError(result.error || "Failed to publish product")
      setPublishing(false)
      return
    }

    setSuccess("Product published successfully!")
    setFormData({ ...formData, status: "published" })
    setPublishing(false)
    router.refresh()
  }

  const handleUnpublish = async () => {
    setPublishing(true)
    setError("")
    setSuccess("")

    const result = await updateVendorProduct(product.id, {
      status: "draft",
    })

    if (!result.success) {
      setError(result.error || "Failed to unpublish product")
      setPublishing(false)
      return
    }

    setSuccess("Product unpublished (set to draft)")
    setFormData({ ...formData, status: "draft" })
    setPublishing(false)
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const result = await updateVendorProduct(product.id, {
      title: formData.title,
      description: formData.description,
      status: formData.status as "draft" | "published",
    })

    if (!result.success) {
      setError(result.error || "Failed to update product")
      setLoading(false)
      return
    }

    setSuccess("Product updated successfully!")
    setLoading(false)
    router.refresh()
  }

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return
    }

    setDeleting(true)
    setError("")

    const result = await deleteVendorProduct(product.id)

    if (!result.success) {
      setError(result.error || "Failed to delete product")
      setDeleting(false)
      return
    }

    router.push("/vendor/dashboard/products")
    router.refresh()
  }

  const updateVariantPrice = (variantId: string, amount: string) => {
    setVariants(
      variants.map((v) =>
        v.id === variantId
          ? {
              ...v,
              prices: v.prices.map((p, i) =>
                i === 0
                  ? {
                      ...p,
                      amount: Math.round(parseFloat(amount || "0") * 100),
                    }
                  : p
              ),
            }
          : v
      )
    )
  }

  const updateVariantInventory = (variantId: string, quantity: string) => {
    setVariants(
      variants.map((v) =>
        v.id === variantId
          ? { ...v, inventory_quantity: parseInt(quantity || "0", 10) }
          : v
      )
    )
  }

  const getVariantOptionValues = (variant: Variant) => {
    if (!variant.options || variant.options.length === 0) return variant.title
    return variant.options.map((opt) => opt.value).join(" / ")
  }

  const hasMultipleVariants =
    variants.length > 1 || (product.options?.length ?? 0) > 0

  return (
    <div className="space-y-6">
      {/* Product Status Card - At the top */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Product Status
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.status === "published"
                ? "This product is visible to customers"
                : "This product is not visible to customers"}
            </p>
          </div>
          {formData.status === "draft" ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "Publishing..." : "Publish Product"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={publishing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {publishing ? "..." : "Unpublish"}
            </button>
          )}
        </div>
      </div>

      {/* Basic Info Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Product Details
        </h3>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">
              {success}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Title
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </form>

      {/* Variants Section - Show for products with multiple variants */}
      {hasMultipleVariants && variants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Variants & Inventory
          </h3>

          <div className="space-y-4">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {getVariantOptionValues(variant)}
                    </h4>
                    {variant.sku && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        SKU: {variant.sku}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price (UGX)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={
                        variant.prices?.[0]?.amount
                          ? (variant.prices[0].amount / 100).toString()
                          : ""
                      }
                      onChange={(e) =>
                        updateVariantPrice(variant.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={variant.inventory_quantity ?? 0}
                      onChange={(e) =>
                        updateVariantInventory(variant.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Note: Full variant editing is coming soon. For now, you can view and
            update prices and stock.
          </p>
        </div>
      )}

      {/* Simple Product - Single variant without options */}
      {!hasMultipleVariants && variants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Pricing & Inventory
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (UGX)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={
                  variants[0]?.prices?.[0]?.amount
                    ? (variants[0].prices[0].amount / 100).toString()
                    : ""
                }
                onChange={(e) =>
                  updateVariantPrice(variants[0].id, e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={variants[0]?.inventory_quantity ?? 0}
                onChange={(e) =>
                  updateVariantInventory(variants[0].id, e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                placeholder="Enter quantity"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save & Delete Buttons - At the bottom */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
