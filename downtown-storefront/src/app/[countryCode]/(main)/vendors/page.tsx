import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

type Props = {
  params: Promise<{ countryCode: string }>
}

async function getVendors() {
  const backendUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  try {
    const response = await fetch(`${backendUrl}/store/vendors?limit=50`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      return { vendors: [], count: 0 }
    }

    return response.json()
  } catch {
    return { vendors: [], count: 0 }
  }
}

export const metadata: Metadata = {
  title: "Vendors | Downtown",
  description: "Browse all vendors on Downtown marketplace",
}

export default async function VendorsPage({ params }: Props) {
  const { countryCode } = await params
  const { vendors, count } = await getVendors()

  return (
    <div className="content-container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Vendors</h1>
        <p className="text-gray-600">
          Discover {count} amazing vendors selling on Downtown
        </p>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No vendors found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor: any) => (
            <Link
              key={vendor.id}
              href={`/${countryCode}/vendors/${vendor.handle}`}
              className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start gap-4">
                {vendor.logo ? (
                  <div className="w-16 h-16 relative flex-shrink-0">
                    <Image
                      src={vendor.logo}
                      alt={vendor.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-2xl font-bold">
                    {vendor.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {vendor.name}
                  </h2>
                  {vendor.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {vendor.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {vendor.product_count} product
                    {vendor.product_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
