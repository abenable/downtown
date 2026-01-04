import { Metadata } from "next"
import { redirect } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getVendorMe } from "@lib/data/vendor"
import VendorRegisterForm from "./form"

export const metadata: Metadata = {
  title: "Become a Vendor",
  description: "Create your vendor shop on Campus DownTown",
}

export default async function VendorRegisterPage() {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="content-container">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-gray-900">
              Create Your Shop
            </h1>
            <p className="text-gray-500 mt-2">
              Hi {customer.first_name}! Set up your vendor profile to start
              selling.
            </p>
          </div>

          <VendorRegisterForm customer={customer} />
        </div>
      </div>
    </div>
  )
}
