import { Metadata } from "next"
import { redirect } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getVendorMe, getVendorProducts } from "@lib/data/vendor"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Products - Vendor Dashboard",
  description: "Manage your products",
}

export default async function VendorProductsPage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/account?redirect=/vendor/dashboard/products")
  }

  const vendorData = await getVendorMe()

  if (!vendorData?.is_vendor) {
    redirect("/vendor/register")
  }

  const { products } = await getVendorProducts()

  const getPrice = (product: any) => {
    if (product.variants?.[0]?.prices?.[0]) {
      const price = product.variants[0].prices[0]
      return `${price.currency_code.toUpperCase()} ${(
        price.amount / 100
      ).toLocaleString()}`
    }
    return "No price set"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="content-container py-4">
          <div className="flex items-center justify-between">
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
              <h1 className="text-lg font-semibold text-gray-900">Products</h1>
            </div>
            <LocalizedClientLink
              href="/vendor/dashboard/products/new"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Add Product
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      <div className="content-container py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by adding your first product
            </p>
            <LocalizedClientLink
              href="/vendor/dashboard/products/new"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Your First Product
            </LocalizedClientLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6">
            {products.map((product: any) => (
              <LocalizedClientLink
                key={product.id}
                href={`/vendor/dashboard/products/${product.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-300"
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
                  <span
                    className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium ${
                      product.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-500">{getPrice(product)}</p>
                </div>
              </LocalizedClientLink>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
