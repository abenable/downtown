"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createVendorProduct, uploadVendorFile } from "@lib/data/vendor"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]

type VariantData = {
  title: string
  sku: string
  price: string
  inventory_quantity: string
  options: Record<string, string>
}

export default function NewProductForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [hasVariants, setHasVariants] = useState(false)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    thumbnail: "",
    sku: "",
    inventory_quantity: "1",
    material: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    condition: "new",
  })

  // Variants state for size-based products
  const [variants, setVariants] = useState<VariantData[]>([])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Upload to server via server action
    setUploading(true)
    setError("")

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("files", file)

      const result = await uploadVendorFile(uploadFormData)

      if (result.success && result.url) {
        setFormData({ ...formData, thumbnail: result.url })
      } else {
        setError(result.error || "Failed to upload image")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Failed to upload image")
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, thumbnail: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size))
      setVariants(variants.filter((v) => v.options.Size !== size))
    } else {
      setSelectedSizes([...selectedSizes, size])
      setVariants([
        ...variants,
        {
          title: size,
          sku: `${formData.sku || "SKU"}-${size}`,
          price: formData.price,
          inventory_quantity: "1",
          options: { Size: size },
        },
      ])
    }
  }

  const updateVariant = (
    index: number,
    field: keyof VariantData,
    value: string
  ) => {
    const updated = [...variants]
    if (field === "options") return
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let productVariants: any[] = []

      if (hasVariants && variants.length > 0) {
        // Multiple size variants
        productVariants = variants.map((v) => ({
          title: v.title,
          sku: v.sku || undefined,
          inventory_quantity: parseInt(v.inventory_quantity) || 0,
          manage_inventory: true,
          options: v.options,
          prices: [
            {
              amount: parseFloat(v.price || formData.price) * 100,
              currency_code: "ugx",
            },
          ],
        }))
      } else {
        // Single variant (no sizes)
        productVariants = [
          {
            title: "Default",
            sku: formData.sku || undefined,
            inventory_quantity: parseInt(formData.inventory_quantity) || 0,
            manage_inventory: true,
            prices: [
              {
                amount: parseFloat(formData.price) * 100,
                currency_code: "ugx",
              },
            ],
          },
        ]
      }

      const productData: any = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        thumbnail: formData.thumbnail || undefined,
        material: formData.material || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        variants: productVariants,
        metadata: {
          condition: formData.condition,
        },
      }

      // Add options if we have size variants
      if (hasVariants && selectedSizes.length > 0) {
        productData.options = [
          {
            title: "Size",
            values: selectedSizes,
          },
        ]
      }

      const result = await createVendorProduct(productData)

      if (!result.success) {
        setError(result.error || "Failed to create product")
        setLoading(false)
        return
      }

      router.push("/vendor/dashboard/products")
      router.refresh()
    } catch (err) {
      console.error("Error creating product:", err)
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="content-container py-4">
          <div className="flex items-center gap-4">
            <LocalizedClientLink
              href="/vendor/dashboard/products"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </LocalizedClientLink>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add New Product
            </h1>
          </div>
        </div>
      </div>

      <div className="content-container py-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Campus Hoodie"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="Brief tagline for your product"
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
                    placeholder="Describe your product in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Condition
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Product Image
              </h2>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Choose File"}
                </button>
                {formData.thumbnail ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600 dark:text-green-400">
                      ✓ Image uploaded
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    No file chosen
                  </span>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Pricing
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price (UGX) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full max-w-xs px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Inventory & SKU */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Inventory
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU (Stock Keeping Unit)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., HOODIE-BLK-001"
                  />
                </div>

                {!hasVariants && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.inventory_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inventory_quantity: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                      placeholder="1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Size Variants */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Size Options
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => {
                      setHasVariants(e.target.checked)
                      if (!e.target.checked) {
                        setSelectedSizes([])
                        setVariants([])
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    This product has size variants
                  </span>
                </label>
              </div>

              {hasVariants && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Select Available Sizes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_OPTIONS.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selectedSizes.includes(size)
                              ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                              : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {variants.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Variant Details
                      </label>
                      <div className="space-y-3">
                        {variants.map((variant, index) => (
                          <div
                            key={variant.options.Size}
                            className="grid grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Size
                              </label>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {variant.options.Size}
                              </span>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                SKU
                              </label>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) =>
                                  updateVariant(index, "sku", e.target.value)
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded focus:outline-none dark:bg-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Price
                              </label>
                              <input
                                type="number"
                                value={variant.price}
                                onChange={(e) =>
                                  updateVariant(index, "price", e.target.value)
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded focus:outline-none dark:bg-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Stock
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={variant.inventory_quantity}
                                onChange={(e) =>
                                  updateVariant(
                                    index,
                                    "inventory_quantity",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded focus:outline-none dark:bg-gray-600 dark:text-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Additional Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 100% Cotton"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (grams)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.length}
                    onChange={(e) =>
                      setFormData({ ...formData, length: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({ ...formData, width: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                    placeholder="5"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <LocalizedClientLink
                href="/vendor/dashboard/products"
                className="flex-1 text-center py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </LocalizedClientLink>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
