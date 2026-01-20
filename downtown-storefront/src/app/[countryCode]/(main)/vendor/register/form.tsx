"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { createVendor } from "@lib/data/vendor"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface Props {
  customer: HttpTypes.StoreCustomer
}

export default function VendorRegisterForm({ customer }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    shopName: "",
    handle: "",
    description: "",
    phone: customer.phone || "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")

    // Auto-generate handle from shop name
    if (name === "shopName") {
      const handle = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setFormData((prev) => ({ ...prev, handle }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.shopName.trim()) {
      setError("Shop name is required")
      setLoading(false)
      return
    }

    const result = await createVendor({
      vendor: {
        name: formData.shopName,
        handle:
          formData.handle ||
          formData.shopName.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description,
        phone: formData.phone,
        email: customer.email,
      },
      admin: {
        first_name: customer.first_name || undefined,
        last_name: customer.last_name || undefined,
        email: customer.email,
        phone: formData.phone,
      },
    })

    if (!result.success) {
      // If already a vendor, redirect to dashboard
      if (result.error?.includes("already have a vendor account")) {
        router.push("/vendor/dashboard")
        router.refresh()
        return
      }
      setError(result.error || "Failed to create vendor profile")
      setLoading(false)
      return
    }

    // Success - redirect to dashboard
    router.push("/vendor/dashboard")
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop Name *
          </label>
          <input
            type="text"
            name="shopName"
            value={formData.shopName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none"
            placeholder="Your shop name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shop URL
          </label>
          <div className="flex items-center">
            <span className="text-gray-400 text-sm mr-2">
              campusdowntown.com/shop/
            </span>
            <input
              type="text"
              name="handle"
              value={formData.handle}
              onChange={handleChange}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none"
              placeholder="your-shop"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none resize-none"
            placeholder="Tell customers about your shop..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none"
            placeholder="+256 7XX XXX XXX"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Shop..." : "Create My Shop"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          By creating a shop, you agree to our{" "}
          <LocalizedClientLink
            href="/terms"
            className="text-gray-900 hover:underline"
          >
            Vendor Terms
          </LocalizedClientLink>
        </p>
      </form>
    </div>
  )
}
