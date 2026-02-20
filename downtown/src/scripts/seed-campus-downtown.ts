import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

// Makerere University Pickup Locations
const MAKERERE_PICKUP_LOCATIONS = [
  {
    name: "Main Gate Pickup",
    address: {
      address_1: "University Road, Main Gate",
      city: "Kampala",
      country_code: "ug",
      postal_code: "256",
    },
    metadata: {
      building_name: "Main Gate Security Post",
      campus_zone: "entrance",
      coordinates: {
        latitude: 0.3346,
        longitude: 32.569,
      },
      operating_hours: {
        monday: "07:00-20:00",
        tuesday: "07:00-20:00",
        wednesday: "07:00-20:00",
        thursday: "07:00-20:00",
        friday: "07:00-20:00",
        saturday: "08:00-18:00",
        sunday: "10:00-16:00",
      },
      description:
        "Main entrance to Makerere University. Pickup at the security desk near the main sign.",
      landmarks: ["University main sign", "Opposite Wandegeya market"],
      contact_phone: "+256700000001",
    },
  },
  {
    name: "Main Library Pickup",
    address: {
      address_1: "Makerere University Library",
      city: "Kampala",
      country_code: "ug",
      postal_code: "256",
    },
    metadata: {
      building_name: "Makerere University Main Library",
      campus_zone: "central",
      coordinates: {
        latitude: 0.334,
        longitude: 32.5685,
      },
      operating_hours: {
        monday: "08:00-22:00",
        tuesday: "08:00-22:00",
        wednesday: "08:00-22:00",
        thursday: "08:00-22:00",
        friday: "08:00-22:00",
        saturday: "08:00-18:00",
        sunday: "10:00-18:00",
      },
      description:
        "Pickup at the main library entrance. Look for the Campus DownTown desk near the security checkpoint.",
      landmarks: ["Freedom Square", "Senate Building"],
      contact_phone: "+256700000002",
    },
  },
  {
    name: "COCIS Hub",
    address: {
      address_1: "College of Computing and Information Sciences",
      city: "Kampala",
      country_code: "ug",
      postal_code: "256",
    },
    metadata: {
      building_name: "Block A, COCIS",
      campus_zone: "cocis",
      coordinates: {
        latitude: 0.3335,
        longitude: 32.5675,
      },
      operating_hours: {
        monday: "08:00-18:00",
        tuesday: "08:00-18:00",
        wednesday: "08:00-18:00",
        thursday: "08:00-18:00",
        friday: "08:00-18:00",
        saturday: "09:00-14:00",
        sunday: "closed",
      },
      description:
        "Tech hub pickup point. Located at the COCIS Block A entrance, ground floor.",
      landmarks: ["COCIS Block A", "Near the computer labs"],
      contact_phone: "+256700000003",
    },
  },
  {
    name: "Student Center (Mitchell Hall)",
    address: {
      address_1: "Mitchell Hall, Halls Area",
      city: "Kampala",
      country_code: "ug",
      postal_code: "256",
    },
    metadata: {
      building_name: "Mitchell Hall",
      campus_zone: "halls",
      coordinates: {
        latitude: 0.333,
        longitude: 32.568,
      },
      operating_hours: {
        monday: "07:00-21:00",
        tuesday: "07:00-21:00",
        wednesday: "07:00-21:00",
        thursday: "07:00-21:00",
        friday: "07:00-21:00",
        saturday: "08:00-20:00",
        sunday: "10:00-20:00",
      },
      description:
        "Student residential area pickup. Perfect for hall residents. Located at Mitchell Hall reception.",
      landmarks: ["Mitchell Hall", "Near Lumumba Hall"],
      contact_phone: "+256700000004",
    },
  },
  {
    name: "Science Building",
    address: {
      address_1: "Faculty of Science",
      city: "Kampala",
      country_code: "ug",
      postal_code: "256",
    },
    metadata: {
      building_name: "Faculty of Science Building",
      campus_zone: "science",
      coordinates: {
        latitude: 0.3345,
        longitude: 32.567,
      },
      operating_hours: {
        monday: "08:00-17:00",
        tuesday: "08:00-17:00",
        wednesday: "08:00-17:00",
        thursday: "08:00-17:00",
        friday: "08:00-17:00",
        saturday: "closed",
        sunday: "closed",
      },
      description:
        "Science campus pickup point. Located at the main Faculty of Science building entrance.",
      landmarks: ["Chemistry labs", "Physics department"],
      contact_phone: "+256700000005",
    },
  },
];

