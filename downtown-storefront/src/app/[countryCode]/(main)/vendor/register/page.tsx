import { Metadata } from "next"
import { redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"
import { retrieveCustomer } from "@lib/data/customer"
import { getVendorMe } from "@lib/data/vendor"
import VendorRegisterForm from "./form"

export const metadata: Metadata = {
  title: "Become a Vendor",
  description: "Create your vendor shop on Campus DownTown",
}

export default async function VendorRegisterPage() {
  // Disable caching to ensure fresh vendor status check
  noStore()

  const customer = await retrieveCustomer()

  if (!customer) {
    // Redirect to login/signup with return URL
    redirect("/account?redirect=/vendor/register")
  }

  const vendorData = await getVendorMe()

  if (vendorData?.is_vendor) {
    // Already a vendor, redirect to dashboard
    redirect("/vendor/dashboard")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e9dcc4_0%,#f4efe5_34%,#faf8f3_72%)] py-12">
      <div className="content-container">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">
              Campus Downtown
            </p>
            <h1 className="mt-4 font-serif text-4xl text-stone-900 small:text-5xl">
              Create Your Shop
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Hi {customer.first_name}. Build a storefront that feels credible from day one,
              with Uganda-first contact details and a cleaner path into seller approval.
            </p>
          </div>

          <VendorRegisterForm customer={customer} />
        </div>
      </div>
    </div>
  )
}
