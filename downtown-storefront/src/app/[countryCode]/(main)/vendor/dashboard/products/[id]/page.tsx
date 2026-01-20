import { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getVendorMe, getVendorProduct } from "@lib/data/vendor"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductEditForm from "./edit-form"

export const metadata: Metadata = {
  title: "Edit Product - Vendor Dashboard",
  description: "Edit your product",
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function VendorProductDetailPage({ params }: Props) {
  const { id } = await params
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect(`/account?redirect=/vendor/dashboard/products/${id}`)
  }

  const vendorData = await getVendorMe()

  if (!vendorData?.is_vendor) {
    redirect("/vendor/register")
  }

  const { product, error } = await getVendorProduct(id)

  if (error || !product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="content-container py-4">
          <div className="flex items-center justify-between">
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
                {product.title}
              </h1>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  product.status === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {product.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Product Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-gray-300 dark:text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {product.title}
              </h2>
              {product.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {product.description}
                </p>
              )}
              {product.variants?.[0]?.prices?.[0] && (
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {product.variants[0].prices[0].currency_code.toUpperCase()}{" "}
                  {(
                    product.variants[0].prices[0].amount / 100
                  ).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <ProductEditForm
            product={{
              id: product.id,
              title: product.title,
              description: product.description || "",
              thumbnail: product.thumbnail || "",
              status: product.status,
              variants: product.variants || [],
              options: product.options || [],
            }}
          />
        </div>
      </div>
    </div>
  )
}
