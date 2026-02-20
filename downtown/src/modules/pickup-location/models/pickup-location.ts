import { model } from "@medusajs/framework/utils";

const PickupLocation = model.define("pickup_location", {
  id: model.id().primaryKey(),
  name: model.text(),
  address: model.text(),
  city: model.text(),
  phone: model.text().nullable(),
  is_active: model.boolean().default(true),
  opening_hours: model.text().nullable(), // JSON string with hours
  metadata: model.json().nullable(),
});

export default PickupLocation;
