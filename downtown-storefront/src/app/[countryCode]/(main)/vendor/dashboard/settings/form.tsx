"use client"

import { useMemo, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  VendorData,
  VendorPaymentSettings,
  updateVendorPaymentSettings,
  updateVendorProfile,
} from "@lib/data/vendor"

interface Props {
  vendorData: VendorData
  customer: HttpTypes.StoreCustomer
  paymentSettings: VendorPaymentSettings
}

type MobileNetwork = "mtn" | "airtel"

const normalizeUgPhone = (phone: string) => phone.replace(/\s+/g, "")

const isValidUgPhone = (phone: string) => {
  const compact = normalizeUgPhone(phone)
  return (
    compact.length === 0 ||
    /^2567\d{8}$/.test(compact) ||
    /^\+2567\d{8}$/.test(compact) ||
    /^07\d{8}$/.test(compact)
  )
}

const formatUgPhone = (phone: string) => {
  const compact = normalizeUgPhone(phone)

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

export default function VendorSettingsForm({
  vendorData,
  customer,
  paymentSettings,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: vendorData.vendor?.name || "",
    description: vendorData.vendor?.description || "",
    shopPhone: vendorData.vendor?.phone || customer.phone || "",
    adminPhone: vendorData.vendor_admin?.phone || customer.phone || "",
    payoutPhone: paymentSettings.payout_phone_number || vendorData.vendor?.payout_phone_number || "",
    payoutNetwork:
      paymentSettings.payout_network || vendorData.vendor?.payout_network || "",
  })

  const statusTone = useMemo(() => {
    switch (vendorData.vendor.status) {
      case "approved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "rejected":
        return "bg-rose-100 text-rose-800 border-rose-200"
      default:
        return "bg-amber-100 text-amber-800 border-amber-200"
    }
  }, [vendorData.vendor.status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    if (!formData.name.trim()) {
      setError("Shop name is required.")
      setSaving(false)
      return
    }

    if (!isValidUgPhone(formData.shopPhone) || !isValidUgPhone(formData.adminPhone)) {
      setError("Shop and admin phone numbers must be valid Uganda mobile numbers.")
      setSaving(false)
      return
    }

    if (
      formData.payoutPhone &&
      (!isValidUgPhone(formData.payoutPhone) || !formData.payoutNetwork)
    ) {
      setError("Payout setup requires a valid Uganda phone number and network.")
      setSaving(false)
      return
    }

    const [profileResult, payoutResult] = await Promise.all([
      updateVendorProfile({
        vendor: {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          phone: formData.shopPhone ? formatUgPhone(formData.shopPhone) : null,
          email: customer.email || null,
        },
        admin: {
          first_name: customer.first_name || null,
          last_name: customer.last_name || null,
          phone: formData.adminPhone ? formatUgPhone(formData.adminPhone) : null,
        },
      }),
      formData.payoutPhone && formData.payoutNetwork
        ? updateVendorPaymentSettings({
            payout_phone_number: formatUgPhone(formData.payoutPhone),
            payout_network: formData.payoutNetwork as MobileNetwork,
          })
        : Promise.resolve({ success: true }),
    ])

    if (!profileResult.success) {
      setError(profileResult.error || "Failed to update your vendor profile.")
      setSaving(false)
      return
    }

    if (!payoutResult.success) {
      setError(payoutResult.error || "Vendor profile saved, but payout settings failed.")
      setSaving(false)
      return
    }

    setSuccess("Vendor profile and payout setup updated.")
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f1e7_0%,#f3eee2_38%,#fbfaf7_100%)]">
      <div className="content-container py-8">
        <div className="mb-8 rounded-[28px] border border-stone-200/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(57,45,24,0.08)] backdrop-blur">
          <div className="flex flex-col gap-5 small:flex-row small:items-end small:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">
                Vendor Studio
              </p>
              <h1 className="font-serif text-4xl text-stone-900">Shop settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                Keep your storefront details clean, payout-ready, and aligned with how
                customers in Kampala discover and trust campus sellers.
              </p>
            </div>
            <div className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-medium capitalize ${statusTone}`}>
              {vendorData.vendor.status}
            </div>
          </div>
        </div>

        <div className="grid gap-6 small:grid-cols-[1.35fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_24px_70px_rgba(57,45,24,0.08)]"
          >
            <div className="mb-6">
              <h2 className="font-serif text-2xl text-stone-900">Store identity</h2>
              <p className="mt-1 text-sm text-stone-600">
                These details appear across your vendor presence and are also used by the
                operations team during review.
              </p>
            </div>

            {success && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Shop name</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
                  placeholder="Downtown Prints"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
                  placeholder="What you sell, where you source it, and why campus buyers trust you."
                />
              </label>

              <div className="grid gap-5 small:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    Shop phone
                  </span>
                  <input
                    type="tel"
                    value={formData.shopPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, shopPhone: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
                    placeholder="2567XXXXXXXX"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">
                    Admin phone
                  </span>
                  <input
                    type="tel"
                    value={formData.adminPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, adminPhone: e.target.value })
                    }
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:bg-white"
                    placeholder="2567XXXXXXXX"
                  />
                </label>
              </div>

              <div className="mt-2 rounded-[24px] border border-stone-200 bg-stone-50/80 p-5">
                <div className="mb-4">
                  <h3 className="font-serif text-xl text-stone-900">Payout setup</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    This number is where your mobile money payouts should land.
                  </p>
                </div>

                <div className="grid gap-4 small:grid-cols-[1fr_220px]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-stone-700">
                      Payout phone
                    </span>
                    <input
                      type="tel"
                      value={formData.payoutPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, payoutPhone: e.target.value })
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                      placeholder="2567XXXXXXXX"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-stone-700">
                      Network
                    </span>
                    <select
                      value={formData.payoutNetwork}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payoutNetwork: e.target.value as MobileNetwork | "",
                        })
                      }
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900"
                    >
                      <option value="">Select network</option>
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                    </select>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving changes..." : "Save vendor settings"}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-stone-200 bg-[#20170f] p-6 text-stone-50 shadow-[0_24px_70px_rgba(31,23,15,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-300">
                Live snapshot
              </p>
              <h2 className="mt-3 font-serif text-3xl">{formData.name || "Your shop"}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-300">
                {formData.description || "Use this space to tell buyers what makes your shop distinct on campus."}
              </p>
              <div className="mt-6 grid gap-3 text-sm text-stone-200">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="block text-xs uppercase tracking-[0.2em] text-stone-400">
                    Contact
                  </span>
                  <span className="mt-1 block">{formData.shopPhone || "Not set"}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="block text-xs uppercase tracking-[0.2em] text-stone-400">
                    Payout
                  </span>
                  <span className="mt-1 block">
                    {formData.payoutPhone
                      ? `${formData.payoutPhone} ${formData.payoutNetwork ? `(${formData.payoutNetwork.toUpperCase()})` : ""}`
                      : "Configure mobile money payout"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(57,45,24,0.08)]">
              <h2 className="font-serif text-2xl text-stone-900">Account links</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Customer identity still lives under your regular account. Use these links
                when you need address or password changes.
              </p>
              <div className="mt-5 flex flex-col gap-3 text-sm">
                <LocalizedClientLink
                  href="/vendor/dashboard"
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-stone-900 transition hover:border-stone-900"
                >
                  Back to dashboard
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/account"
                  className="rounded-2xl border border-stone-200 px-4 py-3 text-stone-900 transition hover:border-stone-900"
                >
                  Manage customer account
                </LocalizedClientLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
