"use client"

import { useState, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  createVendorProduct,
  uploadVendorFile,
  ProductCategory,
} from "@lib/data/vendor"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Option definitions
const CONDITION_OPTIONS = ["New", "Used", "Refurbished"]
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
const COLOR_OPTIONS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#78350F" },
  { name: "Navy", hex: "#1E3A5F" },
]

type VariantData = {
  id: string
  title: string
  price: string
  inventory_quantity: string
  options: Record<string, string>
}

type Props = {
  categories: ProductCategory[]
}

// Generate variant title from options
const generateVariantTitle = (options: Record<string, string>) => {
  return Object.values(options).filter(Boolean).join(" / ") || "Default"
}

export default function NewProductForm({ categories }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  // Option toggles
  const [hasConditionVariants, setHasConditionVariants] = useState(false)
  const [hasColorVariants, setHasColorVariants] = useState(false)
  const [hasSizeVariants, setHasSizeVariants] = useState(false)

  // Selected option values
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])

  // Selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    inventory_quantity: "1",
    price: "",
  })

  // Store custom variant data (prices and inventory per variant)
  const [variantCustomData, setVariantCustomData] = useState<
    Record<string, { price: string; inventory_quantity: string }>
  >({})

  // Generate all variant combinations based on selected options
  const variants = useMemo(() => {
    const conditions =
      hasConditionVariants && selectedConditions.length > 0
        ? selectedConditions
        : [""]
    const colors =
      hasColorVariants && selectedColors.length > 0 ? selectedColors : [""]
    const sizes =
      hasSizeVariants && selectedSizes.length > 0 ? selectedSizes : [""]

    const generatedVariants: VariantData[] = []

    for (const condition of conditions) {
      for (const color of colors) {
        for (const size of sizes) {
          const options: Record<string, string> = {}
          if (condition) options.Condition = condition
          if (color) options.Color = color
          if (size) options.Size = size

          // Only create variants if at least one option is selected
          if (Object.keys(options).length === 0) continue

          const variantKey = Object.values(options).join("-")
          const customData = variantCustomData[variantKey]

          generatedVariants.push({
            id: variantKey,
            title: generateVariantTitle(options),
            price: customData?.price || "",
            inventory_quantity: customData?.inventory_quantity || "1",
            options,
          })
        }
      }
    }

    return generatedVariants
  }, [
    hasConditionVariants,
    hasColorVariants,
    hasSizeVariants,
    selectedConditions,
    selectedColors,
    selectedSizes,
    variantCustomData,
  ])

  const hasAnyVariants =
    (hasConditionVariants && selectedConditions.length > 0) ||
    (hasColorVariants && selectedColors.length > 0) ||
    (hasSizeVariants && selectedSizes.length > 0)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

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

  const toggleOption = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  const updateVariantData = (
    variantKey: string,
    field: "price" | "inventory_quantity",
    value: string
  ) => {
    setVariantCustomData((prev) => ({
      ...prev,
      [variantKey]: {
        ...prev[variantKey],
        price: prev[variantKey]?.price || "",
        inventory_quantity: prev[variantKey]?.inventory_quantity || "1",
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let productVariants: any[] = []
      let productOptions: { title: string; values: string[] }[] = []

      if (hasAnyVariants && variants.length > 0) {
        // Build options array
        if (hasConditionVariants && selectedConditions.length > 0) {
          productOptions.push({
            title: "Condition",
            values: selectedConditions,
          })
        }
        if (hasColorVariants && selectedColors.length > 0) {
          productOptions.push({
            title: "Color",
            values: selectedColors,
          })
        }
        if (hasSizeVariants && selectedSizes.length > 0) {
          productOptions.push({
            title: "Size",
            values: selectedSizes,
          })
        }

        // Build variants array
        productVariants = variants.map((v) => ({
          title: v.title,
          inventory_quantity: parseInt(v.inventory_quantity) || 0,
          manage_inventory: true,
          options: v.options,
          prices: [
            {
              amount: parseFloat(v.price || "0") * 100,
              currency_code: "ugx",
            },
          ],
        }))
      } else {
        // Single variant (no options selected)
        productVariants = [
          {
            title: "Default",
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
        description: formData.description || undefined,
        thumbnail: formData.thumbnail || undefined,
        variants: productVariants,
        category_ids: selectedCategoryId ? [selectedCategoryId] : undefined,
      }

      // Add options if we have variants
      if (productOptions.length > 0) {
        productData.options = productOptions
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

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <optgroup key={category.id} label={category.name}>
                        {category.children && category.children.length > 0 ? (
                          category.children.map((child) => (
                            <option key={child.id} value={child.id}>
                              {child.name}
                            </option>
                          ))
                        ) : (
                          <option value={category.id}>{category.name}</option>
                        )}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose the category that best fits your product
                  </p>
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

            {/* Price & Inventory (only for simple products without variants) */}
            {!hasAnyVariants && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Price & Inventory
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:bg-gray-700 dark:text-white"
                      placeholder="50000"
                    />
                  </div>

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
                </div>
              </div>
            )}

            {/* Product Variants */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Product Variants
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Enable options to create product variants. Each combination will
                be a separate variant with its own inventory.
              </p>

              {/* Condition Option */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={hasConditionVariants}
                    onChange={(e) => {
                      setHasConditionVariants(e.target.checked)
                      if (!e.target.checked) {
                        setSelectedConditions([])
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Condition (New / Used / Refurbished)
                  </span>
                </label>

                {hasConditionVariants && (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {CONDITION_OPTIONS.map((condition) => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() =>
                          toggleOption(
                            condition,
                            selectedConditions,
                            setSelectedConditions
                          )
                        }
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedConditions.includes(condition)
                            ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                            : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Option */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={hasColorVariants}
                    onChange={(e) => {
                      setHasColorVariants(e.target.checked)
                      if (!e.target.checked) {
                        setSelectedColors([])
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </span>
                </label>

                {hasColorVariants && (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() =>
                          toggleOption(
                            color.name,
                            selectedColors,
                            setSelectedColors
                          )
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedColors.includes(color.name)
                            ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                            : "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Size Option */}
              <div className="pb-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={hasSizeVariants}
                    onChange={(e) => {
                      setHasSizeVariants(e.target.checked)
                      if (!e.target.checked) {
                        setSelectedSizes([])
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Size
                  </span>
                </label>

                {hasSizeVariants && (
                  <div className="flex flex-wrap gap-2 ml-6">
                    {SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          toggleOption(size, selectedSizes, setSelectedSizes)
                        }
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
                )}
              </div>
            </div>

            {/* Variant Details */}
            {hasAnyVariants && variants.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Variant Details
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Set stock quantity and optionally customize prices for each
                  variant. ({variants.length} variant
                  {variants.length > 1 ? "s" : ""})
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Variant
                        </label>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {variant.title}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Price (UGX)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariantData(
                              variant.id,
                              "price",
                              e.target.value
                            )
                          }
                          placeholder={formData.price || "Use base price"}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded focus:outline-none dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Stock *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={variant.inventory_quantity}
                          onChange={(e) =>
                            updateVariantData(
                              variant.id,
                              "inventory_quantity",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded focus:outline-none dark:bg-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
