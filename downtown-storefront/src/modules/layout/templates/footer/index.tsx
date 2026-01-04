import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  })
  const productCategories = await listCategories()

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 w-full bg-gray-50 dark:bg-gray-900">
      <div className="content-container flex flex-col w-full">
        <div className="py-16 small:py-20">
          <div className="grid grid-cols-1 small:grid-cols-4 gap-8 small:gap-12">
            {/* Brand Section */}
            <div className="small:col-span-1">
              <LocalizedClientLink
                href="/"
                className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white"
              >
                Campus DownTown
              </LocalizedClientLink>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your campus marketplace for students, by students.
              </p>
            </div>

            {/* Categories */}
            {productCategories && productCategories?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Categories
                </h4>
                <ul className="space-y-3" data-testid="footer-categories">
                  {productCategories?.slice(0, 5).map((c) => {
                    if (c.parent_category) return null
                    return (
                      <li key={c.id}>
                        <LocalizedClientLink
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                          href={`/categories/${c.handle}`}
                          data-testid="category-link"
                        >
                          {c.name}
                        </LocalizedClientLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Collections */}
            {collections && collections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  Collections
                </h4>
                <ul className="space-y-3">
                  {collections?.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        href={`/collections/${c.handle}`}
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                Company
              </h4>
              <ul className="space-y-3">
                <li>
                  <LocalizedClientLink
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    href="/store"
                  >
                    Shop All
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    href="/account"
                  >
                    My Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    href="/cart"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 py-6 flex flex-col small:flex-row justify-between items-center gap-4">
          <Text className="text-xs text-gray-400">
            © {new Date().getFullYear()} Campus DownTown. All rights reserved.
          </Text>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-400">Privacy Policy</span>
            <span className="text-xs text-gray-400">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
