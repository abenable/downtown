import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function checkLocations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION);

  logger.info("Fetching stock locations...");
  const locations = await stockLocationService.listStockLocations({});

  logger.info(`Found ${locations.length} location(s):`);
  locations.forEach((loc: any) => {
    logger.info(`  - ${loc.name} (${loc.id})`);
    if (loc.address) {
      logger.info(
        `    Address: ${loc.address.address_1 || ""}, ${
          loc.address.city || ""
        }, ${loc.address.country_code || ""}`
      );
    }
  });
}
