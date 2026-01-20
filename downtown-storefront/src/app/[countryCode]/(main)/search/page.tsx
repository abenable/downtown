"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { MagnifyingGlassMini } from "@medusajs/icons"

type Product = {
  id: string
  title: string
  description: string | null
  handle: string
  thumbnail: string | null
  price: number
  currency_code: string
  vendor_name: string | null
  category_name: string | null
}

export default function SearchPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const [countryCode, setCountryCode] = useState<string>("")
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const query = searchParams.get("q") || ""
  const categoryId = searchParams.get("category_id") || ""
  const vendorId = searchParams.get("vendor_id") || ""
  const minPrice = searchParams.get("min_price") || ""
  const maxPrice = searchParams.get("max_price") || ""

  useEffect(() => {
    params.then((p) => setCountryCode(p.countryCode))
  }, [params])

  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)

      const backendUrl =
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (categoryId) params.set("category_id", categoryId)
      if (vendorId) params.set("vendor_id", vendorId)
      if (minPrice) params.set("min_price", minPrice)
      if (maxPrice) params.set("max_price", maxPrice)

      try {
        const response = await fetch(
          `${backendUrl}/store/search?${params.toString()}`
        )
        const data = await response.json()

        setProducts(data.products || [])
        setTotal(data.total || 0)
      } catch {
        setProducts([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [query, categoryId, vendorId, minPrice, maxPrice])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchQuery) {
      params.set("q", searchQuery)
    } else {
      params.delete("q")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="content-container py-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
          <div className="flex-1 relative">
            <MagnifyingGlassMini className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-black rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Searching...</p>
        </div>
      ) : (
        <>
          {query && (
            <p className="text-gray-600 mb-4">
              {total} result{total !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {query
                ? "No products found. Try different search terms."
                : "Enter a search term to find products."}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
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
                    {product.vendor_name && (
                      <p className="text-xs text-gray-500 truncate">
                        by {product.vendor_name}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {product.currency_code.toUpperCase()}{" "}
                      {Number(product.price).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
