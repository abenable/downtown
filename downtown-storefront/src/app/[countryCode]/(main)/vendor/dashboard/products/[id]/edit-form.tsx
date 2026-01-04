"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateVendorProduct, deleteVendorProduct } from "@lib/data/vendor"

type ProductEditFormProps = {
  product: {
    id: string
    title: string
    description: string
    thumbnail: string
    price: string
    status: string
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

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6"
    >
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Edit Product
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
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

      {/* Publish/Unpublish Section */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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

      <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
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
    </form>
  )
}
