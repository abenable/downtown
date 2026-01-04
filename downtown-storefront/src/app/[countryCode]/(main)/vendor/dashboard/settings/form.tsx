"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface VendorData {
  vendor_admin: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  vendor: {
    id: string
    name: string
    handle: string
    description: string
  }
}

interface Props {
  vendorData: VendorData
  customer: HttpTypes.StoreCustomer
}

export default function VendorSettingsForm({ vendorData, customer }: Props) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: vendorData.vendor?.name || "",
    description: vendorData.vendor?.description || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    // TODO: Implement vendor update API
    setTimeout(() => {
      setSuccess("Settings updated successfully!")
      setSaving(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="content-container py-4">
          <div className="flex items-center gap-4">
            <LocalizedClientLink
              href="/vendor/dashboard"
              className="text-gray-400 hover:text-gray-600"
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
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      <div className="content-container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Shop Settings */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Shop Settings
            </h2>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Your shop name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="Describe your shop..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Account Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-gray-900">
                  {customer.first_name} {customer.last_name}
                </p>
              </div>
              <div className="pt-2">
                <LocalizedClientLink
                  href="/account"
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Manage account settings →
                </LocalizedClientLink>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help?
            </h2>
            <p className="text-gray-500 mb-4">
              Contact our vendor support team for assistance with your shop.
            </p>
            <a
              href="mailto:support@campusdowntown.com"
              className="inline-flex items-center gap-2 text-gray-900 font-medium hover:underline"
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
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              support@campusdowntown.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
