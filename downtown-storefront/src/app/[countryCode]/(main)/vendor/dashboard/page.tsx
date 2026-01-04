import { Metadata } from "next"
import { redirect } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import {
  getVendorMe,
  getVendorProducts,
  getVendorOrders,
} from "@lib/data/vendor"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Vendor Dashboard",
  description: "Manage your Campus DownTown vendor shop",
}

function PendingApprovalUI({
  vendorName,
  customerName,
}: {
  vendorName: string
  customerName: string
}) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="content-container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {vendorName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome, {customerName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LocalizedClientLink
                href="/"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                View Store
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/account"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                My Account
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-yellow-600 dark:text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Application Under Review
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Thank you for applying to sell on Campus DownTown! Our team is
            reviewing your application. This usually takes 1-2 business days.
            We&apos;ll notify you once your shop is approved.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-left">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              What happens next?
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ✓
                </span>
                <span>Application submitted successfully</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  ⏳
                </span>
                <span>Our team reviews your shop details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>Once approved, you can start adding products</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function RejectedUI({
  vendorName,
  customerName,
  rejectionReason,
}: {
  vendorName: string
  customerName: string
  rejectionReason?: string
}) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="content-container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {vendorName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome, {customerName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LocalizedClientLink
                href="/"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                View Store
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/account"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                My Account
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Application Not Approved
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Unfortunately, your vendor application was not approved at this
            time.
          </p>
          {rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8 text-left">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                Reason:
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {rejectionReason}
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-left">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              What can you do?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              If you believe this was a mistake or have addressed the concerns,
              you can submit a new application.
            </p>
            <LocalizedClientLink
              href="/vendor/register"
              className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Apply Again
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function VendorDashboardPage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/account?redirect=/vendor/dashboard")
  }

  const vendorData = await getVendorMe()

  if (!vendorData?.is_vendor) {
    redirect("/vendor/register")
  }

  const vendorName = vendorData.vendor?.name || "Vendor Dashboard"
  const customerName = customer.first_name || "Vendor"
  const vendorStatus = vendorData.vendor?.status || "pending"

  // Show pending UI if not approved
  if (vendorStatus === "pending") {
    return (
      <PendingApprovalUI vendorName={vendorName} customerName={customerName} />
    )
  }

  // Show rejected UI
  if (vendorStatus === "rejected") {
    return (
      <RejectedUI
        vendorName={vendorName}
        customerName={customerName}
        rejectionReason={vendorData.vendor?.rejection_reason}
      />
    )
  }

  // Approved vendor - show full dashboard
  const [productsData, ordersData] = await Promise.all([
    getVendorProducts(),
    getVendorOrders(),
  ])

  const stats = {
    products: productsData.count || 0,
    orders: ordersData.count || 0,
    revenue: 0, // TODO: Calculate from orders
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="content-container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {vendorName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {customerName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LocalizedClientLink
                href="/"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                View Store
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/account"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                My Account
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 small:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total Products
            </p>
            <p className="text-3xl font-light text-gray-900 dark:text-white">
              {stats.products}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Total Orders
            </p>
            <p className="text-3xl font-light text-gray-900 dark:text-white">
              {stats.orders}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Revenue
            </p>
            <p className="text-3xl font-light text-gray-900 dark:text-white">
              UGX {stats.revenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
          <LocalizedClientLink
            href="/vendor/dashboard/products"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Products
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your products
                </p>
              </div>
            </div>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/vendor/dashboard/orders"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Orders
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View and manage orders
                </p>
              </div>
            </div>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/vendor/dashboard/products/new"
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl p-6 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 dark:bg-gray-900/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Add Product</h3>
                <p className="text-sm text-white/70 dark:text-gray-900/70">
                  List a new product
                </p>
              </div>
            </div>
          </LocalizedClientLink>

          <LocalizedClientLink
            href="/vendor/dashboard/settings"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Settings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Shop settings & profile
                </p>
              </div>
            </div>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
