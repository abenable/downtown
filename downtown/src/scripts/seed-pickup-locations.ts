import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PICKUP_LOCATION_MODULE } from "../modules/pickup-location";
import type PickupLocationModuleService from "../modules/pickup-location/service";

/**
 * Seed pickup locations for Downtown marketplace
 *
 * Run with: npx medusa exec src/scripts/seed-pickup-locations.ts
 */
export default async function seedPickupLocations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const pickupLocationService: PickupLocationModuleService =
    container.resolve(PICKUP_LOCATION_MODULE);

  logger.info("Seeding pickup locations...");

  // Check if Makerere location already exists
  const existingLocations = await pickupLocationService.listPickupLocations({
    name: "Makerere - Kikoni Western Gate",
  });

  if (existingLocations.length > 0) {
    logger.info("Makerere pickup location already exists. Skipping.");
    return;
  }

  // Create Makerere - Kikoni Western Gate pickup location
  const pickupLocation = await pickupLocationService.createPickupLocations({
    name: "Makerere - Kikoni Western Gate",
    address: "Kikoni Western Gate",
    city: "Kampala",
    phone: "+256700000000", // You can update this later
    is_active: true,
    opening_hours: JSON.stringify({
      monday: "8:00 AM - 6:00 PM",
      tuesday: "8:00 AM - 6:00 PM",
      wednesday: "8:00 AM - 6:00 PM",
      thursday: "8:00 AM - 6:00 PM",
      friday: "8:00 AM - 6:00 PM",
      saturday: "9:00 AM - 3:00 PM",
      sunday: "Closed",
    }),
    metadata: {
      landmark: "Near Makerere University Western Gate",
      district: "Kampala",
    },
  });

  logger.info(`✅ Created pickup location: ${pickupLocation.name} (${pickupLocation.id})`);
  logger.info("Pickup location details:");
  logger.info(`  Address: ${pickupLocation.address}, ${pickupLocation.city}`);
  logger.info(`  Phone: ${pickupLocation.phone}`);
  logger.info(`  Status: ${pickupLocation.is_active ? "Active" : "Inactive"}`);

  logger.info("✅ Pickup locations seeded successfully!");
}
