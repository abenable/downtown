import { Metadata } from "next"
import { redirect } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { getVendorMe } from "@lib/data/vendor"
import NewProductForm from "./form"

export const metadata: Metadata = {
  title: "Add Product - Vendor Dashboard",
  description: "Add a new product to your shop",
}

export default async function NewProductPage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/account?redirect=/vendor/dashboard/products/new")
  }

  const vendorData = await getVendorMe()

  if (!vendorData?.is_vendor) {
    redirect("/vendor/register")
  }

  return <NewProductForm />
}
