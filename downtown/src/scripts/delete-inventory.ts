import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function deleteInventoryLevels({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const inventoryService = container.resolve(Modules.INVENTORY);

  const locationId = "sloc_01KDYJH3RX3FASH91PWK0RXP7T";

  logger.info(`Deleting inventory levels for location: ${locationId}...`);

  try {
    // List all inventory levels for this location
    const levels = await inventoryService.listInventoryLevels({
      location_id: locationId,
    });

    logger.info(`Found ${levels.length} inventory levels to delete`);

    for (const level of levels) {
      logger.info(
        `  Deleting level ${level.id} (item: ${level.inventory_item_id})...`
      );
      await inventoryService.deleteInventoryLevels(level.id);
    }

    logger.info("✅ All inventory levels deleted!");
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
  }
}
