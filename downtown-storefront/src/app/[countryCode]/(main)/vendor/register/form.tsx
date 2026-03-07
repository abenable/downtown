"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { createVendor } from "@lib/data/vendor"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface Props {
  customer: HttpTypes.StoreCustomer
}

const formatPhone = (phone: string) => {
  const compact = phone.replace(/\s+/g, "")

  if (compact.startsWith("+256")) {
    return compact.slice(1)
  }

  if (compact.startsWith("0")) {
    return `256${compact.slice(1)}`
  }

  if (compact.startsWith("256")) {
    return compact
  }

  return compact
}

const isValidUgPhone = (phone: string) => /^(2567\d{8}|07\d{8}|\+2567\d{8})$/.test(phone.replace(/\s+/g, ""))

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
    setError("")

    if (name === "shopName") {
      const handle = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      setFormData((prev) => ({ ...prev, shopName: value, handle }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.shopName.trim()) {
      setError("Shop name is required.")
      setLoading(false)
      return
    }

    if (formData.phone && !isValidUgPhone(formData.phone)) {
      setError("Use a valid Uganda phone number, for example 2567XXXXXXXX.")
      setLoading(false)
      return
    }

    const result = await createVendor({
      vendor: {
        name: formData.shopName.trim(),
        handle:
          formData.handle ||
          formData.shopName.toLowerCase().replace(/\s+/g, "-"),
        description: formData.description.trim(),
        phone: formData.phone ? formatPhone(formData.phone) : undefined,
        email: customer.email,
      },
      admin: {
        first_name: customer.first_name || undefined,
        last_name: customer.last_name || undefined,
        email: customer.email,
        phone: formData.phone ? formatPhone(formData.phone) : undefined,
      },
    })

    if (!result.success) {
      if (result.error?.includes("already have a vendor account")) {
        router.push("/vendor/dashboard")
        router.refresh()
        return
      }

      setError(result.error || "Failed to create vendor profile")
      setLoading(false)
      return
    }

    router.push("/vendor/dashboard")
    router.refresh()
  }

  return (
    <div className="grid gap-6 small:grid-cols-[1.15fr_0.85fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[30px] border border-stone-200 bg-white p-8 shadow-[0_24px_70px_rgba(57,45,24,0.08)]"
      >
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
            Seller launch
          </p>
          <h2 className="mt-3 font-serif text-3xl text-stone-900">Set up your shop</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Start with the essentials. You can refine products, payout setup, and storefront
            details after approval.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Shop name
            </span>
            <input
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
              placeholder="Maker Space Kampala"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Shop URL
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <span className="text-sm text-stone-500">campusdowntown.com/vendors/</span>
              <input
                type="text"
                name="handle"
                value={formData.handle}
                onChange={handleChange}
                className="min-w-0 flex-1 bg-transparent text-stone-900 outline-none"
                placeholder="maker-space-kampala"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Description
            </span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white resize-none"
              placeholder="What do you sell, who is it for, and why should students buy from you?"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Uganda phone number
            </span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
              placeholder="2567XXXXXXXX"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating shop..." : "Create my shop"}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-stone-500">
          By creating a shop, you agree to our{" "}
          <LocalizedClientLink href="/terms" className="text-stone-900 hover:underline">
            Vendor Terms
          </LocalizedClientLink>
          .
        </p>
      </form>

      <div className="rounded-[30px] border border-stone-200 bg-[#1c1711] p-8 text-stone-50 shadow-[0_24px_70px_rgba(31,23,15,0.18)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-300">
          What happens next
        </p>
        <h3 className="mt-3 font-serif text-3xl">Campus-ready selling</h3>
        <div className="mt-6 space-y-4 text-sm leading-6 text-stone-300">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            Your application goes to review so the marketplace stays trustworthy.
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            After approval, you can publish products, set mobile money payouts, and manage orders.
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            Use a real Uganda mobile number from the start to keep approval and payout setup smooth.
          </div>
        </div>
      </div>
    </div>
  )
}
