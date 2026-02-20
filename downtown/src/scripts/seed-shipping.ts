import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { ExecArgs } from "@medusajs/framework/types";
import {
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
} from "@medusajs/medusa/core-flows";

// Use the custom downtown fulfillment provider
const PROVIDER_ID = "downtown-fulfillment_downtown-fulfillment";

/**
 * Seed shipping options for Downtown marketplace
 * - Pickup Station: Flat rate 2000 UGX
 * - Door Delivery: 5% of cart total (calculated shipping)
 *
 * Run with: npx medusa exec src/scripts/seed-shipping.ts
 */
export default async function seedShipping({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  logger.info("Setting up Downtown shipping options...");

  // Get stock location
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });

  if (stockLocations.length === 0) {
    logger.error("No stock location found! Please run seed first.");
    return;
  }

  const stockLocation = stockLocations[0];
  logger.info(
    `Using stock location: ${stockLocation.name} (${stockLocation.id})`
  );

  // Link fulfillment provider to stock location (if not already linked)
  try {
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: PROVIDER_ID,
      },
    });
    logger.info(`Linked provider ${PROVIDER_ID} to stock location`);
  } catch (error: any) {
    // Link might already exist
    logger.info(`Provider link already exists or error: ${error.message}`);
  }

  // Get or create shipping profile
  let shippingProfile;
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });

  if (shippingProfiles.length > 0) {
    shippingProfile = shippingProfiles[0];
    logger.info(`Using existing shipping profile: ${shippingProfile.id}`);
  } else {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Downtown Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
    logger.info(`Created shipping profile: ${shippingProfile.id}`);
  }

  // Get region for Uganda
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  });

  let ugandaRegion = regions.find(
    (r: any) =>
      r.currency_code === "ugx" || r.name?.toLowerCase().includes("uganda")
  );

  if (!ugandaRegion) {
    logger.warn("Uganda region not found, using first available region");
    ugandaRegion = regions[0];
  }

  if (!ugandaRegion) {
    logger.error("No regions found! Please seed regions first.");
    return;
  }

  logger.info(`Using region: ${ugandaRegion.name} (${ugandaRegion.id})`);

  // Check for existing fulfillment sets with service zones
  const existingFulfillmentSets =
    await fulfillmentModuleService.listFulfillmentSets(
      { name: "Downtown Delivery" },
      { relations: ["service_zones", "service_zones.geo_zones"] }
    );

  let fulfillmentSet;
  let serviceZone;

  if (existingFulfillmentSets.length > 0) {
    fulfillmentSet = existingFulfillmentSets[0];
    logger.info(`Using existing fulfillment set: ${fulfillmentSet.id}`);

    // Check if it has service zones
    if (
      fulfillmentSet.service_zones &&
      fulfillmentSet.service_zones.length > 0
    ) {
      serviceZone = fulfillmentSet.service_zones[0];
      logger.info(
        `Using existing service zone: ${serviceZone.name} (${serviceZone.id})`
      );
    } else {
      // Add service zone to existing fulfillment set
      logger.info("Adding service zone to existing fulfillment set...");
      const newServiceZone = await fulfillmentModuleService.createServiceZones({
        fulfillment_set_id: fulfillmentSet.id,
        name: "Uganda",
        geo_zones: [
          {
            country_code: "ug",
            type: "country",
          },
        ],
      });
      serviceZone = newServiceZone;
      logger.info(
        `Created service zone: ${serviceZone.name} (${serviceZone.id})`
      );
    }
  } else {
    // Create fulfillment set for Uganda
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Downtown Delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Uganda",
          geo_zones: [
            {
              country_code: "ug",
              type: "country",
            },
          ],
        },
      ],
    });
    serviceZone = fulfillmentSet.service_zones[0];
    logger.info(`Created fulfillment set: ${fulfillmentSet.id}`);
    logger.info(
      `Created service zone: ${serviceZone.name} (${serviceZone.id})`
    );

    // Link fulfillment set to stock location
    const { data: stockLocations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
    });

    if (stockLocations.length > 0) {
      await link.create({
        [Modules.STOCK_LOCATION]: {
          stock_location_id: stockLocations[0].id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_set_id: fulfillmentSet.id,
        },
      });
      logger.info(
        `Linked fulfillment set to stock location: ${stockLocations[0].name}`
      );
    }
  }

  if (!serviceZone) {
    logger.error("No service zone available!");
    return;
  }

  // Check for existing shipping options
  const existingShippingOptions =
    await fulfillmentModuleService.listShippingOptions({});
  const hasPickup = existingShippingOptions.some(
    (o: any) => o.name === "Pickup Station"
  );
  const hasDoorDelivery = existingShippingOptions.some(
    (o: any) => o.name === "Door Delivery"
  );

  const shippingOptionsToCreate: any[] = [];

  // Pickup Station - Flat rate 2000 UGX
  if (!hasPickup) {
    shippingOptionsToCreate.push({
      name: "Pickup Station",
      price_type: "flat",
      provider_id: PROVIDER_ID,
      service_zone_id: serviceZone.id,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Pickup Station",
        description: "Pick up your order from a nearby station. UGX 2,000",
        code: "pickup-station",
      },
      prices: [
        {
          currency_code: "ugx",
          amount: 2000,
        },
        {
          region_id: ugandaRegion.id,
          amount: 2000,
        },
      ],
      rules: [
        {
          attribute: "enabled_in_store",
          value: "true",
          operator: "eq",
        },
        {
          attribute: "is_return",
          value: "false",
          operator: "eq",
        },
      ],
    });
    logger.info("Will create Pickup Station shipping option (2000 UGX)");
  } else {
    logger.info("Pickup Station shipping option already exists");
  }

  // Door Delivery - 5% of cart total (calculated shipping)
  if (!hasDoorDelivery) {
    shippingOptionsToCreate.push({
      name: "Door Delivery",
      price_type: "calculated",
      provider_id: PROVIDER_ID,
      service_zone_id: serviceZone.id,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Door Delivery",
        description:
          "Delivered to your doorstep. 5% of cart total (min. 5,000 UGX)",
        code: "door-delivery",
      },
      data: {
        id: "door-delivery",
      },
      rules: [
        {
          attribute: "enabled_in_store",
          value: "true",
          operator: "eq",
        },
        {
          attribute: "is_return",
          value: "false",
          operator: "eq",
        },
      ],
    });
    logger.info(
      "Will create Door Delivery shipping option (5% of cart, min 5000 UGX)"
    );
  } else {
    logger.info("Door Delivery shipping option already exists");
  }

  if (shippingOptionsToCreate.length > 0) {
    try {
      await createShippingOptionsWorkflow(container).run({
        input: shippingOptionsToCreate,
      });
      logger.info(
        `✅ Created ${shippingOptionsToCreate.length} shipping options`
      );
    } catch (error: any) {
      logger.error(`Failed to create shipping options: ${error.message}`);
    }
  } else {
    logger.info("No new shipping options to create");
  }

  logger.info("✅ Downtown shipping setup complete!");
}
