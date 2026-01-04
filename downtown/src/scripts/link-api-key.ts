import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows";

export default async function linkApiKeyToSalesChannel({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const apiKeyService = container.resolve(Modules.API_KEY);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Fetching API keys...");
  const apiKeys = await apiKeyService.listApiKeys();

  const publishableKey = apiKeys.find((key: any) => key.type === "publishable");
  if (!publishableKey) {
    logger.error("No publishable API key found!");
    return;
  }

  logger.info("Fetching sales channels...");
  const salesChannels = await salesChannelService.listSalesChannels();

  // Get all sales channel IDs
  const allChannelIds = salesChannels.map((sc: any) => sc.id);

  logger.info(
    `Linking API key "${publishableKey.title}" to ${allChannelIds.length} sales channels...`
  );

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableKey.id,
        add: allChannelIds,
      },
    });
    logger.info("✅ Successfully linked API key to all sales channels!");
  } catch (error: any) {
    logger.info(`Note: ${error.message}`);
  }
}
