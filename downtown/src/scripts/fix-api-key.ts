import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows";

export default async function fixApiKeySalesChannel({ container }: ExecArgs) {
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

  // Find the Campus DownTown sales channel (primary one)
  const campusChannel = salesChannels.find(
    (sc: any) => sc.name === "Campus DownTown"
  );
  const otherChannels = salesChannels.filter(
    (sc: any) => sc.name !== "Campus DownTown"
  );

  if (!campusChannel) {
    logger.error("Campus DownTown sales channel not found!");
    return;
  }

  logger.info(
    `Setting API key to use only "${campusChannel.name}" sales channel...`
  );

  try {
    // Remove other sales channels and keep only Campus DownTown
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableKey.id,
        add: [campusChannel.id],
        remove: otherChannels.map((sc: any) => sc.id),
      },
    });
    logger.info(
      "✅ API key now linked to single sales channel: Campus DownTown"
    );
  } catch (error: any) {
    logger.info(`Note: ${error.message}`);
  }
}
