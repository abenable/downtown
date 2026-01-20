import { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { StarSolid } from "@medusajs/icons"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

async function getVendor(handle: string) {
  const backendUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  try {
    const response = await fetch(`${backendUrl}/store/vendors/${handle}`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const data = await getVendor(handle)

  if (!data) {
    return {
      title: "Vendor Not Found",
    }
  }

  return {
    title: `${data.vendor.name} | Downtown`,
    description: data.vendor.description || `Shop products from ${data.vendor.name}`,
  }
}

export default async function VendorPage({ params }: Props) {
  const { countryCode, handle } = await params
  const data = await getVendor(handle)

  if (!data) {
    notFound()
  }

  const { vendor, products } = data

  return (
    <div className="content-container py-6">
      {/* Vendor Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 p-6 bg-white rounded-lg shadow-sm">
        {vendor.logo && (
          <div className="w-24 h-24 md:w-32 md:h-32 relative flex-shrink-0">
            <Image
              src={vendor.logo}
              alt={vendor.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {vendor.name}
          </h1>
          {vendor.description && (
            <p className="text-gray-600 mb-4">{vendor.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <span className="font-medium">{vendor.stats.product_count}</span>
              <span>Products</span>
            </div>
            {vendor.stats.review_count > 0 && (
              <>
                <div className="flex items-center gap-1">
                  <StarSolid className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">
                    {vendor.stats.average_rating}
                  </span>
                  <span>({vendor.stats.review_count} reviews)</span>
                </div>
              </>
            )}
            <div>
              Member since{" "}
              {new Date(vendor.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Products ({products.length})
        </h2>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          This vendor hasn&apos;t listed any products yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <Link
              key={product.id}
              href={`/${countryCode}/products/${product.handle}`}
              className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square relative bg-gray-100">
                {product.thumbnail ? (
                  <Image
                    src={product.thumbnail}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 truncate">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {product.currency_code.toUpperCase()}{" "}
                  {Number(product.price).toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
