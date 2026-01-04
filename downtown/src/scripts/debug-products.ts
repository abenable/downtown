import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function debugProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productService = container.resolve(Modules.PRODUCT);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  logger.info("Fetching all products...");
  const products = await productService.listProducts({});
  logger.info(`Found ${products.length} products:`);
  products.forEach((p: any) => {
    logger.info(`  - ${p.title} (${p.id}) - status: ${p.status}`);
  });

  logger.info("\nFetching sales channels...");
  const salesChannels = await salesChannelService.listSalesChannels();
  salesChannels.forEach((sc: any) => {
    logger.info(`  - ${sc.name} (${sc.id})`);
  });

  // Check product-sales channel links
  logger.info("\nChecking product-sales channel associations...");
  for (const product of products) {
    try {
      const { data } = await query.graph({
        entity: "product",
        fields: ["id", "title", "sales_channels.*"],
        filters: { id: product.id },
      });
      if (data && data[0]) {
        const channels = data[0].sales_channels || [];
        logger.info(
          `  Product "${product.title}" is in ${channels.length} sales channels:`
        );
        channels.forEach((sc: any) => logger.info(`    - ${sc.name || sc.id}`));
      }
    } catch (e: any) {
      logger.info(
        `  Could not fetch channels for ${product.title}: ${e.message}`
      );
    }
  }
}
