import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function deleteAllOrders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const orderService = container.resolve(Modules.ORDER);

  logger.info("Fetching all orders...");

  try {
    const orders = await orderService.listOrders({});
    logger.info(`Found ${orders.length} orders to delete`);

    for (const order of orders) {
      logger.info(`  Deleting order ${order.id}...`);
      await orderService.deleteOrders(order.id);
    }

    logger.info("✅ All orders deleted!");
  } catch (error: any) {
    logger.error(`Error: ${error.message}`);
  }
}
