import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getVendorMe } from "@lib/data/vendor"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Become a Vendor",
  description:
    "Start selling on Campus DownTown. Join our community of student vendors.",
}

export default async function VendorPage() {
  const customer = await retrieveCustomer()
  const vendorData = await getVendorMe()
  const isVendor = vendorData?.is_vendor

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="content-container py-16 small:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl small:text-5xl font-light mb-6 text-gray-900 dark:text-white">
              Become a Vendor
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
              Turn your passion into profit. Join hundreds of student vendors
              already selling to your campus community.
            </p>
            <div className="flex gap-4 justify-center">
              {isVendor ? (
                <LocalizedClientLink
                  href="/vendor/dashboard"
                  className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Go to Dashboard
                </LocalizedClientLink>
              ) : customer ? (
                <LocalizedClientLink
                  href="/vendor/register"
                  className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Become a Vendor
                </LocalizedClientLink>
              ) : (
                <>
                  <LocalizedClientLink
                    href="/account?redirect=/vendor/register"
                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Start Selling
                  </LocalizedClientLink>
                  <LocalizedClientLink
                    href="/account"
                    className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </LocalizedClientLink>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="content-container py-16 small:py-20">
        <h2 className="text-2xl font-light text-center mb-12 text-gray-900 dark:text-white">
          Why sell with us?
        </h2>
        <div className="grid grid-cols-1 small:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Campus Audience
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Reach thousands of students right on your campus. No need to
              market elsewhere.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-gray-600 dark:text-gray-300"
                className="w-7 h-7 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Low Fees
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Keep more of what you earn. Our commission rates are designed for
              student budgets.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Easy Setup
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Get started in minutes. Add products, set prices, and start
              selling today.
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gray-50 dark:bg-gray-800/50">
        <div className="content-container py-16 small:py-20">
          <h2 className="text-2xl font-light text-center mb-12 text-gray-900 dark:text-white">
            How it works
          </h2>
          <div className="grid grid-cols-1 small:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Create Account",
                desc: "Sign up with your student email",
              },
              {
                step: "2",
                title: "Set Up Shop",
                desc: "Add your products and prices",
              },
              {
                step: "3",
                title: "Get Orders",
                desc: "Customers discover and buy",
              },
              {
                step: "4",
                title: "Get Paid",
                desc: "Receive payouts to your account",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                  {item.step}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="content-container py-16 small:py-20 text-center">
        <h2 className="text-2xl font-light mb-4 text-gray-900 dark:text-white">
          Ready to start selling?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Join Campus DownTown and reach your campus community today.
        </p>
        {isVendor ? (
          <LocalizedClientLink
            href="/vendor/dashboard"
            className="inline-block px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Go to Dashboard
          </LocalizedClientLink>
        ) : customer ? (
          <LocalizedClientLink
            href="/vendor/register"
            className="inline-block px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Create Your Shop
          </LocalizedClientLink>
        ) : (
          <LocalizedClientLink
            href="/account?redirect=/vendor/register"
            className="inline-block px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Sign Up to Start Selling
          </LocalizedClientLink>
        )}
      </div>
    </div>
  )
}
