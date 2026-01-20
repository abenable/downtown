import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Delete existing shipping options to allow recreation
 * Run with: npx medusa exec src/scripts/delete-shipping-options.ts
 */
export default async function deleteShippingOptions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  logger.info("Deleting existing shipping options...");

  const existingShippingOptions =
    await fulfillmentModuleService.listShippingOptions({});

  for (const option of existingShippingOptions) {
    try {
      await fulfillmentModuleService.deleteShippingOptions(option.id);
      logger.info(`Deleted shipping option: ${option.name} (${option.id})`);
    } catch (error: any) {
      logger.error(`Failed to delete ${option.name}: ${error.message}`);
    }
  }

  logger.info("✅ Done deleting shipping options");
}
