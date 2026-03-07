import { Metadata } from "next"
import { redirect } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getVendorMe, getVendorPaymentSettings } from "@lib/data/vendor"
import VendorSettingsForm from "./form"

export const metadata: Metadata = {
  title: "Settings - Vendor Dashboard",
  description: "Manage your shop settings",
}

export default async function VendorSettingsPage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/account?redirect=/vendor/dashboard/settings")
  }

  const vendorData = await getVendorMe()

  if (!vendorData?.is_vendor) {
    redirect("/vendor/register")
  }

  const paymentSettings = await getVendorPaymentSettings()

  return (
    <VendorSettingsForm
      vendorData={vendorData}
      customer={customer}
      paymentSettings={paymentSettings}
    />
  )
}