export default async function seedCampusDowntown({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  logger.info("🎓 Starting Campus DownTown seed...");

  // Get or create store
  const [store] = await storeModuleService.listStores();

  // Update store with UGX currency
  logger.info("Setting up store with UGX currency...");
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: "ugx",
            is_default: true,
          },
          {
            currency_code: "usd",
            is_default: false,
          },
        ],
        name: "Campus DownTown",
      },
    },
  });

  // Create or get sales channel
  let salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Campus DownTown",
  });

  if (!salesChannels.length) {
    logger.info("Creating Campus DownTown sales channel...");
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "Campus DownTown",
            description: "Makerere University student marketplace",
          },
        ],
      },
    });
    salesChannels = result;
  }

  const salesChannel = salesChannels[0];

  // Update store default sales channel
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: salesChannel.id,
      },
    },
  });

  // Create Uganda region
  logger.info("Creating Uganda region...");
  let region;
  try {
    const { result: regionResult } = await createRegionsWorkflow(container).run(
      {
        input: {
          regions: [
            {
              name: "Uganda",
              currency_code: "ugx",
              countries: ["ug"],
              payment_providers: [
                "pp_iotec-pay_iotec",
              ],
            },
          ],
        },
      }
    );
    region = regionResult[0];
  } catch (e) {
    logger.info("Uganda region may already exist, continuing...");
  }

  // Create tax region for Uganda (18% VAT)
  logger.info("Creating tax region for Uganda...");
  try {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "ug",
          default_tax_rate: {
            rate: 18,
            name: "VAT",
          },
        },
      ],
    });
  } catch (e) {
    logger.info("Tax region may already exist, continuing...");
  }

  // Create shipping profile for Campus DownTown
  logger.info("Creating shipping profile...");
  let shippingProfile;
  try {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Campus Pickup",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  } catch (e) {
    logger.info("Shipping profile may already exist, continuing...");
    const profiles = await fulfillmentModuleService.listShippingProfiles({});
    shippingProfile = profiles[0];
  }

  // Create stock locations for Makerere pickup points
  logger.info("Creating Makerere University pickup locations...");
  const { result: stockLocationsResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: MAKERERE_PICKUP_LOCATIONS,
    },
  });

  // Link stock locations to sales channel
  for (const location of stockLocationsResult) {
    logger.info(`Linking ${location.name} to sales channel...`);
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: location.id,
        add: [salesChannel.id],
      },
    });
  }

  // Create fulfillment set for pickup
  logger.info("Creating pickup fulfillment set...");
  let fulfillmentSet;
  const existingSets = await fulfillmentModuleService.listFulfillmentSets({
    name: "Campus Pickup",
  });

  if (existingSets.length) {
    fulfillmentSet = existingSets[0];
    logger.info("Using existing Campus Pickup fulfillment set");
  } else {
    const fulfillmentSets =
      await fulfillmentModuleService.createFulfillmentSets([
        {
          name: "Campus Pickup",
          type: "pickup",
        },
      ]);
    fulfillmentSet = fulfillmentSets[0];
  }

  // Create service zones and shipping options for each location
  for (const location of stockLocationsResult) {
    logger.info(`Setting up fulfillment for ${location.name}...`);

    // Create service zone for this location
    let serviceZone;
    const existingZones = await fulfillmentModuleService.listServiceZones({
      name: `${location.name} Zone`,
    });

    if (existingZones.length) {
      serviceZone = existingZones[0];
    } else {
      serviceZone = await fulfillmentModuleService.createServiceZones({
        name: `${location.name} Zone`,
        fulfillment_set_id: fulfillmentSet.id,
        geo_zones: [
          {
            type: "country",
            country_code: "ug",
          },
        ],
      });
    }

    // Create shipping option for this pickup location
    try {
      await createShippingOptionsWorkflow(container).run({
        input: [
          {
            name: `Pickup at ${location.name}`,
            price_type: "flat",
            service_zone_id: serviceZone.id,
            shipping_profile_id: shippingProfile.id,
            provider_id: "manual_manual",
            type: {
              label: "Pickup",
              description: `Campus pickup at ${location.name}`,
              code: "pickup",
            },
            prices: [
              {
                currency_code: "ugx",
                amount: 0, // Free pickup
              },
              {
                currency_code: "usd",
                amount: 0,
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
            data: {
              location_id: location.id,
              location_name: location.name,
              metadata: location.metadata,
            },
          },
        ],
      });
    } catch (e: any) {
      logger.warn(
        `Could not create shipping option for ${location.name}: ${
          e.message || e
        }`
      );
    }
  }

  logger.info("✅ Campus DownTown seed completed!");
  logger.info(`
📍 Created ${stockLocationsResult.length} pickup locations:
${stockLocationsResult.map((l) => `   - ${l.name}`).join("\n")}

💰 Currency: UGX (Ugandan Shilling)
🌍 Region: Uganda
📦 Sales Channel: Campus DownTown

To run the Medusa server: npx medusa develop
  `);
}
