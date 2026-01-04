import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows";

export default async function setupDowntownChannel({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const apiKeyService = container.resolve(Modules.API_KEY);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Fetching sales channels...");
  const salesChannels = await salesChannelService.listSalesChannels();

  const downtownChannel = salesChannels.find(
    (sc: any) => sc.name === "DownTown Sales Channel"
  );
  const otherChannels = salesChannels.filter(
    (sc: any) => sc.name !== "DownTown Sales Channel"
  );

  if (!downtownChannel) {
    logger.error("DownTown Sales Channel not found!");
    return;
  }

  logger.info(`Found DownTown Sales Channel: ${downtownChannel.id}`);

  // Get publishable API key
  const apiKeys = await apiKeyService.listApiKeys();
  const publishableKey = apiKeys.find((key: any) => key.type === "publishable");

  if (!publishableKey) {
    logger.error("No publishable API key found!");
    return;
  }

  logger.info(`Linking API key to "DownTown Sales Channel" only...`);

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableKey.id,
        add: [downtownChannel.id],
        remove: otherChannels.map((sc: any) => sc.id),
      },
    });
    logger.info("✅ API key now linked to: DownTown Sales Channel");
  } catch (error: any) {
    logger.info(`Note: ${error.message}`);
  }
}
