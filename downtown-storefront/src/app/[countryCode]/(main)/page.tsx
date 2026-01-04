import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Campus DownTown | Your Campus Marketplace",
  description:
    "Your campus marketplace. Discover products from fellow students and local vendors.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <section className="py-16 small:py-20">
        <div className="content-container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
              Shop by Collection
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Explore curated selections from our vendors
            </p>
          </div>
        </div>
        <ul className="flex flex-col">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </section>
    </>
  )
}
