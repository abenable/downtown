import { model } from "@medusajs/framework/utils";
import VendorAdmin from "./vendor-admin";

const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  handle: model.text().unique(),
  name: model.text().searchable(),
  logo: model.text().nullable(),
  description: model.text().nullable(),
  phone: model.text().nullable(),
  email: model.text().nullable(),
  is_active: model.boolean().default(true),
  // Vendor approval status: pending, approved, rejected
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
  rejection_reason: model.text().nullable(),
  approved_at: model.dateTime().nullable(),
  admins: model.hasMany(() => VendorAdmin, {
    mappedBy: "vendor",
  }),
});

export default Vendor;
